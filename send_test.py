#!/usr/bin/env python3
"""
MEDOPZ - Script de Prueba de Envio de Email
Uso: python send_test.py
"""

import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medops.settings")
sys.path.insert(0, r"C:\Users\ungar\Documents\Dev\Web\project\medops")
django.setup()

from django.core.mail import send_mail
from django.conf import settings


def send_test_email():
    print("=" * 60)
    print("MEDOPZ - Prueba de Envio de Email")
    print("=" * 60)

    print(f"\n[CONFIG]")
    print(f"  EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"  EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"  EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"  DEFAULT_FROM: {settings.DEFAULT_FROM_EMAIL}")
    print(f"  API_KEY set: {'Si' if settings.EMAIL_HOST_PASSWORD else 'NO'}")

    destinatario = "ungardev@outlook.com"
    asunto = "[MEDOPZ] Prueba de Email Transaccional"
    mensaje = """
Hola desde MEDOPZ!

Este es un email de PRUEBA enviado desde la plataforma MEDOPZ.

Si recibiste este mensaje, la configuracion de email esta funcionando correctamente.

Salud desde Caracas, Venezuela
El equipo MEDOPZ
    """

    print(f"\n[ENVIANDO]")
    print(f"  De: {settings.DEFAULT_FROM_EMAIL}")
    print(f"  Para: {destinatario}")
    print(f"  Asunto: {asunto}")

    try:
        resultado = send_mail(
            subject=asunto,
            message=mensaje,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[destinatario],
            fail_silently=False,
        )

        if resultado == 1:
            print(f"\n[OK] Email enviado exitosamente!")
        else:
            print(f"\n[WARN] Resultado: {resultado}")

    except Exception as e:
        print(f"\n[ERROR] {e}")


if __name__ == "__main__":
    send_test_email()
