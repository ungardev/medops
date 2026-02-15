# core/management/commands/scrape_inhrr_medications.py
"""
Management command para scrapeo de medicamentos del INHRR.
python manage.py scrape_inhrr_medications [opciones]
Opciones:
    --dry-run: Solo muestra cuántos se scrapearían
    --limit: Limita número de páginas
    --sample: Solo extrae una muestra (10 registros)
    --force: Fuerza re-scrapeo completo (borra cache)
    --headless: Ejecuta navegador visible (default: hidden)
"""
import asyncio
import logging
from django.core.management.base import BaseCommand, CommandError
from django.utils.timezone import now
from core.scrapers.inhrr_scraper import run_inhrr_scraper, INHRRScraper
from core.scrapers.medication_repository import MedicationRepository
audit = logging.getLogger("audit")
class Command(BaseCommand):
    help = "Scrapea medicamentos desde el INHRR y los guarda en MedicationCatalog"
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Solo mostrar cuántos medicamentos se scrapearían',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=0,
            help='Limitar número de páginas a scrapear (0 = sin límite)',
        )
        parser.add_argument(
            '--sample',
            action='store_true',
            help='Solo extraer una muestra de 10 medicamentos para pruebas',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='crapeo completoForzar re-s (borra cache del INHRR primero)',
        )
        parser.add_argument(
            '--headless',
            action='store_true',
            default=True,
            help='Ejecutar navegador en modo headless (default: True)',
        )
        parser.add_argument(
            '--visible',
            action='store_false',
            dest='headless',
            help='Hacer visible el navegador (para debugging)',
        )
    async def async_handle(self, dry_run, max_pages, sample, force, headless, current_count):
        """Handle asíncrono del command."""
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("INHRR MEDICATION SCRAPER"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        # Mostrar configuración
        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO(f"Modo: {'Dry Run' if dry_run else 'PRODUCCIÓN'}"))
        self.stdout.write(f"Páginas límite: {max_pages or 'ILIMITADO'}")
        self.stdout.write(f"Muestra: {'Sí' if sample else 'No'}")
        self.stdout.write(f"Force re-scrape: {'Sí' if force else 'No'}")
        self.stdout.write(f"Navegador: {'Headless' if headless else 'Visible'}")
        self.stdout.write("")
        self.stdout.write(self.style.WARNING(f"Medicamentos INHRR actuales: {current_count}"))
        self.stdout.write("")
        # Inicializar medications
        medications = []
        if sample:
            self.stdout.write(self.style.HTTP_INFO("Extrayendo muestra de 10 medicamentos..."))
            medications = await run_inhrr_scraper(
                headless=headless,
                sample=True,
                sample_count=10
            )
        elif dry_run:
            self.stdout.write(self.style.HTTP_INFO("Dry run: Solo contando páginas..."))
            async with INHRRScraper(headless=headless) as scraper:
                if not await scraper._safe_goto(scraper.SEARCH_URL):
                    raise CommandError("No se pudo acceder al INHRR")
                total_pages = await scraper._get_total_pages()
            self.stdout.write(self.style.SUCCESS(f"Páginas totales en INHRR: {total_pages}"))
            self.stdout.write(self.style.WARNING("Usa --limit para limitar páginas"))
        else:
            self.stdout.write(self.style.HTTP_INFO("Iniciando scraping completo..."))
            medications = await run_inhrr_scraper(
                headless=headless,
                max_pages=max_pages,
                sample=False
            )
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"Medicamentos extraídos: {len(medications)}"))
        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run: No se guardará nada"))
            return medications
        if not medications:
            self.stdout.write(self.style.ERROR("No se extrajeron medicamentos"))
            return medications
        # Guardar en base de datos
        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO("Guardando en base de datos..."))
        stats = MedicationRepository.upsert_many(medications)
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("RESULTADO DEL SCRAPING"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(f"Creados: {stats['created']}")
        self.stdout.write(f"Actualizados: {stats['updated']}")
        self.stdout.write(f"Errores: {stats['errors']}")
        self.stdout.write(f"Total procesados: {len(medications)}")
        self.stdout.write("")
        # Verificar totals
        new_count = MedicationRepository.count(source='INHRR')
        self.stdout.write(self.style.SUCCESS(f"Total en BD: {new_count}"))
        self.stdout.write("")
        return medications
    def handle(self, *args, **options):
        """Entry point del command."""
        dry_run = options['dry_run']
        max_pages = options['limit'] if options['limit'] > 0 else None
        sample = options['sample']
        force = options['force']
        headless = options['headless']
        # LLAMADAS SYNC - ejecutadas antes del contexto async
        current_count = MedicationRepository.count(source='INHRR')
        # Eliminar cache si --force (sync)
        if force and not dry_run:
            deleted = MedicationRepository.clear_by_source('INHRR')
        try:
            # Ejecutar el handle async y obtener medicamentos
            medications = asyncio.run(
                self.async_handle(dry_run, max_pages, sample, force, headless, current_count)
            )
            # Mostrar mensaje de cache borrado aquí si applyo --force
            if force and not dry_run:
                self.stdout.write(self.style.WARNING(f"Eliminados {deleted} medicamentos del cache"))
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("\nOperación cancelada por el usuario"))
        except Exception as e:
            audit.error(f"INHRR_SCRAPER: Error en command: {e}")
            raise CommandError(f"Error: {e}")