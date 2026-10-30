"""DTOs de usuario."""

from pydantic import BaseModel


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str | None
    role_name: str | None
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


class UserCreateRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str | None = None
    role_id: str | None = None


class UserUpdateRequest(BaseModel):
    email: str | None = None
    full_name: str | None = None
    is_active: bool | None = None
    role_id: str | None = None
