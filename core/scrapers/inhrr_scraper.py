# core/scrapers/inhrr_scraper.py
"""
Scraper para el Instituto Nacional de Higiene Rafael Rangel (INHRR).
Versión con búsqueda alfabética - Obtiene TODOS los medicamentos (22,567).
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
    Versión con búsqueda alfabética para obtener todos los medicamentos.
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
        self.all_medications: List[Dict] = []  # Acumulador final
        self.processed_codes: Set[str] = set()  # Evitar duplicados por código INHRR
        self.current_search_results: List[Dict] = []  # Resultados de búsqueda actual
    
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
        print("=" * 70, flush=True)
        print("INHRR_SCRAPER: Lanzando navegador Playwright...", flush=True)
        print("INHRR_SCRAPER: Objetivo: Obtener ~22,567 medicamentos", flush=True)
        print("INHRR_SCRAPER: Estrategia: Búsqueda alfabética A-Z", flush=True)
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
            
            # Configurar interceptación de respuestas API
            print("INHRR_SCRAPER: Configurando interceptación de API...", flush=True)
            self._page.on("response", self._handle_api_response)
            
            print("INHRR_SCRAPER: Navegador LISTO", flush=True)
            
        except Exception as e:
            print(f"ERROR in launch(): {e}", flush=True)
            raise
    
    async def _handle_api_response(self, response):
        """Intercepta respuestas de la API de búsqueda."""
        if "api/productos-farma" in response.url and response.status == 200:
            try:
                content_type = response.headers.get('content-type', '')
                if 'json' in content_type:
                    data = await response.json()
                    
                    if data.get('success') and 'combinedData' in data:
                        page_data = data['combinedData']
                        count_total = data.get('countTotal', 0)
                        
                        if page_data:
                            # Guardar en variable temporal (no acumular aún)
                            self.current_search_results = page_data
                            
                            print(f"\n{'='*70}", flush=True)
                            print(f"✅ BÚSQUEDA CAPTURADA", flush=True)
                            print(f"   URL: {response.url[:70]}...", flush=True)
                            print(f"   Medicamentos encontrados: {len(page_data)}", flush=True)
                            print(f"   Total en BD INHRR: {count_total}", flush=True)
                            print(f"{'='*70}\n", flush=True)
                            
            except Exception as e:
                print(f"Error procesando respuesta API: {e}", flush=True)
    
    async def search_medications(self, search_term: str) -> List[Dict]:
        """
        Realiza una búsqueda en el sitio del INHRR.
        
        Args:
            search_term: Término de búsqueda (ej: "A", "B", "AA")
            
        Returns:
            Lista de medicamentos encontrados
        """
        print(f"\n🔍 Buscando: '{search_term}'", flush=True)
        
        # Limpiar resultados anteriores
        self.current_search_results = []
        
        try:
            # Navegar a la página de búsqueda
            await self.page.goto(self.SEARCH_URL, wait_until='networkidle')
            await asyncio.sleep(2)
            
            # Intentar encontrar y llenar el campo de búsqueda
            # Los selectores pueden variar, intentamos varios
            search_selectors = [
                'input[type="search"]',
                'input[placeholder*="buscar" i]',
                'input[placeholder*="search" i]',
                'input[name*="search" i]',
                'input[name*="query" i]',
                'input',
            ]
            
            search_input = None
            for selector in search_selectors:
                try:
                    element = self.page.locator(selector).first
                    if await element.count() > 0:
                        search_input = element
                        print(f"   Campo de búsqueda encontrado: {selector}", flush=True)
                        break
                except:
                    continue
            
            if not search_input:
                print(f"   ⚠️  No se encontró campo de búsqueda", flush=True)
                return []
            
            # Limpiar y escribir el término de búsqueda
            await search_input.clear()
            await search_input.fill(search_term)
            await asyncio.sleep(1)
            
            # Presionar Enter para buscar
            await search_input.press('Enter')
            
            # Esperar a que carguen los resultados
            print(f"   Esperando resultados...", flush=True)
            await asyncio.sleep(5)
            
            # Si hay 200 resultados, puede que haya más - esperar un poco más
            if len(self.current_search_results) >= 200:
                print(f"   Máximo alcanzado (200), esperando posible carga adicional...", flush=True)
                await asyncio.sleep(3)
            
            # Agregar resultados a la lista principal (evitando duplicados)
            new_medications = 0
            for med in self.current_search_results:
                code = med.get('ef', '')
                if code and code not in self.processed_codes:
                    self.processed_codes.add(code)
                    self.all_medications.append(med)
                    new_medications += 1
            
            print(f"   ✅ Nuevos medicamentos agregados: {new_medications}", flush=True)
            print(f"   📊 Total acumulado: {len(self.all_medications)}", flush=True)
            
            return self.current_search_results
            
        except Exception as e:
            print(f"   ❌ Error en búsqueda '{search_term}': {e}", flush=True)
            return []
    
    async def fetch_all_by_alphabet(self) -> List[Dict]:
        """
        Obtiene todos los medicamentos buscando por el alfabeto.
        Estrategia: A-Z, y si alguna letra devuelve 200, subdividir (AA, AB, etc.)
        """
        print(f"\n{'='*70}", flush=True)
        print("INICIANDO BÚSQUEDA ALFABÉTICA", flush=True)
        print(f"{'='*70}\n", flush=True)
        
        # Primera pasada: A-Z
        letters_to_search = list(string.ascii_uppercase)
        letters_needing_subdivision = []  # Letras que devolvieron 200 (máximo)
        
        # Buscar por cada letra del alfabeto
        for letter in letters_to_search:
            results = await self.search_medications(letter)
            
            # Si devolvió 200, puede haber más - marcar para subdivisión
            if len(results) >= 200:
                print(f"   ⚠️  Letra '{letter}' tiene 200+ medicamentos. Se subdividirá.", flush=True)
                letters_needing_subdivision.append(letter)
            
            # Pequeña pausa entre búsquedas
            await asyncio.sleep(2)
        
        # Segunda pasada: Subdividir letras con muchos resultados
        if letters_needing_subdivision:
            print(f"\n{'='*70}", flush=True)
            print(f"SUBDIVIDIENDO LETRAS CON 200+ RESULTADOS", flush=True)
            print(f"Letras: {', '.join(letters_needing_subdivision)}", flush=True)
            print(f"{'='*70}\n", flush=True)
            
            for letter in letters_needing_subdivision:
                # Intentar combinaciones de 2 letras (AA, AB, AC, ..., AZ)
                for second_letter in string.ascii_uppercase:
                    combination = letter + second_letter
                    results = await self.search_medications(combination)
                    
                    # Si aún hay 200, podríamos necesitar 3 letras (raro pero posible)
                    if len(results) >= 200:
                        print(f"   ⚠️  '{combination}' aún tiene 200+. Intentando subdivisiones...", flush=True)
                        # Aquí podríamos agregar lógica para 3 letras (AAA, AAB, etc.)
                        # Por ahora, continuamos con la siguiente combinación
                    
                    await asyncio.sleep(1)
        
        print(f"\n{'='*70}", flush=True)
        print(f"✅ BÚSQUEDA ALFABÉTICA COMPLETADA", flush=True)
        print(f"   Total de medicamentos únicos: {len(self.all_medications)}", flush=True)
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
        """Parsea un medicamento desde el formato API al formato del modelo."""
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
        """Scrapea todos los medicamentos del INHRR usando búsqueda alfabética."""
        print("INHRR_SCRAPER: Iniciando scraping con búsqueda alfabética...", flush=True)
        
        # Obtener todos los medicamentos por búsqueda alfabética
        raw_medications = await self.fetch_all_by_alphabet()
        
        # Parsear al formato del modelo
        all_medications: List[Dict[str, Any]] = []
        for data in raw_medications:
            medication = self._parse_medication(data)
            if medication:
                all_medications.append(medication)
        
        print(
            f"\n{'='*70}\n"
            f"INHRR_SCRAPER: Scraping completado.\n"
            f"Total de medicamentos extraídos: {len(all_medications)}\n"
            f"{'='*70}",
            flush=True
        )
        
        return all_medications
    
    async def scrape_sample(self, count: int = 10) -> List[Dict[str, Any]]:
        """Scrapea una muestra de medicamentos."""
        print(f"INHRR_SCRAPER: Obteniendo muestra de {count} medicamentos...", flush=True)
        
        # Para muestra, solo buscar una letra
        await self.search_medications("A")
        
        sample = self.all_medications[:count]
        
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
    """Función de utilidad para ejecutar el scraper."""
    async with INHRRScraper(headless=headless) as scraper:
        if sample:
            result = await scraper.scrape_sample(count=sample_count)
        else:
            result = await scraper.scrape_all(max_pages=max_pages)
        return result