import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_active_user
from app.core.config import settings
from app.models.user import User
from app.models.document import Document, DocumentVersion
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentRead, VersionRead

router = APIRouter()


@router.get("/", response_model=List[DocumentRead])
def list_documents(
    project_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List documents, optionally filtered by project."""
    query = db.query(Document).options(
        joinedload(Document.creator),
        joinedload(Document.versions).joinedload(DocumentVersion.uploader),
    )
    if project_id:
        query = query.filter(Document.project_id == project_id)

    documents = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for doc in documents:
        versions_sorted = sorted(doc.versions, key=lambda v: v.version_number, reverse=True)
        item = DocumentRead(
            document_id=doc.document_id,
            project_id=doc.project_id,
            title=doc.title,
            doc_type=doc.doc_type,
            description=doc.description,
            created_by=doc.created_by,
            creator=doc.creator,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
            latest_version=versions_sorted[0] if versions_sorted else None,
            version_count=len(doc.versions),
        )
        result.append(item)
    return result


@router.post("/", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def create_document(
    doc_in: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a document record (without uploading a file yet)."""
    document = Document(
        project_id=doc_in.project_id,
        title=doc_in.title,
        doc_type=doc_in.doc_type,
        description=doc_in.description,
        created_by=current_user.user_id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return DocumentRead(
        document_id=document.document_id,
        project_id=document.project_id,
        title=document.title,
        doc_type=document.doc_type,
        description=document.description,
        created_by=document.created_by,
        creator=None,
        created_at=document.created_at,
        updated_at=document.updated_at,
        latest_version=None,
        version_count=0,
    )


@router.get("/{document_id}", response_model=DocumentRead)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    doc = db.query(Document).options(
        joinedload(Document.creator),
        joinedload(Document.versions).joinedload(DocumentVersion.uploader),
    ).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    versions_sorted = sorted(doc.versions, key=lambda v: v.version_number, reverse=True)
    return DocumentRead(
        document_id=doc.document_id,
        project_id=doc.project_id,
        title=doc.title,
        doc_type=doc.doc_type,
        description=doc.description,
        created_by=doc.created_by,
        creator=doc.creator,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        latest_version=versions_sorted[0] if versions_sorted else None,
        version_count=len(doc.versions),
    )


@router.patch("/{document_id}", response_model=DocumentRead)
def update_document(
    document_id: int,
    doc_in: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    update_data = doc_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(doc, key, value)

    db.commit()
    db.refresh(doc)
    return get_document(document_id, db, current_user)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()


# ---- Version Control ----

@router.get("/{document_id}/versions", response_model=List[VersionRead])
def list_versions(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all versions of a document (commit history)."""
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    versions = (
        db.query(DocumentVersion)
        .options(joinedload(DocumentVersion.uploader))
        .filter(DocumentVersion.document_id == document_id)
        .order_by(DocumentVersion.version_number.desc())
        .all()
    )
    return versions


@router.post("/{document_id}/versions", response_model=VersionRead, status_code=status.HTTP_201_CREATED)
async def upload_version(
    document_id: int,
    file: UploadFile = File(...),
    commit_message: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upload a new version of a document file."""
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Determine next version number
    latest = (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == document_id)
        .order_by(DocumentVersion.version_number.desc())
        .first()
    )
    next_version = (latest.version_number + 1) if latest else 1

    # Save file with unique name
    ext = os.path.splitext(file.filename or "")[1]
    unique_name = f"doc_{document_id}_v{next_version}_{uuid.uuid4().hex[:8]}{ext}"
    save_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    content = await file.read()
    with open(save_path, "wb") as f:
        f.write(content)

    version = DocumentVersion(
        document_id=document_id,
        version_number=next_version,
        commit_message=commit_message,
        file_path=f"/uploads/{unique_name}",
        file_size=len(content),
        uploaded_by=current_user.user_id,
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version
