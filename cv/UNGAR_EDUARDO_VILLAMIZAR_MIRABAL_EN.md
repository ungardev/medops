# UNGAR EDUARDO VILLAMIZAR MIRABAL

Venezuela | +58 4241898413 | ungardev@outlook.com
LinkedIn | github.com/ungardev

---

## PROFESSIONAL SUMMARY

Full Stack Developer with 8 months of intensive production experience building MEDOPZ, a multi-tenant clinical SaaS platform serving doctors, patients, and administrators across three differentiated portals. Designed and shipped 157+ REST endpoints, 23 validated clinical calculators, and an AI-powered diagnostic center integrating OCR + LLM analysis. Strong ownership of backend architecture (Django 5.2 + DRF) and frontend engineering (React 19 + TypeScript strict mode), with production deployments on Vercel + Railway + Docker + Nginx.

---

## PROFESSIONAL EXPERIENCE

**MEDOPZ – Multi-Tenant Clinical SaaS Platform**
Full Stack Developer | Remote | Oct 2025 – Present

Architected and shipped a multi-tenant clinical management platform (Doctor / Patient / Admin portals) on Django 5.2 + React 19 + TypeScript strict, serving end-to-end clinical workflows from appointment booking to discharge — 66,000+ lines of code across 2,282 commits in 8 months.

### Backend & API Architecture
- Modeled a clinical domain of **75 Django entities** (including full Venezuelan geographic hierarchy: Country / State / Municipality / City / Parish / Neighborhood), with 22 migrations and strict schema versioning.
- Built **157+ REST endpoints** across 46 ViewSets and 117+ serializers, fully documented via OpenAPI 3.0 (drf-spectacular) with auto-generated TypeScript types (1,713 lines) consumed by the frontend.
- Implemented defense-in-depth authorization: 2 custom middlewares (JWTRoleValidation, InstitutionPermission), 5 permission classes, and 3 reusable mixins (PatientFamilyLinkRequiredMixin, DoctorPatientRelationshipRequiredMixin, UnifiedPatientDoctorAccessMixin) enforcing multi-institution access with emergency-mode auto-expiration.
- Designed dual audit logging (django-simple-history + custom AuditLog + MedicalStatusAuditLog) capturing IP, user-agent, access level, and institutional context on every critical write.

### Clinical Decision Support Engine
- Engineered a **Centro de Diagnóstico Inteligente** combining Tesseract OCR with OpenCV preprocessing (grayscale, denoising, Otsu threshold, deskew) + a regex parser covering **70+ lab tests** (cholesterol, HbA1c, troponins, electrolytes, liver enzymes, etc.) + Gemini 2.5 Flash (OpenAI-compatible endpoint) for structured JSON output with ICD-11 suggestions, abnormal flag severity, drug extraction, and full reasoning trace with confidence scoring.
- Built **23 validated clinical calculators** (BMI, CHA₂DS₂-VASc, HAS-BLED, CKD-EPI, GCS, qSOFA, Wells PE, MELD/MELD-Na, Framingham, APACHE II, CURB-65, Child-Pugh, SOFA, NEWS2, TIMI, HEART, PERC, Caprini, RCRI, ORBIT) with factory registration, dataclass-based input/output contracts, and historical persistence.

### DevOps & Production
- Containerized the entire stack with multi-stage Dockerfiles (Python 3.11-slim with WeasyPrint / Playwright / Tesseract dependencies + Node 22-alpine + Nginx alpine), orchestrated via docker-compose with 5 services plus 2 WHO ICD-11 API instances (ES/EN).
- Configured Vercel for frontend SPA with rewrites + Railway for backend with Gunicorn 2 workers, automated via deploy.sh (git pull / build / migrate / collectstatic / restart).
- Integrated Sentry for both backend (DjangoIntegration, 10% traces) and frontend (BrowserTracing + Replay sessions).
- Implemented persistent storage on Cloudflare R2 (S3-compatible) with date-organized paths for medical documents, diagnosis files, reports, institution logos, and doctor signatures.

