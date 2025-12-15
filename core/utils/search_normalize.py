import unicodedata
from typing import Union

from django.db.models import F, Expression, Value
from django.db.models.functions import Lower
from django.db.models import Func


class Translate(Func):
    function = "translate"
    arity = 3


def normalize(field: Union[str, F, Expression]):
    """
    Normaliza un campo para búsqueda acento-insensible usando
    translate(lower(field), 'áéíóúÁÉÍÓÚñÑ', 'aeiouaeiounn')
    """
    return Translate(
        Lower(field),
        Value("áéíóúÁÉÍÓÚñÑ"),
        Value("aeiouaeiounn")
    )


def normalize_token(token: str) -> str:
    token = token.lower()
    token = unicodedata.normalize("NFKD", token)
    return "".join(c for c in token if not unicodedata.combining(c))
