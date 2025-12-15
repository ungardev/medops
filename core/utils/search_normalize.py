import unicodedata
from typing import Union

from django.db.models import F, Expression, Value
from django.db.models.functions import Lower
from django.db.models import Func


class Translate(Func):
    """
    Wrapper para la función SQL translate(text, from, to)
    Permite reemplazar múltiples caracteres en una sola operación.
    """
    function = "translate"
    arity = 3


def normalize(field: Union[str, F, Expression]):
    """
    Normaliza un campo para búsqueda acento-insensible:
    - lower(field)
    - translate(lower(field), 'áéíóúÁÉÍÓÚñÑ', 'aeiouaeiounn')
    Funciona en cualquier Django + PostgreSQL.
    """
    return Translate(
        Lower(field),
        Value("áéíóúÁÉÍÓÚñÑ"),
        Value("aeiouaeiounn")
    )


def normalize_token(token: str) -> str:
    """
    Normaliza un token ingresado por el usuario:
    - minúsculas
    - elimina acentos vía unicodedata
    """
    token = token.lower()
    token = unicodedata.normalize("NFKD", token)
    return "".join(c for c in token if not unicodedata.combining(c))
