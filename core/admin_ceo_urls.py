from django.urls import path
from .admin import ceo_admin_site

urlpatterns = [
    path("", ceo_admin_site.urls),
]
