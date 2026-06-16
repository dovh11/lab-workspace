from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectRead, ProjectListItem,
    MemberAdd, MemberRead, MemberUpdate,
)

router = APIRouter()


@router.get("/", response_model=List[ProjectListItem])
def list_projects(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all projects with optional status filter."""
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == status)
    projects = query.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for p in projects:
        item = ProjectListItem(
            project_id=p.project_id,
            title=p.title,
            description=p.description,
            status=p.status,
            created_at=p.created_at,
            member_count=len(p.members),
        )
        result.append(item)
    return result


@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new project and automatically add the creator as Lead."""
    project = Project(
        title=project_in.title,
        description=project_in.description,
        status=project_in.status,
        created_by=current_user.user_id,
    )
    db.add(project)
    db.flush()  # Get project_id before commit

    # Auto-add creator as Lead member
    member = ProjectMember(
        project_id=project.project_id,
        user_id=current_user.user_id,
        role_in_project="Lead",
    )
    db.add(member)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get full project details including members."""
    project = (
        db.query(Project)
        .options(
            joinedload(Project.creator),
            joinedload(Project.members).joinedload(ProjectMember.user),
        )
        .filter(Project.project_id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update project details."""
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a project."""
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()


# ---- Member management ----

@router.get("/{project_id}/members", response_model=List[MemberRead])
def list_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all members of a project."""
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.members


@router.post("/{project_id}/members", response_model=MemberRead, status_code=status.HTTP_201_CREATED)
def add_member(
    project_id: int,
    member_in: MemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add a member to a project."""
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check user exists
    user = db.query(User).filter(User.user_id == member_in.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check already a member
    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == member_in.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")

    member = ProjectMember(
        project_id=project_id,
        user_id=member_in.user_id,
        role_in_project=member_in.role_in_project,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove a member from a project."""
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    db.commit()
