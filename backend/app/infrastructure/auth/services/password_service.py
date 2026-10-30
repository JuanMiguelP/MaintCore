"""Servicio de hashing de contrase\u00f1as usando bcrypt."""

from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class PasswordService:
    """Utilidades para hashing y verificaci\u00f3n de contrase\u00f1as."""

    @staticmethod
    def hash_password(plain: str) -> str:
        return pwd_context.hash(plain)

    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)
