# medops/celery.py
import os
try:
    from celery import Celery  
    
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medops.settings')
    
    app = Celery('medops') # type: ignore
    app.config_from_object('django.conf:settings', namespace='CELERY')
    app.autodiscover_tasks()
    
    @app.task(bind=True, ignore_result=True)
    def debug_task(self):
        print(f'Request: {self.request!r}')
        
except (ImportError, ModuleNotFoundError):
    app = None