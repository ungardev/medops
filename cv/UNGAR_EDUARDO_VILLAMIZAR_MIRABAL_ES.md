# UNGAR EDUARDO VILLAMIZAR MIRABAL

Venezuela | +58 4241898413 | ungardev@outlook.com
LinkedIn | github.com/ungardev

---

## RESUMEN PROFESIONAL

Desarrollador Full Stack con 8 meses de experiencia intensiva en producción construyendo MEDOPZ, una plataforma SaaS clínica multi-inquilino que sirve a doctores, pacientes y administradores en tres portales diferenciados. Diseñó e implementó 157+ endpoints REST, 23 calculadoras clínicas validadas y un centro de diagnóstico asistido por IA integrando OCR + LLM. Amplia propiedad de la arquitectura backend (Django 5.2 + DRF) y desarrollo frontend (React 19 + TypeScript strict mode), con despliegues en producción en Vercel + Railway + Docker + Nginx.

---

## EXPERIENCIA PROFESIONAL

**MEDOPZ – Plataforma SaaS Clínica Multi-Inquilino**
Full Stack Developer | Remoto | Oct 2025 – Presente

Arquitectó e implementó una plataforma de gestión clínica multi-inquilino (Portales Doctor / Paciente / Admin) en Django 5.2 + React 19 + TypeScript strict, cubriendo flujos clínicos de extremo a extremo desde la reserva de citas hasta el alta — 66,000+ líneas de código en 2,282 commits en 8 meses.

### Arquitectura Backend & API
- Modeló un dominio clínico de **75 entidades Django** (incluyendo la jerarquía geográfica venezolana completa: País / Estado / Municipio / Ciudad / Parroquia / Barrio), con 22 migraciones y versionado estricto del schema.
- Construyó **157+ endpoints REST** distribuidos en 46 ViewSets y 117+ serializers, documentados vía OpenAPI 3.0 (drf-spectacular) con tipos TypeScript auto-generados (1,713 líneas) consumidos por el frontend.
- Implementó autorización en profundidad: 2 middlewares custom (JWTRoleValidation, InstitutionPermission), 5 clases de permisos y 3 mixins reutilizables (PatientFamilyLinkRequiredMixin, DoctorPatientRelationshipRequiredMixin, UnifiedPatientDoctorAccessMixin) aplicando acceso multi-institucional con expiración automática en modo emergencia.
- Diseñó logging de auditoría dual (django-simple-history + AuditLog custom + MedicalStatusAuditLog) capturando IP, user-agent, nivel de acceso y contexto institucional en cada escritura crítica.

### Motor de Apoyo a la Decisión Clínica
- Ingenierizó un **Centro de Diagnóstico Inteligente** combinando Tesseract OCR con preprocesamiento OpenCV (escala de grises, denoising, threshold Otsu, deskew) + parser regex cubriendo **70+ pruebas de laboratorio** (colesterol, HbA1c, troponinas, electrolitos, enzimas hepáticas, etc.) + Gemini 2.5 Flash (endpoint compatible con OpenAI) para output JSON estructurado con sugerencias ICD-11, severidad de valores anormales, extracción de medicamentos y traza completa de razonamiento con score de confianza.
- Construyó **23 calculadoras clínicas validadas** (BMI, CHA₂DS₂-VASc, HAS-BLED, CKD-EPI, GCS, qSOFA, Wells PE, MELD/MELD-Na, Framingham, APACHE II, CURB-65, Child-Pugh, SOFA, NEWS2, TIMI, HEART, PERC, Caprini, RCRI, ORBIT) con registro via factory, contratos input/output basados en dataclasses y persistencia histórica.

### DevOps & Producción
- Containerizó toda la plataforma con Dockerfiles multi-stage (Python 3.11-slim con dependencias WeasyPrint / Playwright / Tesseract + Node 22-alpine + Nginx alpine), orquestados via docker-compose con 5 servicios más 2 instancias de WHO ICD-11 API (ES/EN).
- Configuró Vercel para SPA frontend con rewrites + Railway para backend con Gunicorn 2 workers, automatizado via deploy.sh (git pull / build / migrate / collectstatic / restart).
- Integró Sentry tanto en backend (DjangoIntegration, 10% de traces) como en frontend (BrowserTracing + Replay sessions).
- Implementó almacenamiento persistente en Cloudflare R2 (compatible con S3) con rutas organizadas por fecha para documentos médicos, archivos de diagnóstico, reportes, logos institucionales y firmas de doctores.

