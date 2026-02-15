# core/scrapers/inhrr_scraper.py
"""
Scraper para el Instituto Nacional de Higiene Rafael Rangel (INHRR).
Extrae el catálogo oficial de medicamentos registrados en Venezuela.
"""
import asyncio
import re
import logging
from typing import List, Dict, Any, Optional, cast
from datetime import datetime
from urllib.parse import urljoin
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout
audit = logging.getLogger("audit")
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
        audit.info("INHRR_SCRAPER: Lanzando navegador Playwright...")
        
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=self.headless,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        
        self._page = await self.browser.new_page()
        assert self._page is not None, "Failed to create browser page"
        page = cast(Page, self._page)
        await page.set_default_timeout(self.timeout) # type: ignore
        
        await page.set_extra_http_headers({
            'User-Agent': 'MEDOPZ-Bot/1.0 (+https://medopz.software)'
        })
        
        audit.info("INHRR_SCRAPER: Navegador listo")
        
    async def close(self) -> None:
        """Cierra el navegador."""
        if self.browser:
            await self.browser.close()
            audit.info("INHRR_SCRAPER: Navegador cerrado")
        self._page = None
            
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
                await page.goto(url, wait_until='networkidle')
                await asyncio.sleep(self.rate_limit)
                return True
                
            except PlaywrightTimeout:
                audit.warning(
                    f"INHRR_SCRAPER: Timeout en {url}, intento {attempt + 1}/{retries}"
                )
                await asyncio.sleep(2 ** attempt)
                
            except Exception as e:
                audit.error(
                    f"INHRR_SCRAPER: Error navegando a {url}: {e}, intento {attempt + 1}/{retries}"
                )
                await asyncio.sleep(2 ** attempt)
                
        audit.error(f"INHRR_SCRAPER: Falló navegación a {url} después de {retries} intentos")
        return False
        
    async def _accept_cookies(self) -> bool:
        """Acepta cookies si aparece el popup."""
        try:
            page = self.page
            accept_btn = page.locator('button:has-text("Aceptar")')
            if await accept_btn.count() > 0:
                await accept_btn.click()
                await asyncio.sleep(0.5)
                audit.info("INHRR_SCRAPER: Cookies aceptadas")
                return True
        except Exception:
            pass
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
            audit.warning(f"INHRR_SCRAPER: Error obteniendo páginas: {e}")
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
                audit.warning("INHRR_SCRAPER: Fila con menos de 4 columnas, saltando...")
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
            audit.error(f"INHRR_SCRAPER: Error parseando fila: {e}")
            return None
            
    async def scrape_all(self, max_pages: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Scrapea todos los medicamentos del INHRR.
        
        Args:
            max_pages: Límite de páginas a scrapear (None = todas)
            
        Returns:
            Lista de diccionarios con datos de medicamentos
        """
        audit.info("INHRR_SCRAPER: Initiating scraping completo...")
        all_medications: List[Dict[str, Any]] = []
        
        try:
            if not await self._safe_goto(self.SEARCH_URL):
                raise Exception("No se pudo acceder a la página de búsqueda")
                
            await self._accept_cookies()
            
            total_pages = await self._get_total_pages()
            audit.info(f"INHRR_SCRAPER: Total de páginas detectadas: {total_pages}")
            
            if max_pages and max_pages < total_pages:
                total_pages = max_pages
                audit.info(f"INHRR_SCRAPER: Limitando a {max_pages} páginas")
                
            page = self.page
            
            for page_num in range(1, total_pages + 1):
                audit.info(f"INHRR_SCRAPER: Procesando página {page_num}/{total_pages}")
                
                if page_num > 1:
                    page_url = f"{self.SEARCH_URL}?page={page_num}"
                    if not await self._safe_goto(page_url):
                        audit.error(f"INHRR_SCRAPER: Error en página {page_num}, continuando...")
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
                        
                audit.info(
                    f"INHRR_SCRAPER: Página {page_num} completada, "
                    f"medicamentos: {page_count}, total: {len(all_medications)}"
                )
                
                await asyncio.sleep(self.rate_limit)
                
        except Exception as e:
            audit.error(f"INHRR_SCRAPER: Error durante scraping: {e}")
            
        audit.info(
            f"INHRR_SCRAPER: Scraping completado. "
            f"Total de medicamentos extraídos: {len(all_medications)}"
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
        audit.info(f"INHRR_SCRAPER: Scraping muestra de {count} medicamentos...")
        
        try:
            if not await self._safe_goto(self.SEARCH_URL):
                raise Exception("No se pudo acceder a la página de búsqueda")
                
            await self._accept_cookies()
            
            page = self.page
            await page.wait_for_selector('table tbody tr', timeout=10000)
            
            medications: List[Dict[str, Any]] = []
            rows = page.locator('table tbody tr')
            all_rows = await rows.all()
            
            for row in all_rows[:count]:
                medication = await self._parse_medication_row(row)
                if medication:
                    medications.append(medication)
                    
            audit.info(
                f"INHRR_SCRAPER: Muestra completada. "
                f"Medicamentos extraídos: {len(medications)}"
            )
            
            return medications
            
        except Exception as e:
            audit.error(f"INHRR_SCRAPER: Error en sample: {e}")
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