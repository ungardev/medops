# core/scrapers/inhrr_scraper.py
"""
Scraper para el Instituto Nacional de Higiene Rafael Rangel (INHRR).
Versión con paginación - Obtiene TODOS los medicamentos.
"""
import asyncio
import re
import logging
import sys
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout
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
    Scraper para el portal de medicamentos del INHRR.
    Versión con paginación para obtener todos los medicamentos.
    """
    
    BASE_URL = "https://inhrr.gob.ve"
    SEARCH_URL = "https://inhrr.gob.ve/sismed/productos-farma"
    # === CAMBIO: URL base sin parámetros ===
    API_URL_BASE = "https://inhrr.gob.ve/sismed/api/productos-farma"
    
    def __init__(
        self,
        headless: bool = True,
        rate_limit: float = 1.5,
        max_retries: int = 3,
        timeout: int = 30000
    ):
        self.headless = headless
        self.rate_limit = rate_limit
        self.max_retries = max_retries
        self.timeout = timeout
        self.browser: Optional[Browser] = None
        self._page: Optional[Page] = None
        self.playwright = None
        self.all_api_data: List[Dict] = []  # Acumulador para todas las páginas
        self.total_expected: int = 0  # Total esperado según la API
    
    @property
    def page(self) -> Page:
        assert self._page is not None, "Browser not initialized."
        return self._page
    
    async def __aenter__(self) -> 'INHRRScraper':
        """Entry point para async context manager."""
        await self.launch()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Exit point para async context manager."""
        await self.close()
        
    async def launch(self) -> None:
        """Inicia el navegador Playwright."""
        print("=" * 60, flush=True)
        print("INHRR_SCRAPER: Lanzando navegador Playwright...", flush=True)
        print("INHRR_SCRAPER: Objetivo: Obtener ~22,567 medicamentos con paginación", flush=True)
        print("=" * 60, flush=True)
        
        try:
            self.playwright = await async_playwright().start()
            browser_result = self.playwright.chromium.launch(
                headless=self.headless,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            
            if asyncio.iscoroutine(browser_result):
                self.browser = await browser_result
            else:
                self.browser = browser_result
            
            page_result = self.browser.new_page()
            if asyncio.iscoroutine(page_result):
                self._page = await page_result
            else:
                self._page = page_result
            
            self._page.set_default_timeout(self.timeout)
            await self._page.set_extra_http_headers({
                'User-Agent': 'MEDOPZ-Bot/1.0 (+https://medopz.software)'
            })
            
            # Configurar interceptación de respuestas API
            print("INHRR_SCRAPER: Configurando interceptación de API...", flush=True)
            self._page.on("response", self._handle_api_response)
            
            print("INHRR_SCRAPER: Navegador LISTO", flush=True)
            
        except Exception as e:
            print(f"ERROR in launch(): {e}", flush=True)
            raise
    
    async def _handle_api_response(self, response):
        """Intercepta TODAS las respuestas de la API."""
        if "api/productos-farma" in response.url and response.status == 200:
            try:
                content_type = response.headers.get('content-type', '')
                if 'json' in content_type:
                    data = await response.json()
                    
                    if data.get('success') and 'combinedData' in data:
                        page_data = data['combinedData']
                        count_total = data.get('countTotal', 0)
                        
                        if page_data and len(page_data) > 0:
                            # Acumular datos
                            self.all_api_data.extend(page_data)
                            self.total_expected = max(self.total_expected, count_total)
                            
                            print(f"\n{'='*60}", flush=True)
                            print(f"✅ PÁGINA CAPTURADA", flush=True)
                            print(f"   URL: {response.url[:80]}...", flush=True)
                            print(f"   Medicamentos en esta página: {len(page_data)}", flush=True)
                            print(f"   Total acumulado: {len(self.all_api_data)} / {self.total_expected}", flush=True)
                            print(f"{'='*60}\n", flush=True)
                            
            except Exception as e:
                print(f"Error procesando respuesta API: {e}", flush=True)
        
    async def close(self) -> None:
        try:
            if self.browser:
                await self.browser.close()
        finally:
            self._page = None
            if self.playwright:
                try:
                    await self.playwright.stop()
                except:
                    pass
                self.playwright = None
            
    async def _fetch_all_medications(self) -> List[Dict[str, Any]]:
        """
        Obtiene todos los medicamentos navegando a la página principal.
        La API se llamará automáticamente y se acumularán los datos.
        """
        print("INHRR_SCRAPER: Navegando a la página para cargar datos...", flush=True)
        
        for attempt in range(self.max_retries):
            try:
                # Primera navegación - carga la página inicial
                await self.page.goto(self.SEARCH_URL, wait_until='networkidle')
                print("INHRR_SCRAPER: Página inicial cargada", flush=True)
                
                # Esperar primera carga de datos
                await asyncio.sleep(10)
                
                # Si ya tenemos datos, intentar scrollear para cargar más
                if len(self.all_api_data) > 0:
                    print(f"INHRR_SCRAPER: Datos iniciales: {len(self.all_api_data)}", flush=True)
                    
                    # Scrollear para intentar cargar más páginas
                    for scroll in range(10):
                        await self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                        await asyncio.sleep(3)
                        
                        # Verificar si se cargaron más datos
                        current_count = len(self.all_api_data)
                        print(f"   Scroll {scroll+1}/10 - Total: {current_count}", flush=True)
                        
                        # Si ya tenemos todos o no hay más cambios, salir
                        if current_count >= self.total_expected or (scroll > 0 and current_count == len(self.all_api_data)):
                            break
                
                # Resultado final
                if len(self.all_api_data) > 0:
                    print(f"\n{'='*60}", flush=True)
                    print(f"✅ SCRAPING COMPLETADO", flush=True)
                    print(f"   Total medicamentos: {len(self.all_api_data)}", flush=True)
                    print(f"   Esperados: {self.total_expected}", flush=True)
                    print(f"{'='*60}\n", flush=True)
                    return self.all_api_data
                else:
                    print("INHRR_SCRAPER: No se capturaron datos, reintentando...", flush=True)
                    await asyncio.sleep(5)
                    
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
        """
        try:
            registration_code = data.get('ef', '')
            product_name = data.get('nombre', '').strip()
            active_ingredient = data.get('principioActivo', '').strip()
            
            status = 'VIGENTE'
            fecha_cancelado = data.get('fechaCancelado')
            if fecha_cancelado:
                status = 'CANCELADO'
            
            presentation = 'other'
            product_upper = product_name.upper()
            for key, value in PRESENTATION_MAP.items():
                if key in product_upper:
                    presentation = value
                    break
            
            concentration = ""
            concentration_match = re.search(
                r'([\d,\.]+\s*(?:mg|g|ml|mcg|IU|mEq|%)\s*[-–/]?\s*[\d,\.]*\s*(?:mg|g|ml|mcg|IU|mEq|%)?)',
                product_name,
                re.IGNORECASE
            )
            if concentration_match:
                concentration = concentration_match.group(1).strip()
            
            route = 'oral'
            for key, value in ROUTE_MAP.items():
                if key in product_upper:
                    route = value
                    break
            
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
        """
        print("INHRR_SCRAPER: Iniciando scraping con acumulación de páginas...", flush=True)
        
        raw_medications = await self._fetch_all_medications()
        
        all_medications: List[Dict[str, Any]] = []
        
        for data in raw_medications:
            medication = self._parse_medication(data)
            if medication:
                all_medications.append(medication)
        
        print(
            f"\n{'='*60}\n"
            f"INHRR_SCRAPER: Scraping completado.\n"
            f"Total de medicamentos extraídos: {len(all_medications)}\n"
            f"{'='*60}",
            flush=True
        )
        
        return all_medications
        
    async def scrape_sample(self, count: int = 10) -> List[Dict[str, Any]]:
        """
        Scrapea una muestra de medicamentos.
        """
        print(f"INHRR_SCRAPER: Obteniendo muestra de {count} medicamentos...", flush=True)
        
        all_medications = await self.scrape_all()
        
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
    """
    async with INHRRScraper(headless=headless) as scraper:
        if sample:
            result = await scraper.scrape_sample(count=sample_count)
        else:
            result = await scraper.scrape_all(max_pages=max_pages)
        return result