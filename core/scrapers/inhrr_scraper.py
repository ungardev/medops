# core/scrapers/inhrr_scraper.py
"""
Scraper para el Instituto Nacional de Higiene Rafael Rangel (INHRR).
Extrae el catálogo oficial de medicamentos registrados en Venezuela.
"""
import asyncio
import re
import logging
import sys
import json
from typing import List, Dict, Any, Optional, cast
from datetime import datetime
from urllib.parse import urljoin
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
    BASE_URL = "https://inhrr.gob.ve"
    SEARCH_URL = "https://inhrr.gob.ve/sismed/productos-farma"
    
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
        self.api_urls: List[str] = []
        self.api_responses: List[Dict] = []
    
    @property
    def page(self) -> Page:
        assert self._page is not None, "Browser not initialized."
        return self._page
    
    async def __aenter__(self) -> 'INHRRScraper':
        await self.launch()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.close()
        
    async def launch(self) -> None:
        print("=" * 60, flush=True)
        print("INHRR_SCRAPER: Lanzando navegador...", flush=True)
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
            
            # === AGREGADO: Interceptar peticiones de red ===
            print("INHRR_SCRAPER: Configurando interceptación de red...", flush=True)
            self._page.on("request", self._handle_request)
            self._page.on("response", self._handle_response)
            
            print("INHRR_SCRAPER: Navegador LISTO", flush=True)
            
        except Exception as e:
            print(f"ERROR in launch(): {e}", flush=True)
            raise
    
    def _handle_request(self, request):
        """Maneja las peticiones HTTP para encontrar la API."""
        url = request.url
        if any(keyword in url.lower() for keyword in ['api', 'productos', 'medicamentos', 'search', 'query']):
            print(f"📡 REQUEST API DETECTADA: {url}", flush=True)
            if url not in self.api_urls:
                self.api_urls.append(url)
    
    async def _handle_response(self, response):
        """Maneja las respuestas HTTP para capturar datos de la API."""
        url = response.url
        if any(keyword in url.lower() for keyword in ['api', 'productos', 'medicamentos']):
            try:
                content_type = response.headers.get('content-type', '')
                if 'json' in content_type:
                    data = await response.json()
                    print(f"📦 RESPONSE API JSON: {url}", flush=True)
                    print(f"📊 Datos recibidos: {len(str(data))} caracteres", flush=True)
                    self.api_responses.append({
                        'url': url,
                        'data': data
                    })
            except:
                pass
        
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
            
    async def _safe_goto(self, url: str, retries: Optional[int] = None) -> bool:
        if retries is None:
            retries = self.max_retries
            
        page = self.page
        
        for attempt in range(retries):
            try:
                print(f"INHRR_SCRAPER: Navigating to {url}...", flush=True)
                response = await page.goto(url, wait_until='networkidle')
                print(f"INHRR_SCRAPER: Response status: {response.status if response else 'N/A'}", flush=True)
                
                # Esperar a que se completen las peticiones de red
                print("INHRR_SCRAPER: Esperando 10 segundos para capturar APIs...", flush=True)
                await asyncio.sleep(10)
                
                # Mostrar APIs encontradas
                if self.api_urls:
                    print(f"✅ APIs ENCONTRADAS ({len(self.api_urls)}):", flush=True)
                    for i, api_url in enumerate(self.api_urls, 1):
                        print(f"  {i}. {api_url}", flush=True)
                else:
                    print("⚠️  No se encontraron URLs de API", flush=True)
                
                return True
                
            except Exception as e:
                print(f"INHRR_SCRAPER: Error: {e}", flush=True)
                await asyncio.sleep(2 ** attempt)
                
        return False
        
    async def scrape_sample(self, count: int = 10) -> List[Dict[str, Any]]:
        print(f"INHRR_SCRAPER: Scraping muestra...", flush=True)
        
        try:
            if not await self._safe_goto(self.SEARCH_URL):
                raise Exception("No se pudo acceder a la página")
            
            print("=" * 60, flush=True)
            print("RESUMEN DE APIs ENCONTRADAS:", flush=True)
            print("=" * 60, flush=True)
            for i, url in enumerate(self.api_urls, 1):
                print(f"{i}. {url}", flush=True)
            
            if self.api_responses:
                print(f"\nRespuestas capturadas: {len(self.api_responses)}", flush=True)
                for resp in self.api_responses[:3]:  # Mostrar primeras 3
                    print(f"\nURL: {resp['url']}", flush=True)
                    print(f"Datos: {str(resp['data'])[:500]}...", flush=True)
            
            return []
            
        except Exception as e:
            print(f"INHRR_SCRAPER: Error: {e}", flush=True)
            return []
async def run_inhrr_scraper(
    headless: bool = True,
    max_pages: Optional[int] = None,
    sample: bool = False,
    sample_count: int = 10
) -> List[Dict[str, Any]]:
    async with INHRRScraper(headless=headless) as scraper:
        if sample:
            result = await scraper.scrape_sample(count=sample_count)
        else:
            result = await scraper.scrape_all(max_pages=max_pages)
        return result