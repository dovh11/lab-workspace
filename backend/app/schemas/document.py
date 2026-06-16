from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.document import DocType
from app.schemas.user import UserPublic


class DocumentCreate(BaseModel):
    project_id: int
    title: str
    doc_type: DocType = DocType.OTHER
    description: Optional[str] = None


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    doc_type: Optional[DocType] = None
    description: Optional[str] = None


class VersionRead(BaseModel):
    version_id: int
    document_id: int
    version_number: int
    commit_message: Optional[str]
    file_path: Optional[str]
    file_size: Optional[int]
    uploaded_by: Optional[int]
    uploader: Optional[UserPublic]
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentRead(BaseModel):
    document_id: int
    project_id: int
    title: str
    doc_type: DocType
    description: Optional[str]
    created_by: Optional[int]
    creator: Optional[UserPublic]
    created_at: datetime
    updated_at: Optional[datetime]
    latest_version: Optional[VersionRead] = None
    version_count: int = 0

    model_config = {"from_attributes": True}


class VersionCreate(BaseModel):
    commit_message: Optional[str] = None
