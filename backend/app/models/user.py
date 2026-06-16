import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, DateTime
from app.db.session import Base


class SystemRole(str, enum.Enum):
    MANAGER = "Manager"
    RESEARCHER = "Researcher"
    INTERN = "Intern"


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    system_role = Column(
        Enum(SystemRole, name="systemrole"),
        nullable=False,
        default=SystemRole.RESEARCHER,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
