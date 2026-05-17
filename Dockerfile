FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# ARG para build - se sobrescribe por ENV en Railway
ARG DJANGO_SECRET_KEY_BUILD=medopz-build-temp-key-2025
ENV DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY_BUILD}

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
    # OCR
    tesseract-ocr \
    tesseract-ocr-spa \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
# Instalar Playwright y descargar navegadores
RUN pip install --no-cache-dir playwright==1.45.0 && \
    playwright install chromium
COPY . /app/
RUN python manage.py collectstatic --noinput
EXPOSE 8000

# En Railway, el ENV DJANGO_SECRET_KEY se sobrescribirá con el valor real
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn --bind 0.0.0.0:8000 --workers 2 --timeout 120 medops.wsgi:application"]