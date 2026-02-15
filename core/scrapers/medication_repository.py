# core/scrapers/medication_repository.py
"""
Repository pattern para operaciones CRUD del MedicationCatalog.
Optimizado para batch inserts y actualizaciones masivas.
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from django.db import transaction
from django.utils.timezone import now
from core.models import MedicationCatalog
audit = logging.getLogger("audit")
class MedicationRepository:
    """
    Repositorio para operaciones del catálogo de medicamentos.
    Maneja batch inserts y updates para performance.
    """
    
    BATCH_SIZE = 100  # Registros por batch
    
    @classmethod
    def upsert_many(cls, medications: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Inserta o actualiza múltiples medicamentos.
        
        Args:
            medications: Lista de diccionarios con datos del medicamento
            
        Returns:
            Dict con estadísticas: {'created': N, 'updated': N, 'errors': N}
        """
        if not medications:
            audit.warning("MEDICATION_REPOSITORY: Lista vacía, no hay nada que insertar")
            return {'created': 0, 'updated': 0, 'errors': 0}
        
        stats = {'created': 0, 'updated': 0, 'errors': 0}
        timestamp = now()
        
        try:
            with transaction.atomic():
                for i in range(0, len(medications), cls.BATCH_SIZE):
                    batch = medications[i:i + cls.BATCH_SIZE]
                    created_count, updated_count, errors = cls._process_batch(batch, timestamp)
                    stats['created'] += created_count
                    stats['updated'] += updated_count
                    stats['errors'] += errors
                    
                    audit.info(
                        f"MEDICATION_REPOSITORY: Procesado batch {i//cls.BATCH_SIZE + 1}, "
                        f"total: {len(medications)}, created: {stats['created']}, "
                        f"updated: {stats['updated']}, errors: {stats['errors']}"
                    )
                    
        except Exception as e:
            audit.error(f"MEDICATION_REPOSITORY: Error en transacción masiva: {e}")
            stats['errors'] = len(medications)
            
        return stats
    
    @classmethod
    def _process_batch(
        cls, 
        batch: List[Dict[str, Any]], 
        timestamp: datetime
    ) -> tuple[int, int, int]:
        """
        Procesa un batch de medicamentos.
        
        Returns:
            Tuple (created_count, updated_count, error_count)
        """
        created = 0
        updated = 0
        errors = 0
        
        for med_data in batch:
            try:
                # Buscar si ya existe
                existing = MedicationCatalog.objects.filter(
                    inhrr_code=med_data.get('inhrr_code')
                ).first()
                
                if existing:
                    # Actualizar existente
                    cls._update_medication(existing, med_data, timestamp)
                    existing.save()
                    updated += 1
                else:
                    # Crear nuevo
                    medication = MedicationCatalog(**med_data)
                    medication.last_scraped_at = timestamp
                    medication.save()
                    created += 1
                    
            except Exception as e:
                audit.error(
                    f"MEDICATION_REPOSITORY: Error procesando {med_data.get('name', 'UNKNOWN')}: {e}"
                )
                errors += 1
                
        return created, updated, errors
    
    @classmethod
    def _update_medication(
        cls, 
        medication: MedicationCatalog, 
        data: Dict[str, Any],
        timestamp: datetime
    ) -> None:
        """Actualiza los campos de un medicamento."""
        
        # Campos que pueden cambiar del INHRR
        update_fields = [
            'name', 'generic_name', 'presentation', 'concentration',
            'route', 'unit', 'presentation_size', 'concentration_detail',
            'code', 'inhrr_code', 'atc_code', 'is_controlled',
            'therapeutic_action', 'inhrr_status', 'source'
        ]
        
        for field in update_fields:
            if field in data and data[field] is not None:
                setattr(medication, field, data[field])
        
        medication.last_scraped_at = timestamp
        medication.save(update_fields=update_fields + ['last_scraped_at', 'updated_at'])
    
    @classmethod
    def count(cls, source: Optional[str] = None, status: Optional[str] = None) -> int:
        """
        Cuenta medicamentos en el catálogo.
        
        Args:
            source: Filtrar por fuente (INHRR, MANUAL, etc.)
            status: Filtrar por estatus del INHRR
            
        Returns:
            Cantidad de medicamentos
        """
        queryset = MedicationCatalog.objects.filter(is_active=True)
        
        if source:
            queryset = queryset.filter(source=source)
        if status:
            queryset = queryset.filter(inhrr_status=status)
            
        return queryset.count()
    
    @classmethod
    def get_by_source(cls, source: str, limit: int = 100) -> List[MedicationCatalog]:
        """
        Obtiene medicamentos por fuente.
        
        Args:
            source: Fuente de datos (INHRR, MANUAL)
            limit: Límite de registros
            
        Returns:
            Lista de medicamentos
        """
        return list(
            MedicationCatalog.objects.filter(source=source, is_active=True)[:limit]
        )
    
    @classmethod
    def clear_by_source(cls, source: str) -> int:
        """
        Elimina medicamentos de una fuente específica.
        Útil para re-scrapeo completo.
        
        Args:
            source: Fuente de datos a eliminar
            
        Returns:
            Cantidad de registros eliminados
        """
        deleted, _ = MedicationCatalog.objects.filter(source=source).delete()
        audit.warning(f"MEDICATION_REPOSITORY: Eliminados {deleted} medicamentos de {source}")
        return deleted
    
    @classmethod
    def search(cls, query: str, limit: int = 50) -> List[MedicationCatalog]:
        """
        Búsqueda simple por nombre o principio activo.
        
        Args:
            query: Término de búsqueda
            limit: Límite de resultados
            
        Returns:
            Lista de medicamentos que coinciden
        """
        return list(
            MedicationCatalog.objects.filter(
                is_active=True
            ).filter(
                name__icontains=query
            ) | MedicationCatalog.objects.filter(
                is_active=True
            ).filter(
                generic_name__icontains=query
            )
        )[:limit]