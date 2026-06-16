from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User, SystemRole
from app.models.project import ProjectMember

def require_system_roles(current_user: User, allowed_roles: list[SystemRole]):
    if current_user.system_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have the required system role to perform this action.",
        )

def get_project_member_role(db: Session, project_id: int, user_id: int) -> str | None:
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
    ).first()
    if not member:
        return None
    return member.role_in_project

def require_project_access(db: Session, current_user: User, project_id: int, allowed_project_roles: list[str]):
    # Managers have full access everywhere
    if current_user.system_role == SystemRole.MANAGER:
        return

    # Check project-specific role
    member_role = get_project_member_role(db, project_id, current_user.user_id)
    
    if not member_role or member_role not in allowed_project_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have the required project permissions to perform this action.",
        )
