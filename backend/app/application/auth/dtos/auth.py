"""DTOs del dominio de Autenticaci\u00f3n."""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str | None = Field(None, max_length=200)
    role_id: str | None = None


class UserUpdateRequest(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(None, max_length=200)
    is_active: bool | None = None
    role_id: str | None = None
    must_change_password: bool | None = None


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str | None
    role_name: str | None
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
