# core/scrapers/__init__.py
"""
Scrapers para enriquecimiento de datos de MEDOPZ.
"""
from .inhrr_scraper import INHRRScraper
from .medication_repository import MedicationRepository
__all__ = ['INHRRScraper', 'MedicationRepository']