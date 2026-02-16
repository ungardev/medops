FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app
# Instalar dependencias de sistema necesarias para Django + PostgreSQL + WeasyPrint + Playwright
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    libgobject-2.0-0 \
    # Dependencias de Playwright
    libnspr4 \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2t64 \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
# Instalar Playwright y descargar navegadores
RUN pip install --no-cache-dir playwright==1.45.0 && \
    playwright install chromium
COPY . /app/
EXPOSE 8000