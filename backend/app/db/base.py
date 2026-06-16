from app.db.session import Base  # noqa: F401 - Import all models here for Alembic to detect

from app.models.user import User  # noqa: F401
from app.models.project import Project, ProjectMember  # noqa: F401
from app.models.document import Document, DocumentVersion  # noqa: F401
from app.models.experiment import AIExperiment  # noqa: F401
from app.models.journal_club import JournalClub, JournalClubAttendee  # noqa: F401
