import unicodedata
from typing import Union

from django.db.models import F, Expression
from django.db.models.functions import Lower
from django.contrib.postgres.search import Unaccent


def normalize(field: Union[str, F, Expression]):
    """
    Normaliza un campo de la BD para búsquedas:
    - sin acentos (unaccent)
    - en minúsculas (lower)
    - compatible con icontains
    - acepta strings o expresiones F()
    """
    return Lower(Unaccent(field))


def normalize_token(token: str) -> str:
    """
    Normaliza un token ingresado por el usuario:
    - minúsculas
    - sin acentos
    - sin caracteres combinados
    """
    token = token.lower()
    token = unicodedata.normalize("NFKD", token)
    return "".join(c for c in token if not unicodedata.combining(c))
