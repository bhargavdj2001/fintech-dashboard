"""
Routes — /auth
"""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_id
from app.models import User
from app.schemas import (
    ChangePasswordIn,
    LoginIn,
    RegisterIn,
    SessionOut,
    TokenOut,
    TwoFASetupOut,
    TwoFAVerifyIn,
    UpdateProfileIn,
    UserOut,
)
from app.services import auth_service
from app.session_cache import evict_session

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/exists")
def exists(email: str = Query(..., description="Email to check"), db: Session = Depends(get_db)):
    """Public — check whether a specific email address is already registered."""
    return {"exists": db.query(User).filter(User.email == email.strip().lower()).first() is not None}


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    try:
        return auth_service.register(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, request: Request, db: Session = Depends(get_db)):
    try:
        result = auth_service.login(
            db,
            payload,
            device=request.headers.get("X-Device-Name"),
            user_agent=request.headers.get("User-Agent"),
            ip=request.client.host if request.client else None,
        )
        return result
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


@router.post("/logout", status_code=204)
def logout(request: Request, db: Session = Depends(get_db)):
    jti = getattr(request.state, "jti", None)
    if jti:
        auth_service.logout(db, jti)


@router.get("/me", response_model=UserOut)
def me(user_id: uuid.UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/me", response_model=UserOut)
def update_profile(
    payload: UpdateProfileIn,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return auth_service.update_profile(db, user_id, payload)


@router.delete("/me", status_code=204)
def delete_account(
    request: Request,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    auth_service.delete_account(db, user_id)
    jti = getattr(request.state, "jti", None)
    if jti:
        evict_session(jti)


@router.post("/change-password", status_code=204)
def change_password(
    payload: ChangePasswordIn,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    try:
        auth_service.change_password(db, user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/sessions", response_model=List[SessionOut])
def list_sessions(request: Request, user_id: uuid.UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    jti = getattr(request.state, "jti", None)
    return auth_service.get_sessions(db, user_id, jti)


@router.delete("/sessions/{session_id}", status_code=204)
def revoke_session(session_id: uuid.UUID, user_id: uuid.UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    found = auth_service.revoke_session(db, user_id, session_id)
    if not found:
        raise HTTPException(status_code=404, detail="Session not found")


@router.post("/sessions/revoke-others", status_code=204)
def revoke_others(request: Request, user_id: uuid.UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    jti = getattr(request.state, "jti", None)
    auth_service.revoke_all_other_sessions(db, user_id, jti)


@router.post("/2fa/setup", response_model=TwoFASetupOut)
def setup_2fa(user_id: uuid.UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return auth_service.setup_2fa(db, user_id)


@router.post("/2fa/verify", status_code=204)
def verify_2fa(payload: TwoFAVerifyIn, user_id: uuid.UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        auth_service.verify_2fa(db, user_id, payload.code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/2fa/disable", status_code=204)
def disable_2fa(payload: TwoFAVerifyIn, user_id: uuid.UUID = Depends(get_current_user_id), db: Session = Depends(get_db)):
    try:
        auth_service.disable_2fa(db, user_id, payload.code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