### Frontend Engineering
- Built **50+ React pages and 152 components** across 22 domains with 132 custom hooks and 5 global contexts (Auth, AdminAuth, Patient, DashboardFilters, Notify).
- Implemented TypeScript strict mode + verbatimModuleSyntax + noUnusedLocals + noUnusedParameters, with 1,713 lines of auto-generated types from OpenAPI keeping API/frontend in lockstep.
- Applied aggressive code splitting (React.lazy + Suspense Priority 1/2 + manual Vite chunks for react, ui, pdf, canvas), reducing Diagnosis bundle by ~30% in recent refactors.
- Designed a custom design system (EliteModal, EliteDropdown, ModalShell, DrawerShell) with the "Emerald Identity" theme (deep dark palette + emerald accents), eradicating all emojis and blue CTAs across 80+ components in the MEDOPZ 2.0 rebrand.

### Performance & Reliability
- Achieved 3-layer caching strategy for patient records (React Query persist + TanStack offline cache + Django cache framework), eliminating skeleton reloads on navigation.
- Optimized NeonDB with strategic indexes, prefetch_related, and connection pooling — comprehensive perf commit reducing query time by 40%+ on critical flows.
- Removed 6 N+1 count queries from live queue endpoint and applied keepPreviousData in tabbed views for instant tab switching.

### Security & Compliance
- Hardened production security: required auth on all API endpoints by default (AllowAny only for explicit public routes like QR verification).
- Implemented MPPS Venezuela (Ministry of Popular Power for Health) compliance fieldsets in doctor/admin registration.
- Removed hardcoded credentials from seed scripts, added secrets via environment variables with .env.production gitignored.
- Built a public document verification portal (verify.medopz.com) using QR codes with audit codes — zero-auth, cryptographic integrity check.

---

## CERTIFICATIONS — Harvard University CS50 & HP LIFE

- **CS50 Web Programming with Python and JavaScript** — Full-stack development focused on security, scalability, and robust API design.
- **CS50 Artificial Intelligence with Python** — Neural Networks, NLP, and Computer Vision implementation using TensorFlow.
- **CS50 Databases with SQL** — Mastery of relational modeling, normalization, and performance optimization.
- **CS50 Programming with Python** — Core software engineering, OOP principles, and unit testing.
- **HP LIFE Data Science and Analytics** — Predictive analytics and strategic data-driven decision making. May 2026.
- **CS50 Cybersecurity** — Currently enrolled. Focus on offensive/defensive security and vulnerability mitigation.

---

## EDUCATION

**Universidad Católica Andrés Bello (UCAB)** | Caracas, Venezuela
Computer Engineering (6 Semesters Completed) | 2013 – 2017

---

## TECHNICAL SKILLS

**Languages:** Python (Expert), TypeScript (Strict), JavaScript (ES2022), SQL, HTML5, CSS3, Bash, YAML

**Backend:** Django 5.2, Django REST Framework, FastAPI, Flask, Celery, Asyncio, JWT (SimpleJWT), OpenAPI 3.0, OAuth2, Webhooks

**Frontend:** React 19, TypeScript (strict + verbatimModuleSyntax), Vite 7, TailwindCSS 4, Astro 4, React Query 5, React Hook Form, Recharts, Chart.js, react-big-calendar, react-dropzone, Material UI

**Datastores:** PostgreSQL 15 (production), SQLite (development), Redis (broker), Elasticsearch 7 (SNOMED CT), Cloudflare R2 (S3-compatible)

**AI / ML:** Google Gemini 2.5 Flash (OpenAI-compatible endpoint), Tesseract OCR, OpenCV, TensorFlow (CS50 academic), regex-based NLP for clinical text extraction

**DevOps & Infra:** Docker, docker-compose, Nginx, GitHub Actions, Vercel, Railway, Sentry, Playwright (headless browser), WeasyPrint (PDF generation), Gunicorn, WhiteNoise

**Domain:** Clinical workflows (ICD-11, SNOMED CT), 23 validated medical calculators, multi-tenant SaaS, multi-portal routing, Venezuelan compliance (MPPS)

**Languages:** Spanish (Native), English (Professional Working Proficiency)
