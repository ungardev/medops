# core/scrapers/inhrr_scraper.py
"""
Scraper para el Instituto Nacional de Higiene Rafael Rangel (INHRR).
Versión API - Usa el endpoint directo en lugar de scraping HTML.
"""
import asyncio
import re
import logging
import sys
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import httpx
audit = logging.getLogger("audit")
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
PRESENTATION_MAP = {
    'TABLETAS': 'tablet',
    'TABLETAS RECUBIERTAS': 'tablet_coated',
    'CÁPSULAS': 'capsule',
    'JARABES': 'syrup',
    'JARABE': 'syrup',
    'SOLUCIONES': 'solution',
    'SOLUCIÓN': 'solution',
    'SUSPENSIONES': 'suspension',
    'SUSPENSIÓN': 'suspension',
    'INYECTABLES': 'injection',
    'INYECTABLE': 'injection',
    'CREMAS': 'cream',
    'CREMA': 'cream',
    'UNGÜENTOS': 'ointment',
    'UNGÜENTO': 'ointment',
    'GELES': 'gel',
    'GEL': 'gel',
    'GOTAS': 'drop',
    'GOTAS OFTÁLMICAS': 'drop',
    'GOTAS NASALES': 'drop',
    'INHALADORES': 'inhaler',
    'INHALADOR': 'inhaler',
    'PARCHES': 'patch',
    'PARCHE': 'patch',
    'SPRAYS': 'spray',
    'SPRAY': 'spray',
    'SUPOSITORIOS': 'suppository',
    'SUPOSITORIO': 'suppository',
    'POLVOS': 'powder',
    'POLVO': 'powder',
    'GRÁNULOS': 'granules',
    'ENJUAGUES': 'mouthwash',
    'ENJUAGUE': 'mouthwash',
}
ROUTE_MAP = {
    'ORAL': 'oral',
    'INTRAVENOSA': 'intravenous',
    'INTRAMUSCULAR': 'intramuscular',
    'SUBCUTÁNEA': 'subcutaneous',
    'TÓPICA': 'topical',
    'SUBLINGUAL': 'sublingual',
    'RECTAL': 'rectal',
    'INHALACIÓN': 'inhalation',
    'OFTÁLMICA': 'ophthalmic',
    'NASAL': 'nasal',
}
STATUS_MAP = {
    'VIGENTE': 'VIGENTE',
    'VIGENTES': 'VIGENTE',
    'CANCELADO': 'CANCELADO',
    'SUSPENDIDO': 'SUSPENDIDO',
}
class INHRRScraper:
    """
    Scraper para el portal de medicamentos del INHRR usando API directa.
    """
    
    BASE_URL = "https://inhrr.gob.ve"
    API_URL = "https://inhrr.gob.ve/sismed/api/productos-farma"
    
    def __init__(
        self,
        headless: bool = True,  # Mantenido para compatibilidad
        rate_limit: float = 1.5,
        max_retries: int = 3,
        timeout: int = 30000
    ):
        self.rate_limit = rate_limit
        self.max_retries = max_retries
        self.timeout = timeout
        self.client: Optional[httpx.AsyncClient] = None
    
    async def __aenter__(self) -> 'INHRRScraper':
        """Entry point para async context manager."""
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(self.timeout / 1000),
            headers={
                'User-Agent': 'MEDOPZ-Bot/1.0 (+https://medopz.software)',
                'Accept': 'application/json',
            }
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Exit point para async context manager."""
        if self.client:
            await self.client.aclose()
        
    async def _fetch_all_medications(self) -> List[Dict[str, Any]]:
        """
        Obtiene todos los medicamentos desde la API.
        
        Returns:
            Lista de diccionarios con datos de medicamentos
        """
        # === FIX: Verificar que el cliente está inicializado ===
        if self.client is None:
            raise RuntimeError("HTTP client not initialized. Use 'async with' context manager.")
        
        print("INHRR_SCRAPER: Obteniendo medicamentos desde API...", flush=True)
        
        for attempt in range(self.max_retries):
            try:
                print(f"INHRR_SCRAPER: Llamando API (intento {attempt + 1}/{self.max_retries})...", flush=True)
                response = await self.client.get(self.API_URL)
                
                print(f"INHRR_SCRAPER: Status: {response.status_code}", flush=True)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data.get('success') and 'combinedData' in data:
                        medications = data['combinedData']
                        print(f"INHRR_SCRAPER: {len(medications)} medicamentos recibidos", flush=True)
                        return medications
                    else:
                        print(f"INHRR_SCRAPER: Respuesta inesperada: {data}", flush=True)
                        return []
                        
                else:
                    print(f"INHRR_SCRAPER: Error HTTP {response.status_code}", flush=True)
                    
            except Exception as e:
                print(f"INHRR_SCRAPER: Error: {e}", flush=True)
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise
        
        return []
    
    def _parse_medication(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Parsea un medicamento desde el formato API al formato del modelo.
        
        Args:
            data: Diccionario con datos del medicamento desde la API
            
        Returns:
            Diccionario con datos en formato del modelo o None si hay error
        """
        try:
            # Extraer campos básicos
            registration_code = data.get('ef', '')
            product_name = data.get('nombre', '').strip()
            active_ingredient = data.get('principioActivo', '').strip()
            laboratory = data.get('representante', '').strip()
            
            # Determinar estatus basado en fechas
            status = 'VIGENTE'
            fecha_cancelado = data.get('fechaCancelado')
            if fecha_cancelado:
                status = 'CANCELADO'
            
            # Determinar forma farmacéutica desde el nombre
            presentation = 'other'
            product_upper = product_name.upper()
            for key, value in PRESENTATION_MAP.items():
                if key in product_upper:
                    presentation = value
                    break
            
            # Extraer concentración del nombre
            concentration = ""
            concentration_match = re.search(
                r'([\d,\.]+\s*(?:mg|g|ml|mcg|IU|mEq|%)\s*[-–/]?\s*[\d,\.]*\s*(?:mg|g|ml|mcg|IU|mEq|%)?)',
                product_name,
                re.IGNORECASE
            )
            if concentration_match:
                concentration = concentration_match.group(1).strip()
            
            # Determinar vía de administración
            route = 'oral'
            for key, value in ROUTE_MAP.items():
                if key in product_upper:
                    route = value
                    break
            
            # Determinar unidad
            unit = 'unit'
            product_lower = product_name.lower()
            if 'mg' in product_lower:
                unit = 'mg'
            elif 'ml' in product_lower:
                unit = 'ml'
            elif 'g' in product_lower:
                unit = 'g'
            elif 'mcg' in product_lower:
                unit = 'mcg'
            
            return {
                'name': product_name,
                'generic_name': active_ingredient,
                'presentation': presentation,
                'concentration': concentration or 'N/A',
                'route': route,
                'unit': unit,
                'laboratory': laboratory,
                'inhrr_code': registration_code,
                'inhrr_status': status,
                'source': 'INHRR',
                'is_active': status == 'VIGENTE',
                'therapeutic_action': None,
            }
            
        except Exception as e:
            print(f"INHRR_SCRAPER: Error parseando medicamento: {e}", flush=True)
            return None
            
    async def scrape_all(self, max_pages: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Scrapea todos los medicamentos del INHRR.
        
        Args:
            max_pages: No usado en versión API (mantenido para compatibilidad)
            
        Returns:
            Lista de diccionarios con datos de medicamentos
        """
        print("INHRR_SCRAPER: Iniciando scraping desde API...", flush=True)
        
        raw_medications = await self._fetch_all_medications()
        
        all_medications: List[Dict[str, Any]] = []
        
        for data in raw_medications:
            medication = self._parse_medication(data)
            if medication:
                all_medications.append(medication)
        
        print(
            f"INHRR_SCRAPER: Scraping completado. "
            f"Total de medicamentos extraídos: {len(all_medications)}",
            flush=True
        )
        
        return all_medications
        
    async def scrape_sample(self, count: int = 10) -> List[Dict[str, Any]]:
        """
        Scrapea una muestra de medicamentos.
        
        Args:
            count: Número de medicamentos a scrapear
            
        Returns:
            Lista de diccionarios con datos de medicamentos
        """
        print(f"INHRR_SCRAPER: Obteniendo muestra de {count} medicamentos...", flush=True)
        
        all_medications = await self.scrape_all()
        
        # Tomar solo los primeros 'count' medicamentos
        sample = all_medications[:count]
        
        print(
            f"INHRR_SCRAPER: Muestra completada. "
            f"Medicamentos extraídos: {len(sample)}",
            flush=True
        )
        
        return sample
async def run_inhrr_scraper(
    headless: bool = True,
    max_pages: Optional[int] = None,
    sample: bool = False,
    sample_count: int = 10
) -> List[Dict[str, Any]]:
    """
    Función de utilidad para ejecutar el scraper.
    
    Args:
        headless: No usado en versión API (mantenido para compatibilidad)
        max_pages: No usado en versión API
        sample: Si True, solo extrae una muestra
        sample_count: Cantidad de la muestra
        
    Returns:
        Lista de diccionarios con medicamentos
    """
    async with INHRRScraper(headless=headless) as scraper:
        if sample:
            result = await scraper.scrape_sample(count=sample_count)
        else:
            result = await scraper.scrape_all(max_pages=max_pages)
        return result