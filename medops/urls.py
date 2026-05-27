"""
URL configuration for medops project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from django.conf.urls.static import static
from core.api_views import verify_document
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("ceo-admin/", include("core.admin_ceo_urls")),
    path("api/", include("core.api_urls")),
    # 🔹 Endpoint global de login basado en DRF Token
    path("api/auth/login/", obtain_auth_token, name="api_token_auth"),
    # 🔹 SimpleJWT token refresh
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # 🔹 Document Verification (publico - no requiere auth)
    path("d/<str:audit_code>/", verify_document, name="verify-document"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns += [
        re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
    ]