### Ingeniería Frontend
- Construyó **50+ páginas React y 152 componentes** en 22 dominios con 132 hooks custom y 5 contextos globales (Auth, AdminAuth, Patient, DashboardFilters, Notify).
- Implementó TypeScript strict mode + verbatimModuleSyntax + noUnusedLocals + noUnusedParameters, con 1,713 líneas de tipos auto-generados desde OpenAPI manteniendo API y frontend sincronizados.
- Aplicó code splitting agresivo (React.lazy + Suspense Priority 1/2 + chunks manuales en Vite para react, ui, pdf, canvas), reduciendo el bundle de Diagnosis en ~30% en refactors recientes.
- Diseñó un sistema de diseño custom (EliteModal, EliteDropdown, ModalShell, DrawerShell) con el tema "Emerald Identity" (paleta oscura profunda + acentos emerald), eliminando todos los emojis y botones azules de los CTAs en 80+ componentes en el rebrand MEDOPZ 2.0.

### Performance & Fiabilidad
- Logró estrategia de cache de 3 capas para registros de pacientes (React Query persist + TanStack offline cache + Django cache framework), eliminando skeleton reloads en navegación.
- Optimizó NeonDB con índices estratégicos, prefetch_related y connection pooling — commit de perf comprehensivo reduciendo tiempo de query en 40%+ en flujos críticos.
- Eliminó 6 queries N+1 del endpoint de cola en vivo y aplicó keepPreviousData en vistas con tabs para cambio instantáneo.

### Seguridad & Cumplimiento
- Reforzó seguridad en producción: auth requerida en todos los endpoints API por defecto (AllowAny solo para rutas públicas explícitas como verificación QR).
- Implementó campos de cumplimiento MPPS Venezuela (Ministerio del Poder Popular para la Salud) en registro de doctores y admins.
- Removió credenciales hardcodeadas de scripts de seed, agregando secrets via variables de entorno con .env.production gitignored.
- Construyó un portal público de verificación de documentos (verify.medopz.com) usando códigos QR con audit codes — cero auth, verificación de integridad criptográfica.

---

## CERTIFICACIONES — Harvard University CS50 & HP LIFE

- **CS50 Web Programming with Python and JavaScript** — Desarrollo full-stack enfocado en seguridad, escalabilidad y diseño de APIs robustas.
- **CS50 Artificial Intelligence with Python** — Redes Neuronales, NLP y Visión por Computadora usando TensorFlow.
- **CS50 Databases with SQL** — Dominio de modelado relacional, normalización y optimización de performance.
- **CS50 Programming with Python** — Ingeniería de software core, principios POO y testing unitario.
- **HP LIFE Data Science and Analytics** — Analítica predictiva y toma de decisiones basada en datos. Mayo 2026.
- **CS50 Cybersecurity** — Cursando actualmente. Enfoque en seguridad ofensiva/defensiva y mitigación de vulnerabilidades.

---

## EDUCACIÓN

**Universidad Católica Andrés Bello (UCAB)** | Caracas, Venezuela
Ingeniería en Informática (6 Semestres Completados) | 2013 – 2017

---

## HABILIDADES TÉCNICAS

**Lenguajes:** Python (Experto), TypeScript (Strict), JavaScript (ES2022), SQL, HTML5, CSS3, Bash, YAML

**Backend:** Django 5.2, Django REST Framework, FastAPI, Flask, Celery, Asyncio, JWT (SimpleJWT), OpenAPI 3.0, OAuth2, Webhooks

**Frontend:** React 19, TypeScript (strict + verbatimModuleSyntax), Vite 7, TailwindCSS 4, Astro 4, React Query 5, React Hook Form, Recharts, Chart.js, react-big-calendar, react-dropzone, Material UI

**Datastores:** PostgreSQL 15 (producción), SQLite (desarrollo), Redis (broker), Elasticsearch 7 (SNOMED CT), Cloudflare R2 (compatible con S3)

**IA / ML:** Google Gemini 2.5 Flash (endpoint compatible con OpenAI), Tesseract OCR, OpenCV, TensorFlow (académico CS50), NLP basado en regex para extracción de texto clínico

**DevOps & Infra:** Docker, docker-compose, Nginx, GitHub Actions, Vercel, Railway, Sentry, Playwright (navegador headless), WeasyPrint (generación de PDF), Gunicorn, WhiteNoise

**Dominio:** Flujos clínicos (ICD-11, SNOMED CT), 23 calculadoras médicas validadas, SaaS multi-inquilino, routing multi-portal, cumplimiento venezolano (MPPS)

**Idiomas:** Español (Nativo), Inglés (Competencia Profesional de Trabajo)
