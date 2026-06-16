import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


class RSVPStatus(str, enum.Enum):
    ATTENDING = "Attending"
    DECLINED = "Declined"
    MAYBE = "Maybe"
    PENDING = "Pending"


class JournalClub(Base):
    __tablename__ = "journal_clubs"

    club_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    topic = Column(String(300), nullable=True)
    meeting_time = Column(DateTime, nullable=False)
    location_or_link = Column(String(500), nullable=True)
    paper_reference = Column(Text, nullable=True)  # URL or citation string
    paper_pdf_url = Column(String(500), nullable=True)  # Direct PDF link
    notes = Column(Text, nullable=True)
    host_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    host = relationship("User", foreign_keys=[host_id])
    attendees = relationship(
        "JournalClubAttendee",
        back_populates="club",
        cascade="all, delete-orphan",
    )


class JournalClubAttendee(Base):
    __tablename__ = "journal_club_attendees"

    id = Column(Integer, primary_key=True, autoincrement=True)
    club_id = Column(Integer, ForeignKey("journal_clubs.club_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    rsvp_status = Column(
        Enum(RSVPStatus, name="rsvpstatus"),
        nullable=False,
        default=RSVPStatus.PENDING,
    )
    responded_at = Column(DateTime, nullable=True)

    # Relationships
    club = relationship("JournalClub", back_populates="attendees")
    user = relationship("User", foreign_keys=[user_id])
