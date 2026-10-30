"""Respuestas est\u00e1ndar para la API."""

from pydantic import BaseModel


class MessageResponse(BaseModel):
    """Respuesta con mensaje gen\u00e9rico."""

    message: str


class PaginatedResponse(BaseModel):
    """Respuesta paginada gen\u00e9rica."""

    items: list
    total: int
    page: int
    page_size: int
    total_pages: int
