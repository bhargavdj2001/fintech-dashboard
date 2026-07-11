"""
Auth utilities — password hashing, JWT issuance/verification, TOTP 2FA.
"""
import base64
import datetime as dt
import os
import uuid
from io import BytesIO

import bcrypt
import jwt
import pyotp
import qrcode
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is not set in the environment or .env file")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL = dt.timedelta(days=7)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(user_id: uuid.UUID, jti: uuid.UUID) -> tuple[str, dt.datetime]:
    expires_at = dt.datetime.now(dt.timezone.utc) + ACCESS_TOKEN_TTL
    payload = {
        "sub": str(user_id),
        "jti": str(jti),
        "exp": expires_at,
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, expires_at


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def totp_provisioning_uri(secret: str, email: str) -> str:
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name="FinancialOS")


def verify_totp_code(secret: str, code: str) -> bool:
    return pyotp.totp.TOTP(secret).verify(code, valid_window=1)


def totp_qr_code_base64(uri: str) -> str:
    img = qrcode.make(uri)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()
