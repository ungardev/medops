FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Cache bust: force Docker to ignore all cached layers
RUN date > /dev/null 2>&1

# ARG para build - se sobrescribe por ENV en Railway
ARG DJANGO_SECRET_KEY_BUILD=medopz-build-temp-key-2025

# INSTALAR dependencias de sistema necesarias para Django + PostgreSQL + WeasyPrint + Playwright
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
    tesseract-ocr \
    tesseract-ocr-spa \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

RUN pip install --no-cache-dir playwright==1.55.0 && \
    playwright install chromium

COPY . /app/
EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn --bind 0.0.0.0:8000 --workers 2 --timeout 120 medops.wsgi:application"]

# v4 - Cache invalidation: removed ./ prefix from COPY requirements.txt