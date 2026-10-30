# MaintCore Backend — Dockerfile de producci\u00f3n
FROM python:3.12-slim AS base

WORKDIR /app

# No crear usuario root
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Dependencias Python
COPY pyproject.toml .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -e ".[dev]"

# Copiar c\u00f3digo
COPY app ./app
COPY seed.py .

# Directorios de logs y datos
RUN mkdir -p /app/logs /app/data && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
