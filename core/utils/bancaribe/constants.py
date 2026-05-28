# Bancaribe API Constants
# API Documentation: https://developers.bancaribe.com.ve/

BANCARIBE_API_VERSION = "v1"
BANCARIBE_BASE_URL = "https://api.bancaribe.com.ve"

BANCARIBE_ENDPOINTS = {
    # OAuth2
    "oauth2_token": "/api/v1/oauth/token",
    "oauth2_revoke": "/api/v1/oauth/revoke",
    # Pago Móvil C2P (API #2) - Para vueltos
    "pago_movil_c2p": "/api/v2/pago-movil/c2p",
    # Transferencias (API #4) - Para pagar doctores
    "transferencias": "/api/v1/transferencias",
    "transferencia_estatus": "/api/v1/transferencias/{reference}/estatus",
    # Consulta Operaciones (API #9) - Verificación de Pago Móvil
    "consulta_operaciones": "/api/v1/consulta/operaciones",
    # Consulta Ops Plus (API #10) - Verificación avanzada
    "consulta_ops_plus": "/api/v1/consulta/ops-plus",
    # Notificaciones (API #3) - Webhook
    "webhook_register": "/api/v1/notificaciones/registro",
    "webhook_list": "/api/v1/notificaciones",
}

BANCARIBE_HTTP_METHODS = {
    "GET": "GET",
    "POST": "POST",
    "PATCH": "PATCH",
    "PUT": "PUT",
    "DELETE": "DELETE",
}

BANCARIBE_STATUS_CODES = {
    "00": "APROBADA",
    "01": "DECLINADA",
    "02": "DECLINADA",
    "03": "EN_PROCESO",
    "04": "REVERSADA",
    "05": "REVERSADA",
    "06": "REVERTIDA",
    "07": "REVERTIDA",
    "08": "EXPIRADA",
    "09": "CANCELADA",
    "10": "PENDIENTE",
}

BANCARIBE_BANKS = {
    "0102": "BANCO DE VENEZUELA",
    "0104": "BANCO VENEZOLANO DE CREDITO",
    "0105": "BANCO MERCANTIL",
    "0108": "BBVA PROVINCIAL",
    "0114": "BANCARIBE",
    "0115": "BANCO EXTERIOR",
    "0128": "BANCO CARONI",
    "0134": "BANESCO",
    "0137": "BANCO SOFITASA",
    "0138": "BANCO PLAZA",
    "0146": "BANGENTE",
    "0151": "BANCO FONDO COMUN",
    "0156": "100% BANCO",
    "0157": "DELSUR BANCO UNIVERSAL",
    "0163": "BANCO DEL TESORO",
    "0168": "BANCRECER",
    "0169": "R4 BANCO MICROFINANCIERO C.A.",
    "0171": "BANCO ACTIVO",
    "0172": "BANCAMIGA BANCO UNIVERSAL",
    "0173": "BANCO INTERNACIONAL DE DESARROLLO",
    "0174": "BANPLUS",
    "0175": "BANCO DIGITAL DE LOS TRABAJADORES",
    "0177": "BANFANB",
    "0178": "N58 BANCO DIGITAL",
    "0191": "BANCO NACIONAL DE CREDITO",
}

BANCARIBE_TRANSACTION_TYPES = {
    "P2C": "Pago Móvil C2P",
    "TRANSFER": "Transferencia",
    "QUERY": "Consulta",
}

BANCARIBE_WEBHOOK_EVENTS = {
    "PAGO_RECIBIDO": "pago_recibido",
    "TRANSFERENCIA_COMPLETADA": "transferencia_completada",
    "TRANSFERENCIA_FALLIDA": "transferencia_fallida",
    "REVERSO": "reverso",
}
