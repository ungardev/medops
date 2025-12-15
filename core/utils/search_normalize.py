import unicodedata
from typing import Union

from django.db.models import F, Expression
from django.db.models.functions import Lower


def normalize(field: Union[str, F, Expression]):
    """
    Normalización segura sin Unaccent porque no está disponible
    en esta versión de Django.
    """
    return Lower(field)


def normalize_token(token: str) -> str:
    token = token.lower()
    token = unicodedata.normalize("NFKD", token)
    return "".join(c for c in token if not unicodedata.combining(c))