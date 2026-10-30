"""Excepciones personalizadas de la aplicaci\u00f3n."""

from http import HTTPStatus


class AppException(Exception):
    """Base para todas las excepciones de la aplicaci\u00f3n."""

    def __init__(self, message: str, status_code: int = HTTPStatus.BAD_REQUEST, details: dict | None = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class NotFoundError(AppException):
    """Recurso no encontrado."""

    def __init__(self, resource: str, identifier=None):
        msg = f"{resource} not found"
        if identifier is not None:
            msg += f": {identifier}"
        super().__init__(msg, HTTPStatus.NOT_FOUND)


class UnauthorizedError(AppException):
    """Credenciales inv\u00e1lidas o token expirado."""

    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, HTTPStatus.UNAUTHORIZED)


class ForbiddenError(AppException):
    """Usuario no tiene permiso para realizar la acci\u00f3n."""

    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, HTTPStatus.FORBIDDEN)


class ConflictError(AppException):
    """Recurso ya existe o conflicto de datos."""

    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message, HTTPStatus.CONFLICT)


class ValidationError(AppException):
    """Error de validaci\u00f3n de datos."""

    def __init__(self, message: str, field_errors: dict | None = None):
        super().__init__(message, HTTPStatus.UNPROCESSABLE_ENTITY, {"field_errors": field_errors or {}})
