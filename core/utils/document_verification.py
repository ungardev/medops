"""
Document Verification Utilities for MEDOPZ
Centralizes URL generation for QR codes and verification pages.
"""

import logging
from django.conf import settings

logger = logging.getLogger(__name__)


VERIFICATION_DOMAIN = "www.medopz.com"


def get_verification_base_url() -> str:
    """
    Returns the base URL for document verification.
    Uses www.medopz.com as the primary domain.
    """
    return f"https://{VERIFICATION_DOMAIN}"


def get_verification_url(audit_code: str) -> str:
    """
    Generates the full verification URL for a document.

    Args:
        audit_code: The unique audit code of the document (12-char uppercase)

    Returns:
        Full URL: https://www.medopz.com/verify/{audit_code}
    """
    return f"{get_verification_base_url()}/verify/{audit_code}"


def get_qr_payload_for_document(audit_code: str) -> str:
    """
    Generates the payload to encode in QR codes.
    Points to the verification page for scanned documents.

    Args:
        audit_code: The unique audit code of the document

    Returns:
        URL string for QR code encoding
    """
    return get_verification_url(audit_code)


def get_document_display_name(audit_code: str) -> str:
    """
    Helper to get just the audit code formatted for display.
    Used in templates and error messages.

    Args:
        audit_code: The audit code

    Returns:
        Formatted audit code (uppercase, 12 chars)
    """
    return audit_code.upper() if audit_code else ""


def is_valid_audit_code_format(audit_code: str) -> bool:
    """
    Validates that an audit code has the expected format.
    MEDOPZ audit codes are SHA256 hashes truncated to 12 characters.

    Args:
        audit_code: The audit code string to validate

    Returns:
        True if valid format, False otherwise
    """
    if not audit_code:
        return False
    if len(audit_code) != 12:
        return False
    return audit_code.isalnum() and audit_code.isupper()
