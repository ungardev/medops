# core/choices.py

UNIT_CHOICES = [
    ("mg", "Miligramos (mg)"),
    ("ml", "Mililitros (ml)"),
    ("g", "Gramos (g)"),
    ("mcg", "Microgramos (mcg)"),
    ("L", "Litros (L)"),
    ("tablet_unit", "Tableta(s)"),
    ("capsule_unit", "Cápsula(s)"),
    ("drop_unit", "Gota(s)"),
    ("puff_unit", "Puff(s)"),
    ("unit", "Unidad(es)"),
    ("IU", "Unidades Internacionales (IU)"),
    ("mEq", "Miliequivalentes (mEq)"),
    ("percent", "Porcentaje (%)"),
    ("patch", "Parche"),
    ("other", "Otro"),
]

ROUTE_CHOICES = [
    ("oral", "Oral"),
    ("intravenous", "Intravenosa (IV)"),
    ("intramuscular", "Intramuscular (IM)"),
    ("subcutaneous", "Subcutánea (SC)"),
    ("topical", "Tópica"),
    ("sublingual", "Sublingual"),
    ("inhalation", "Inhalación"),
    ("rectal", "Rectal"),
    ("ophthalmic", "Oftálmica"),
    ("otic", "Ótica"),
    ("nasal", "Nasal"),
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
    # Existentes
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
    ("tablet_coated", "Tableta Recubierta"),
    ("suspension", "Suspensión"),
    ("solution", "Solución"),
    ("ointment", "Ungüento"),
    ("inhaler", "Inhalador"),
    ("suppository", "Supositorio"),
    ("powder", "Polvo"),
    ("granules", "Gránulos"),
    ("mouthwash", "Enjuague"),
]

MEDICATION_STATUS_CHOICES = [
    ("VIGENTE", "Vigente"),
    ("CANCELADO", "Cancelado"),
    ("SUSPENDIDO", "Suspendido"),
    ("VENCIDO", "Vencido"),
]