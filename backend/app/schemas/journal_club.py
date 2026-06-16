from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.journal_club import RSVPStatus
from app.schemas.user import UserPublic


class JournalClubCreate(BaseModel):
    title: str
    topic: Optional[str] = None
    meeting_time: datetime
    location_or_link: Optional[str] = None
    paper_reference: Optional[str] = None
    paper_pdf_url: Optional[str] = None
    notes: Optional[str] = None


class JournalClubUpdate(BaseModel):
    title: Optional[str] = None
    topic: Optional[str] = None
    meeting_time: Optional[datetime] = None
    location_or_link: Optional[str] = None
    paper_reference: Optional[str] = None
    paper_pdf_url: Optional[str] = None
    notes: Optional[str] = None


class AttendeeRead(BaseModel):
    id: int
    user_id: int
    rsvp_status: RSVPStatus
    responded_at: Optional[datetime]
    user: UserPublic

    model_config = {"from_attributes": True}


class JournalClubRead(BaseModel):
    club_id: int
    title: str
    topic: Optional[str]
    meeting_time: datetime
    location_or_link: Optional[str]
    paper_reference: Optional[str]
    paper_pdf_url: Optional[str]
    notes: Optional[str]
    host_id: Optional[int]
    host: Optional[UserPublic]
    attendees: List[AttendeeRead] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class RSVPUpdate(BaseModel):
    rsvp_status: RSVPStatus
