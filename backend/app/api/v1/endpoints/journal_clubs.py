from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.journal_club import JournalClub, JournalClubAttendee
from app.schemas.journal_club import (
    JournalClubCreate, JournalClubUpdate, JournalClubRead, RSVPUpdate,
)

router = APIRouter()


@router.get("/", response_model=List[JournalClubRead])
def list_journal_clubs(
    upcoming_only: bool = False,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List journal clubs, optionally only upcoming ones."""
    query = db.query(JournalClub).options(
        joinedload(JournalClub.host),
        joinedload(JournalClub.attendees).joinedload(JournalClubAttendee.user),
    )
    if upcoming_only:
        query = query.filter(JournalClub.meeting_time >= datetime.utcnow())

    return query.order_by(JournalClub.meeting_time.asc()).offset(skip).limit(limit).all()


@router.post("/", response_model=JournalClubRead, status_code=status.HTTP_201_CREATED)
def create_journal_club(
    club_in: JournalClubCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new journal club meeting."""
    club = JournalClub(
        title=club_in.title,
        topic=club_in.topic,
        meeting_time=club_in.meeting_time,
        location_or_link=club_in.location_or_link,
        paper_reference=club_in.paper_reference,
        paper_pdf_url=club_in.paper_pdf_url,
        notes=club_in.notes,
        host_id=current_user.user_id,
    )
    db.add(club)
    db.commit()
    db.refresh(club)
    return club


@router.get("/{club_id}", response_model=JournalClubRead)
def get_journal_club(
    club_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    club = (
        db.query(JournalClub)
        .options(
            joinedload(JournalClub.host),
            joinedload(JournalClub.attendees).joinedload(JournalClubAttendee.user),
        )
        .filter(JournalClub.club_id == club_id)
        .first()
    )
    if not club:
        raise HTTPException(status_code=404, detail="Journal club not found")
    return club


@router.patch("/{club_id}", response_model=JournalClubRead)
def update_journal_club(
    club_id: int,
    club_in: JournalClubUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a journal club meeting."""
    club = db.query(JournalClub).filter(JournalClub.club_id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Journal club not found")

    update_data = club_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(club, key, value)

    db.commit()
    db.refresh(club)
    return club


@router.delete("/{club_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal_club(
    club_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    club = db.query(JournalClub).filter(JournalClub.club_id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Journal club not found")
    db.delete(club)
    db.commit()


# ---- RSVP ----

@router.post("/{club_id}/rsvp", response_model=JournalClubRead)
def rsvp_to_journal_club(
    club_id: int,
    rsvp_in: RSVPUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create or update RSVP for the current user."""
    club = db.query(JournalClub).filter(JournalClub.club_id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Journal club not found")

    existing = db.query(JournalClubAttendee).filter(
        JournalClubAttendee.club_id == club_id,
        JournalClubAttendee.user_id == current_user.user_id,
    ).first()

    if existing:
        existing.rsvp_status = rsvp_in.rsvp_status
        existing.responded_at = datetime.utcnow()
    else:
        attendee = JournalClubAttendee(
            club_id=club_id,
            user_id=current_user.user_id,
            rsvp_status=rsvp_in.rsvp_status,
            responded_at=datetime.utcnow(),
        )
        db.add(attendee)

    db.commit()
    return get_journal_club(club_id, db, current_user)
