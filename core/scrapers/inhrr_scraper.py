# core/scrapers/inhrr_scraper.py
"""
Scraper para el Instituto Nacional de Higiene Rafael Rangel (INHRR).
Versión con subdivisión a 3 letras - Obtiene TODOS los medicamentos (~22,567).
"""
import asyncio
import re
import logging
import sys
import json
import string
from typing import List, Dict, Any, Optional, Set
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
    Versión con subdivisión a 3 letras para obtener TODOS los medicamentos.
    """
    
    BASE_URL = "https://inhrr.gob.ve"
    SEARCH_URL = "https://inhrr.gob.ve/sismed/productos-farma"
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
        self.all_medications: List[Dict] = []
        self.processed_codes: Set[str] = set()
        self.current_search_results: List[Dict] = []
        
        # Contadores para estadísticas
        self.search_count = 0
        self.combinations_1_letter = 0
        self.combinations_2_letters = 0
        self.combinations_3_letters = 0
    
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
        print("=" * 70, flush=True)
        print("INHRR_SCRAPER: Lanzando navegador Playwright...", flush=True)
        print("INHRR_SCRAPER: Objetivo: Obtener ~22,567 medicamentos", flush=True)
        print("INHRR_SCRAPER: Estrategia: A-Z → AA-ZZ → AAA-ZZZ", flush=True)
        print("⚠️  Tiempo estimado: 4-6 horas", flush=True)
        print("=" * 70, flush=True)
        
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
            
            print("INHRR_SCRAPER: Configurando interceptación de API...", flush=True)
            self._page.on("response", self._handle_api_response)
            print("INHRR_SCRAPER: Navegador LISTO", flush=True)
            
        except Exception as e:
            print(f"ERROR in launch(): {e}", flush=True)
            raise
    
    async def _handle_api_response(self, response):
        if "api/productos-farma" in response.url and response.status == 200:
            try:
                content_type = response.headers.get('content-type', '')
                if 'json' in content_type:
                    data = await response.json()
                    if data.get('success') and 'combinedData' in data:
                        page_data = data['combinedData']
                        count_total = data.get('countTotal', 0)
                        
                        if page_data:
                            self.current_search_results = page_data
                            print(f"\n{'='*70}", flush=True)
                            print(f"✅ BÚSQUEDA #{self.search_count}", flush=True)
                            print(f"   Medicamentos encontrados: {len(page_data)}", flush=True)
                            print(f"   Total acumulado: {len(self.all_medications)}", flush=True)
                            print(f"{'='*70}\n", flush=True)
            except Exception as e:
                print(f"Error procesando respuesta: {e}", flush=True)
    
    async def search_medications(self, search_term: str) -> List[Dict]:
        self.search_count += 1
        print(f"\n🔍 [#{self.search_count}] Buscando: '{search_term}'", flush=True)
        
        self.current_search_results = []
        
        try:
            await self.page.goto(self.SEARCH_URL, wait_until='networkidle')
            await asyncio.sleep(2)
            
            # Encontrar campo de búsqueda
            search_selectors = [
                'input[type="search"]',
                'input[placeholder*="buscar" i]',
                'input[placeholder*="search" i]',
                'input[name*="search" i]',
                'input',
            ]
            
            search_input = None
            for selector in search_selectors:
                try:
                    element = self.page.locator(selector).first
                    if await element.count() > 0:
                        search_input = element
                        break
                except:
                    continue
            
            if not search_input:
                print(f"   ⚠️  No se encontró campo de búsqueda", flush=True)
                return []
            
            await search_input.clear()
            await search_input.fill(search_term)
            await asyncio.sleep(1)
            await search_input.press('Enter')
            await asyncio.sleep(5)
            
            # Agregar resultados únicos
            new_medications = 0
            for med in self.current_search_results:
                code = med.get('ef', '')
                if code and code not in self.processed_codes:
                    self.processed_codes.add(code)
                    self.all_medications.append(med)
                    new_medications += 1
            
            print(f"   ✅ Nuevos: {new_medications} | 📊 Total: {len(self.all_medications)}", flush=True)
            return self.current_search_results
            
        except Exception as e:
            print(f"   ❌ Error '{search_term}': {e}", flush=True)
            return []
    
    async def fetch_all_by_alphabet(self) -> List[Dict]:
        print(f"\n{'='*70}", flush=True)
        print("INICIANDO BÚSQUEDA ALFABÉTICA CON SUBDIVISIÓN A 3 LETRAS", flush=True)
        print(f"{'='*70}\n", flush=True)
        
        # PASADA 1: Letras simples A-Z
        print("📚 PASADA 1: Buscando A-Z...", flush=True)
        for letter in string.ascii_uppercase:
            results = await self.search_medications(letter)
            self.combinations_1_letter += 1
            
            if len(results) >= 200:
                print(f"   ⚠️  '{letter}' tiene 200+ → subdividiendo...", flush=True)
                
                # PASADA 2: Subdivisión a 2 letras
                for second in string.ascii_uppercase:
                    combination_2 = letter + second
                    results_2 = await self.search_medications(combination_2)
                    self.combinations_2_letters += 1
                    
                    if len(results_2) >= 200:
                        print(f"   ⚠️  '{combination_2}' tiene 200+ → subdividiendo a 3 letras...", flush=True)
                        
                        # PASADA 3: Subdivisión a 3 letras
                        for third in string.ascii_uppercase:
                            combination_3 = letter + second + third
                            await self.search_medications(combination_3)
                            self.combinations_3_letters += 1
                            await asyncio.sleep(1)  # Pausa entre búsquedas de 3 letras
                    
                    await asyncio.sleep(1)  # Pausa entre búsquedas de 2 letras
            
            await asyncio.sleep(2)  # Pausa entre letras principales
        
        # Resumen final
        print(f"\n{'='*70}", flush=True)
        print(f"✅ BÚSQUEDA COMPLETADA", flush=True)
        print(f"   Combinaciones 1 letra: {self.combinations_1_letter}", flush=True)
        print(f"   Combinaciones 2 letras: {self.combinations_2_letters}", flush=True)
        print(f"   Combinaciones 3 letras: {self.combinations_3_letters}", flush=True)
        print(f"   Total de búsquedas: {self.search_count}", flush=True)
        print(f"   Medicamentos únicos: {len(self.all_medications)}", flush=True)
        print(f"{'='*70}\n", flush=True)
        
        return self.all_medications
    
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
    
    def _parse_medication(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
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
            print(f"INHRR_SCRAPER: Error parseando: {e}", flush=True)
            return None
    
    async def scrape_all(self, max_pages: Optional[int] = None) -> List[Dict[str, Any]]:
        print("INHRR_SCRAPER: Iniciando scraping con subdivisión a 3 letras...", flush=True)
        
        raw_medications = await self.fetch_all_by_alphabet()
        
        all_medications: List[Dict[str, Any]] = []
        for data in raw_medications:
            medication = self._parse_medication(data)
            if medication:
                all_medications.append(medication)
        
        print(
            f"\n{'='*70}\n"
            f"✅ SCRAPING FINALIZADO\n"
            f"Total de medicamentos: {len(all_medications)}\n"
            f"{'='*70}",
            flush=True
        )
        
        return all_medications
    
    async def scrape_sample(self, count: int = 10) -> List[Dict[str, Any]]:
        print(f"INHRR_SCRAPER: Obteniendo muestra de {count} medicamentos...", flush=True)
        await self.search_medications("A")
        return self.all_medications[:count]
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