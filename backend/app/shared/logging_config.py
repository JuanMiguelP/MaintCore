"""Logging profesional con rotaci\u00f3n y archivos separados."""

import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

APP_LOG_FILE = LOG_DIR / "app.log"
ERROR_LOG_FILE = LOG_DIR / "error.log"

APP_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
APP_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logging(level: str = "INFO") -> None:
    """Configura logging con rotaci\u00f3n y archivos separados."""
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Formatter
    formatter = logging.Formatter(APP_FORMAT, datefmt=APP_DATE_FORMAT)

    # Handler: stdout (solo warnings+)
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setLevel(logging.WARNING)
    stream_handler.setFormatter(formatter)
    root_logger.addHandler(stream_handler)

    # Handler: app.log (todos los niveles, rotaci\u00f3n 5MB x 5 archivos)
    app_handler = RotatingFileHandler(
        APP_LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    app_handler.setLevel(logging.INFO)
    app_handler.setFormatter(formatter)
    root_logger.addHandler(app_handler)

    # Handler: error.log (solo errores, rotaci\u00f3n 5MB x 5 archivos)
    error_handler = RotatingFileHandler(
        ERROR_LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    root_logger.addHandler(error_handler)


# Loggers especializados
app_logger = logging.getLogger("maintcore.app")
error_logger = logging.getLogger("maintcore.errors")
audit_logger = logging.getLogger("maintcore.audit")

