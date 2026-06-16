from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.project import ProjectStatus, RoleInProject
from app.schemas.user import UserPublic


class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.ACTIVE


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None


class MemberRead(BaseModel):
    id: int
    user_id: int
    role_in_project: RoleInProject
    joined_at: datetime
    user: UserPublic

    model_config = {"from_attributes": True}


class ProjectRead(BaseModel):
    project_id: int
    title: str
    description: Optional[str]
    status: ProjectStatus
    created_by: Optional[int]
    creator: Optional[UserPublic]
    created_at: datetime
    updated_at: Optional[datetime]
    members: List[MemberRead] = []

    model_config = {"from_attributes": True}


class ProjectListItem(BaseModel):
    project_id: int
    title: str
    description: Optional[str]
    status: ProjectStatus
    created_at: datetime
    member_count: int = 0

    model_config = {"from_attributes": True}


class MemberAdd(BaseModel):
    user_id: int
    role_in_project: RoleInProject = RoleInProject.CONTRIBUTOR


class MemberUpdate(BaseModel):
    role_in_project: RoleInProject
