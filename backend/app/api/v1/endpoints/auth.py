import hashlib
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, Token, LoginRequest


def safe_hash_password(password: str) -> str:
    """
    Failsafe password hashing. Pre-hashes with SHA-256 before bcrypt
    to guarantee the 72-byte limit is never exceeded under any circumstance.
    """
    sha256_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    return get_password_hash(sha256_hash[:64])


def safe_verify_password(plain: str, hashed: str) -> bool:
    """
    Failsafe password verification. Mirrors safe_hash_password's pre-hash logic.
    """
    sha256_hash = hashlib.sha256(plain.encode('utf-8')).hexdigest()
    return verify_password(sha256_hash[:64], hashed)

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user and return a JWT token."""
    # Check uniqueness
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=safe_hash_password(user_in.password),
        full_name=user_in.full_name,
        system_role=user_in.system_role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.user_id)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2-compatible login endpoint — returns JWT token."""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not safe_verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(subject=user.user_id)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login/json", response_model=Token)
def login_json(login_in: LoginRequest, db: Session = Depends(get_db)):
    """JSON body login endpoint for frontend clients."""
    user = db.query(User).filter(User.username == login_in.username).first()
    if not user or not safe_verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token(subject=user.user_id)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Return the currently authenticated user."""
    return current_user
