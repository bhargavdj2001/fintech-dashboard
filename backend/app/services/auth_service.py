"""
Auth service — registration, login/logout, sessions, password change, TOTP 2FA.
"""
import datetime as dt
import uuid
from typing import Optional

from sqlalchemy.orm import Session as DbSession

from app.auth_utils import (
    create_access_token,
    generate_totp_secret,
    hash_password,
    totp_provisioning_uri,
    totp_qr_code_base64,
    verify_password,
    verify_totp_code,
)
from app.models import (
    Account,
    Budget,
    Goal,
    Household,
    Investment,
    InvestmentTransaction,
    NetWorthSnapshot,
    Profile,
    RecurringRule,
    Settlement,
    Transaction,
    TransactionSplit,
    UserSettings,
)
from app.models import Session as SessionModel
from app.models import User
from app.schemas import ChangePasswordIn, LoginIn, RegisterIn, UpdateProfileIn
from app.session_cache import evict_session


def register(db: DbSession, payload: RegisterIn) -> User:
    email = payload.email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise ValueError("Email already registered")
    user = User(
        id=uuid.uuid4(),
        email=email,
        name=payload.name,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.flush()

    display_name = payload.name or email.split("@")[0]
    household = Household(
        id=uuid.uuid4(),
        name=display_name,
        owner_user_id=user.id,
    )
    db.add(household)
    db.flush()

    profile = Profile(
        id=uuid.uuid4(),
        household_id=household.id,
        name=display_name,
        email=email,
        default_share=1.0,
        is_owner=True,
    )
    settings = UserSettings(
        id=uuid.uuid4(),
        household_id=household.id,
    )
    db.add(profile)
    db.add(settings)
    db.commit()
    db.refresh(user)
    return user


def login(
    db: DbSession, payload: LoginIn, device: Optional[str], user_agent: Optional[str], ip: Optional[str]
) -> dict:
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise ValueError("Invalid email or password")

    if user.totp_enabled:
        if not payload.totp_code:
            return {"access_token": "", "requires_totp": True}
        if not verify_totp_code(user.totp_secret, payload.totp_code):
            raise ValueError("Invalid 2FA code")

    jti = uuid.uuid4()
    token, expires_at = create_access_token(user.id, jti)
    session = SessionModel(
        id=uuid.uuid4(),
        user_id=user.id,
        jti=jti,
        device=device,
        user_agent=user_agent,
        ip_address=ip,
        expires_at=expires_at,
    )
    db.add(session)
    db.commit()
    return {"access_token": token, "requires_totp": False}


def logout(db: DbSession, jti: uuid.UUID) -> None:
    session = db.query(SessionModel).filter(SessionModel.jti == jti).first()
    if session:
        session.revoked = True
        db.commit()
    evict_session(jti)


def get_sessions(db: DbSession, user_id: uuid.UUID, current_jti: uuid.UUID) -> list:
    sessions = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == user_id, SessionModel.revoked == False)  # noqa: E712
        .order_by(SessionModel.last_seen_at.desc())
        .all()
    )
    for s in sessions:
        s.is_current = s.jti == current_jti
    return sessions


def revoke_session(db: DbSession, user_id: uuid.UUID, session_id: uuid.UUID) -> bool:
    session = (
        db.query(SessionModel)
        .filter(SessionModel.id == session_id, SessionModel.user_id == user_id)
        .first()
    )
    if not session:
        return False
    session.revoked = True
    db.commit()
    evict_session(session.jti)
    return True


def revoke_all_other_sessions(db: DbSession, user_id: uuid.UUID, current_jti: uuid.UUID) -> None:
    other_jtis = [
        s.jti for s in db.query(SessionModel)
        .filter(SessionModel.user_id == user_id, SessionModel.jti != current_jti)
        .all()
    ]
    db.query(SessionModel).filter(
        SessionModel.user_id == user_id, SessionModel.jti != current_jti
    ).update({"revoked": True})
    db.commit()
    for jti in other_jtis:
        evict_session(jti)


def change_password(db: DbSession, user_id: uuid.UUID, payload: ChangePasswordIn) -> None:
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not verify_password(payload.current_password, user.password_hash):
        raise ValueError("Current password is incorrect")
    user.password_hash = hash_password(payload.new_password)
    db.commit()


def setup_2fa(db: DbSession, user_id: uuid.UUID) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    secret = generate_totp_secret()
    user.totp_secret = secret
    db.commit()
    uri = totp_provisioning_uri(secret, user.email)
    return {
        "secret": secret,
        "provisioning_uri": uri,
        "qr_code_base64": totp_qr_code_base64(uri),
    }


def verify_2fa(db: DbSession, user_id: uuid.UUID, code: str) -> None:
    user = db.query(User).filter(User.id == user_id).first()
    if not user.totp_secret or not verify_totp_code(user.totp_secret, code):
        raise ValueError("Invalid 2FA code")
    user.totp_enabled = True
    db.commit()


def disable_2fa(db: DbSession, user_id: uuid.UUID, code: str) -> None:
    user = db.query(User).filter(User.id == user_id).first()
    if not user.totp_enabled or not verify_totp_code(user.totp_secret, code):
        raise ValueError("Invalid 2FA code")
    user.totp_enabled = False
    user.totp_secret = None
    db.commit()


def update_profile(db: DbSession, user_id: uuid.UUID, payload: UpdateProfileIn) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    data = payload.model_dump(exclude_none=True)
    for key, val in data.items():
        setattr(user, key, val)
    db.commit()
    db.refresh(user)
    return user


def delete_account(db: DbSession, user_id: uuid.UUID) -> None:
    """
    Danger zone — permanently delete this user's login, household, and all
    associated data. Scoped to the user's household only, so other users are
    not affected.
    """
    household = db.query(Household).filter(Household.owner_user_id == user_id).first()
    if household:
        hid = household.id
        for model in [
            TransactionSplit,
            Transaction,
            InvestmentTransaction,
            Investment,
            Budget,
            RecurringRule,
            Settlement,
            Goal,
            NetWorthSnapshot,
            UserSettings,
            Account,
            Profile,
        ]:
            db.query(model).filter(model.household_id == hid).delete()
        db.delete(household)

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)  # cascades to sessions via the ORM relationship
    db.commit()
