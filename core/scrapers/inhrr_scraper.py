# core/scrapers/inhrr_scraper.py
"""
Scraper para el Instituto Nacional de Higiene Rafael Rangel (INHRR).
Extrae el catálogo oficial de medicamentos registrados en Venezuela.
"""
import asyncio
import re
import logging
import sys
from typing import List, Dict, Any, Optional, cast
from datetime import datetime
from urllib.parse import urljoin
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout
audit = logging.getLogger("audit")
# Configurar logging para ver todo en stdout
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
PRESENTATION_MAP = {
    'TABLETAS': 'tablet',
    'TABLETAS RECUBIERTAS': 'tablet_coated',
    'TABLETAS MASTICABLES': 'tablet',
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
    'INTRAVENOSO': 'intravenous',
    'INTRAMUSCULAR': 'intramuscular',
    'SUBCUTÁNEA': 'subcutaneous',
    'SUBCUTÁNEO': 'subcutaneous',
    'TÓPICA': 'topical',
    'TÓPICO': 'topical',
    'SUBLINGUAL': 'sublingual',
    'RECTAL': 'rectal',
    'INHALACIÓN': 'inhalation',
    'INHALATORIO': 'inhalation',
    'OFTÁLMICA': 'ophthalmic',
    'ÓTICA': 'otic',
    'NASAL': 'nasal',
}
STATUS_MAP = {
    'VIGENTE': 'VIGENTE',
    'VIGENTES': 'VIGENTE',
    'CANCELADO': 'CANCELADO',
    'CANCELADOS': 'CANCELADO',
    'SUSPENDIDO': 'SUSPENDIDO',
    'SUSPENDIDOS': 'SUSPENDIDO',
}
class INHRRScraper:
    """
    Scraper para el portal de medicamentos del INHRR.
    
    Extracción de datos:
    - Código de registro sanitario
    - Nombre del producto
    - Principio activo
    - Forma farmacéutica
    - Concentración
    - Laboratorio fabricante
    - Estatus
    """
    
    BASE_URL = "https://inhrr.gob.ve"
    SEARCH_URL = "https://inhrr.gob.ve/sismed/productos-farma"
    
    def __init__(
        self,
        headless: bool = True,
        rate_limit: float = 1.5,
        max_retries: int = 3,
        timeout: int = 30000
    ):
        """
        Inicializa el scraper.
        
        Args:
            headless: Si True, ejecuta el navegador sin interfaz gráfica
            rate_limit: Segundos entre requests
            max_retries: Intentos máximos ante errores
            timeout: Timeout en milisegundos
        """
        self.headless = headless
        self.rate_limit = rate_limit
        self.max_retries = max_retries
        self.timeout = timeout
        self.browser: Optional[Browser] = None
        self._page: Optional[Page] = None
        self.playwright = None
    
    @property
    def page(self) -> Page:
        """Property que retorna el Page activo."""
        assert self._page is not None, "Browser not initialized. Use 'async with' context manager or call launch() first."
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
        print("=" * 60, flush=True)
        
        try:
            print("INHRR_SCRAPER: Step 1 - Creating async_playwright...", flush=True)
            self.playwright = await async_playwright().start()
            print(f"INHRR_SCRAPER: Playwright created: {type(self.playwright)}", flush=True)
            
            if self.playwright is None:
                print("ERROR: playwright is None!", flush=True)
                raise Exception("playwright is None")
            
            print(f"INHRR_SCRAPER: Step 2 - Launching chromium (headless={self.headless})...", flush=True)
            print(f"INHRR_SCRAPER: chromium attribute: {self.playwright.chromium}", flush=True)
            
            if self.playwright.chromium is None:
                print("ERROR: playwright.chromium is None!", flush=True)
                raise Exception("playwright.chromium is None")
            
            print("INHRR_SCRAPER: Calling chromium.launch()...", flush=True)
            browser_result = self.playwright.chromium.launch(
                headless=self.headless,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            
            print(f"INHRR_SCRAPER: browser_result type: {type(browser_result)}", flush=True)
            print(f"INHRR_SCRAPER: browser_result is coroutine: {asyncio.iscoroutine(browser_result)}", flush=True)
            
            if asyncio.iscoroutine(browser_result):
                print("INHRR_SCRAPER: Awaiting browser_result...", flush=True)
                self.browser = await browser_result
            else:
                print("INHRR_SCRAPER: Using browser_result directly...", flush=True)
                self.browser = browser_result
            
            print(f"INHRR_SCRAPER: Browser created: {type(self.browser)}", flush=True)
            
            if self.browser is None:
                print("ERROR: browser is None after launch!", flush=True)
                raise Exception("Browser is None after launch")
            
            print("INHRR_SCRAPER: Step 3 - Creating new page...", flush=True)
            page_result = self.browser.new_page()
            
            print(f"INHRR_SCRAPER: page_result type: {type(page_result)}", flush=True)
            print(f"INHRR_SCRAPER: page_result is coroutine: {asyncio.iscoroutine(page_result)}", flush=True)
            
            if asyncio.iscoroutine(page_result):
                self._page = await page_result
            else:
                self._page = page_result
            
            print(f"INHRR_SCRAPER: Page created: {type(self._page)}", flush=True)
            
            if self._page is None:
                print("ERROR: page is None after new_page!", flush=True)
                raise Exception("Page is None after new_page")
            
            print("INHRR_SCRAPER: Step 4 - Setting timeout...", flush=True)
            self._page.set_default_timeout(self.timeout)
            
            print("INHRR_SCRAPER: Step 5 - Setting headers...", flush=True)
            await self._page.set_extra_http_headers({
                'User-Agent': 'MEDOPZ-Bot/1.0 (+https://medopz.software)'
            })
            
            print("=" * 60, flush=True)
            print("INHRR_SCRAPER: Navegador LISTO", flush=True)
            print("=" * 60, flush=True)
            
        except Exception as e:
            print(f"ERROR in launch(): {type(e).__name__}: {e}", flush=True)
            import traceback
            traceback.print_exc()
            raise
        
    async def close(self) -> None:
        """Cierra el navegador."""
        try:
            if self.browser:
                await self.browser.close()
                print("INHRR_SCRAPER: Navegador cerrado", flush=True)
        except Exception as e:
            print(f"Error closing browser: {e}", flush=True)
        finally:
            self._page = None
            if self.playwright:
                try:
                    await self.playwright.stop()
                except:
                    pass
                self.playwright = None
            
    async def _safe_goto(self, url: str, retries: Optional[int] = None) -> bool:
        """
        Navega a una URL con reintentos.
        
        Returns:
            True si tuvo éxito, False si falló
        """
        if retries is None:
            retries = self.max_retries
            
        page = self.page
        
        for attempt in range(retries):
            try:
                print(f"INHRR_SCRAPER: Navigating to {url} (attempt {attempt + 1}/{retries})...", flush=True)
                response = await page.goto(url, wait_until='networkidle')
                print(f"INHRR_SCRAPER: Response: {response}", flush=True)
                
                # === AGREGADO: Esperar a que cargue contenido dinámico ===
                print("INHRR_SCRAPER: Waiting for network to be idle...", flush=True)
                await page.wait_for_load_state('networkidle', timeout=30000)
                print("INHRR_SCRAPER: Network idle - contenido dinámico cargado", flush=True)
                
                await asyncio.sleep(self.rate_limit)
                return True
                
            except PlaywrightTimeout:
                print(f"INHRR_SCRAPER: Timeout en {url}, intento {attempt + 1}/{retries}", flush=True)
                await asyncio.sleep(2 ** attempt)
                
            except Exception as e:
                print(f"INHRR_SCRAPER: Error navigating to {url}: {e}", flush=True)
                await asyncio.sleep(2 ** attempt)
                
        print(f"INHRR_SCRAPER: Falló navegación a {url} después de {retries} intentos", flush=True)
        return False
        
    async def _accept_cookies(self) -> bool:
        """Acepta cookies si aparece el popup."""
        try:
            page = self.page
            accept_btn = page.locator('button:has-text("Aceptar")')
            if await accept_btn.count() > 0:
                await accept_btn.click()
                await asyncio.sleep(0.5)
                print("INHRR_SCRAPER: Cookies aceptadas", flush=True)
                return True
        except Exception as e:
            print(f"INHRR_SCRAPER: Error accepting cookies: {e}", flush=True)
        return False
        
    async def _get_total_pages(self) -> int:
        """
        Obtiene el número total de páginas de resultados.
        
        Returns:
            Número total de páginas
        """
        try:
            page = self.page
            pagination = page.locator('.pagination, nav ul li, .page-item')
            count = await pagination.count()
            
            if count > 0:
                page_links = page.locator('a[href*="page"]')
                all_links = await page_links.all()
                
                if all_links:
                    last_link = all_links[-1]
                    href = await last_link.get_attribute('href')
                    match = re.search(r'page[=\/](\d+)', href or '')
                    if match:
                        return int(match.group(1))
                        
            return 1
            
        except Exception as e:
            print(f"INHRR_SCRAPER: Error obteniendo páginas: {e}", flush=True)
            return 1
    
    async def _parse_medication_row(self, row) -> Optional[Dict[str, Any]]:
        """
        Parsea una fila de la tabla de medicamentos.
        
        Args:
            row: Elemento de la fila de la tabla
            
        Returns:
            Diccionario con los datos del medicamento o None si hay error
        """
        try:
            cols = row.locator('td')
            all_cols = await cols.all()
            
            if len(all_cols) < 4:
                print("INHRR_SCRAPER: Fila con menos de 4 columnas, saltando...", flush=True)
                return None
                
            registration_code = (await all_cols[0].inner_text()).strip()
            product_name = (await all_cols[1].inner_text()).strip()
            active_ingredient = (await all_cols[2].inner_text()).strip()
            laboratory = (await all_cols[3].inner_text()).strip()
            
            status = 'VIGENTE'
            try:
                status_text = (await all_cols[-1].inner_text()).strip()
                for key, value in STATUS_MAP.items():
                    if key in status_text.upper():
                        status = value
                        break
            except Exception:
                pass
            
            presentation = 'other'
            product_upper = product_name.upper()
            for key, value in PRESENTATION_MAP.items():
                if key in product_upper:
                    presentation = value
                    break
                    
            concentration = ""
            concentration_match = re.search(
                r'([\d,\.]+\s*(?:mg|g|ml|mcg|IU|mEq|%)\s*[-–/]?\s*[\d,\.]*\s*(?:mg|g|ml|mcg|IU|mEq|%)?',
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
                'laboratory': laboratory,
                'inhrr_code': registration_code,
                'inhrr_status': status,
                'source': 'INHRR',
                'is_active': True,
                'therapeutic_action': None,
            }
            
        except Exception as e:
            print(f"INHRR_SCRAPER: Error parseando fila: {e}", flush=True)
            return None
            
    async def scrape_all(self, max_pages: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Scrapea todos los medicamentos del INHRR.
        
        Args:
            max_pages: Límite de páginas a scrapear (None = todas)
            
        Returns:
            Lista de diccionarios con datos de medicamentos
        """
        print("INHRR_SCRAPER: Iniciando scraping completo...", flush=True)
        all_medications: List[Dict[str, Any]] = []
        
        try:
            if not await self._safe_goto(self.SEARCH_URL):
                raise Exception("No se pudo acceder a la página de búsqueda")
                
            await self._accept_cookies()
            
            total_pages = await self._get_total_pages()
            print(f"INHRR_SCRAPER: Total de páginas detectadas: {total_pages}", flush=True)
            
            if max_pages and max_pages < total_pages:
                total_pages = max_pages
                print(f"INHRR_SCRAPER: Limitando a {max_pages} páginas", flush=True)
                
            page = self.page
            
            for page_num in range(1, total_pages + 1):
                print(f"INHRR_SCRAPER: Procesando página {page_num}/{total_pages}", flush=True)
                
                if page_num > 1:
                    page_url = f"{self.SEARCH_URL}?page={page_num}"
                    if not await self._safe_goto(page_url):
                        print(f"INHRR_SCRAPER: Error en página {page_num}, continuando...", flush=True)
                        continue
                        
                await page.wait_for_selector('table tbody tr', timeout=10000)
                
                rows = page.locator('table tbody tr')
                all_rows = await rows.all()
                page_count = 0
                
                for row in all_rows:
                    medication = await self._parse_medication_row(row)
                    if medication:
                        all_medications.append(medication)
                        page_count += 1
                        
                print(
                    f"INHRR_SCRAPER: Página {page_num} completada, "
                    f"medicamentos: {page_count}, total: {len(all_medications)}",
                    flush=True
                )
                
                await asyncio.sleep(self.rate_limit)
                
        except Exception as e:
            print(f"INHRR_SCRAPER: Error durante scraping: {e}", flush=True)
            
        print(
            f"INHRR_SCRAPER: Scraping completado. "
            f"Total de medicamentos extraídos: {len(all_medications)}",
            flush=True
        )
        
        return all_medications
        
    async def scrape_sample(self, count: int = 10) -> List[Dict[str, Any]]:
        """
        Scrapea una muestra de medicamentos para pruebas.
        
        Args:
            count: Número de medicamentos a scrapear
            
        Returns:
            Lista de diccionarios con datos de medicamentos
        """
        print(f"INHRR_SCRAPER: Scraping muestra de {count} medicamentos...", flush=True)
        
        try:
            if not await self._safe_goto(self.SEARCH_URL):
                raise Exception("No se pudo acceder a la página de búsqueda")
                
            await self._accept_cookies()
            
            page = self.page
            
            # === AGREGADO: Esperar a que cargue el contenido dinámico ===
            print("INHRR_SCRAPER: Esperando a que cargue el contenido dinámico...", flush=True)
            await page.wait_for_load_state('networkidle', timeout=30000)
            
            # También esperar un poco más por si hay más llamadas API
            print("INHRR_SCRAPER: Esperando 3 segundos adicionales...", flush=True)
            await asyncio.sleep(3)
            
            # Buscar tablas
            table_count = await page.locator('table').count()
            print(f"INHRR_SCRAPER: Número de tablas encontradas: {table_count}", flush=True)
            
            medications: List[Dict[str, Any]] = []
            
            if table_count > 0:
                await page.wait_for_selector('table tbody tr', timeout=15000)
                rows = page.locator('table tbody tr')
                all_rows = await rows.all()
                print(f"INHRR_SCRAPER: Total de filas encontradas: {len(all_rows)}", flush=True)
                
                for row in all_rows[:count]:
                    medication = await self._parse_medication_row(row)
                    if medication:
                        medications.append(medication)
            else:
                print("INHRR_SCRAPER: No se encontraron tablas después de esperar", flush=True)
            
            print(
                f"INHRR_SCRAPER: Muestra completada. "
                f"Medicamentos extraídos: {len(medications)}",
                flush=True
            )
            
            return medications
            
        except Exception as e:
            print(f"INHRR_SCRAPER: Error en sample: {e}", flush=True)
            import traceback
            traceback.print_exc()
            return []
async def run_inhrr_scraper(
    headless: bool = True,
    max_pages: Optional[int] = None,
    sample: bool = False,
    sample_count: int = 10
) -> List[Dict[str, Any]]:
    """
    Función de utilidad para ejecutar el scraper de forma simple.
    
    Args:
        headless: Si True, ejecuta sin interfaz
        max_pages: Límite de páginas (None = todas)
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