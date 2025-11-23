# core/choices.py

UNIT_CHOICES = [
    ("mg", "Miligramos"),
    ("ml", "Mililitros"),
    ("g", "Gramos"),
    ("tablet", "Tableta"),
    ("capsule", "Cápsula"),
    ("drop", "Gotas"),
    ("puff", "Inhalación"),
    ("unit", "Unidad"),
    ("patch", "Parche"),
]

ROUTE_CHOICES = [
    ("oral", "Oral"),
    ("iv", "Intravenosa"),
    ("im", "Intramuscular"),
    ("sc", "Subcutánea"),
    ("topical", "Tópica"),
    ("sublingual", "Sublingual"),
    ("inhalation", "Inhalación"),
    ("rectal", "Rectal"),
    ("other", "Otro"),
]

FREQUENCY_CHOICES = [
    ("once_daily", "Una vez al día"),
    ("bid", "Dos veces al día"),
    ("tid", "Tres veces al día"),
    ("qid", "Cuatro veces al día"),
    ("q4h", "Cada 4 horas"),
    ("q6h", "Cada 6 horas"),
    ("q8h", "Cada 8 horas"),
    ("q12h", "Cada 12 horas"),
    ("q24h", "Cada 24 horas"),
    ("qod", "Día por medio"),
    ("stat", "Una sola vez / Inmediato"),
    ("prn", "Según necesidad"),
    ("hs", "Al acostarse"),
    ("ac", "Antes de las comidas"),
    ("pc", "Después de las comidas"),
    ("achs", "Antes de comidas y al acostarse"),
]

PRESENTATION_CHOICES = [
    ("tablet", "Tableta"),
    ("capsule", "Cápsula"),
    ("syrup", "Jarabe"),
    ("drop", "Gotas"),
    ("injection", "Inyectable"),
    ("cream", "Crema"),
    ("gel", "Gel"),
    ("patch", "Parche"),
    ("spray", "Spray"),
    ("other", "Otro"),
]
