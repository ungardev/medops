# MedOps — Elite Clinical Consultation Management Platform (v1.0.0)

[Video Demo](https://youtu.be/708B1hdxhO8)

---

## Phase 1 — Institutional Introduction

MedOps is a **large-scale, audited, and professional web application** designed to manage medical and clinical consultations with precision, security, and institutional rigor.  
Developed as the **Final Project for CS50W (Web Programming with Python and JavaScript)**, MedOps demonstrates the ability to transform complex healthcare workflows into a robust, reliable, and visually sober platform.

This project is not just a technical exercise — it is a **proof of competence and gratitude**.  
Thanks to the knowledge and guidance provided by **CS50 and Harvard University**, MedOps was built as a system that reflects the highest standards of software engineering, combining:

- **Backend robustness** with Django and Django REST Framework.  
- **Frontend clarity** with React, TypeScript, and modern design principles.  
- **Institutional auditability** through secure authentication, real-time notifications, and financial tracking.  
- **Professional deployment** with Ubuntu, Nginx, Gunicorn, and AWS.

MedOps stands as an **elite, top-tier clinical management system**, showing how the skills acquired through CS50 empower developers to build projects of true magnitude and impact.

---

## Phase 2 — Features

MedOps provides a comprehensive set of features that transform complex healthcare workflows into a secure, auditable, and professional system:

- 🩺 **Clinical Management**  
  Manage consultations, patients, and real-time workflows with precision and clarity.

- 💵 **Financial Management**  
  Track confirmed, canceled, and exempted payments with multi-currency balance support.

- 🔔 **Real-time Notifications**  
  Receive instant alerts for clinical and financial events, ensuring timely decisions.

- 🗂️ **Institutional Audit**  
  Export logs and maintain a complete audit trail for compliance and accountability.

- 📊 **Interactive Charts**  
  Visualize clinical and financial trends with dynamic, interactive dashboards.

- 🔒 **Security**  
  Token-based authentication, Axios interceptors, and secure AWS deployment ensure robust protection.

- 📱 **Responsive Layout**  
  A sober, professional design optimized for both desktop, mobile and tablet devices.

---

## Phase 3 — Tech Stack

MedOps is built with a modern, secure, and scalable technology stack that ensures robustness, clarity, and reproducibility:

- **Frontend**  
  - React + TypeScript for strong typing and modular components.  
  - Vite for fast builds and development.  
  - TailwindCSS for sober, responsive, and professional design.  

- **Backend**  
  - Django for institutional backend robustness.  
  - Django REST Framework (DRF) for secure, auditable APIs.  

- **Database**  
  - PostgreSQL for reliability, scalability, and strict relational integrity.  

- **Infrastructure**  
  - Ubuntu as the operating system base.  
  - Nginx + Gunicorn for production-grade deployment.  
  - AWS for secure, scalable cloud hosting.  

- **Visualization**  
  - Chart.js for interactive and professional data visualization.  

- **State Management**  
  - React Query for efficient data fetching, caching, and synchronization.  

---

## Phase 4 — Project Structure

The MedOps repository is organized into a clear, auditable structure that reflects both backend and frontend components, as well as institutional data and deployment scripts.

```bash
medops/
├── BACKUP.md                # Documentation for backup procedures
├── DEPLOY.md                # Deployment instructions
├── Pipfile / Pipfile.lock   # Python environment management
├── README.md                # Institutional documentation
├── RESTORE.md               # Restore procedures
├── backup.sh                # Automated backup script
├── backups/                 # SQL backups with timestamps
│   └── medops_backup_*.sql
├── core/                    # Main Django app (clinical + financial logic)
│   ├── admin.py             # Django admin customizations
│   ├── api_urls.py          # API routing
│   ├── api_views.py         # API views
│   ├── choices.py           # Institutional enums
│   ├── fixtures/            # Initial data (ICD-11, specialties)
│   ├── management/commands/ # Custom Django commands (import ICD-11, seed, scrape BCV rate)
│   ├── migrations/          # Full migration history (patients, referrals, payments, reports)
│   ├── models.py            # Core institutional models
│   ├── serializers.py       # DRF serializers
│   ├── signals.py           # Event-driven signals
│   ├── static/core/         # Static assets (css, img, js)
│   ├── templates/           # Institutional templates (admin, dashboards, documents, reports, pdf)
│   ├── tests.py             # Unit tests
│   └── utils/               # Utilities (events, pdf, history)
├── data/icd11/              # ICD-11 reference files (txt, xlsx)
├── db.sqlite3               # Local development database
├── deploy.sh / deploy.log   # Deployment scripts and logs
├── frontend/medops/         # React + TypeScript frontend
│   ├── dist/                # Production build
│   ├── public/              # Logos and static assets
│   ├── src/                 # Source code
│   │   ├── api/             # API client
│   │   ├── components/      # UI components (Consultation, Dashboard, Auth, Common)
│   │   ├── context/         # React context providers
│   │   ├── hooks/           # React Query hooks
│   │   ├── lib/             # Utilities
│   │   ├── pages/           # Page-level components (WaitingRoom, Consultation, Reports, Search)
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Helper functions
│   ├── tailwind.config.js   # TailwindCSS configuration
│   ├── tsconfig.json        # TypeScript configuration
│   └── vite.config.ts       # Vite configuration
├── logs/                    # Institutional logs (audit, cron jobs)
├── manage.py                # Django entry point
├── media/                   # Uploaded medical documents and logos
│   ├── logos/               # Institutional branding
│   └── medical_documents/   # Generated PDFs (reports, referrals, prescriptions, treatments)
├── requirements.txt         # Python dependencies
├── schema.yaml              # API schema definition
└── staticfiles/             # Django collected static files
```

---

## Phase 5 — Installation & Usage

MedOps can be run both in **development mode** for CS50W evaluation and in **production mode** for real-world deployment.

---

### Development Mode (CS50W Demo)

1. **Clone the repository**
   ```bash
   git clone https://github.com/ungardev/medops.git
   cd medops
   

2. **Backend setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver

3. **Frontend setup**
   ```bash
   cd frontend/medops
   npm install
   npm run dev

4. **Access the system**
   Backend API: http://localhost:8000
   Frontend UI: http://localhost:5173



This mode is used for CS50W submission and demo video, ensuring evaluators can run the system easily.

## Production Mode (Ubuntu + AWS)

### Server Environment
- Ubuntu 24.04 LTS  
- PostgreSQL 16  
- Nginx + Gunicorn  

---

### Deployment Steps
```bash
# Backend
pip install -r requirements.txt
python manage.py migrate
gunicorn medops.wsgi:application --bind 0.0.0.0:8000

# Frontend
cd frontend/medops
npm install
npm run build

## Configure Nginx
- Reverse proxy to Gunicorn backend.  
- Serve frontend build from `/frontend/medops/dist`.  
- Enable HTTPS with institutional certificates.  

---

## Environment Variables
- `.env` files documented for reproducibility.  
- Tokens, database credentials, and AWS keys managed securely.  

---

## Usage Notes
- **Auditability**: All actions generate institutional logs (`logs/audit.log`).  
- **Reproducibility**: Any evaluator can reproduce the environment using documented steps.  
- **Scalability**: Production deployment is ready for AWS EC2 with load balancing.  
```

## Phase 6 — Demo Video

The demo video showcases the institutional magnitude of MedOps, highlighting its clinical, financial, and audit capabilities.  
It follows a clear narrative to demonstrate reproducibility, sobriety, and professional deployment.

### Narrative Script

1. **Introduction**
   - Present MedOps as the *Final Project for CS50W*.  
   - Highlight its role as an elite, audited clinical management system.

2. **Login / Logout**
   - Show secure authentication with token-based login.  
   - Demonstrate logout to confirm session handling.

3. **Dashboard Overview**
   - Display the main dashboard with consultations, patients, and financial summaries.  
   - Emphasize sober, responsive layout (desktop, mobile and tablet).

4. **Clinical Workflow**
   - Start a consultation, manage patient data, and finalize the consultation.  
   - Show transition to the **Waiting Room** page.  

5. **Financial Management**
   - Demonstrate confirmed, canceled, and exempted payments.  
   - Present multi-currency balances and financial tracking.

6. **Notifications**
   - Trigger real-time notifications for clinical and financial events.  
   - Show how alerts appear instantly in the UI.

7. **Audit & Export**
   - Access the audit dashboard.  
   - Export institutional logs and reports (PDF, XLSX).  
   - Confirm reproducibility and compliance.

8. **Interactive Charts**
   - Display clinical and financial trends using Chart.js.  
   - Highlight clarity and interactivity of visualizations.

9. **Deployment Proof**
   - Show backend running with `python manage.py runserver` (CS50W demo).  
   - Mention production readiness with Gunicorn + Nginx on Ubuntu/AWS.

10. **Closing Message**
    - Express gratitude:  
      *“This project is possible thanks to CS50 and Harvard University, who provided the knowledge and tools to build MedOps, a large-scale, professional system.”*

## Phase 7 — Author & Gratitude

**Author**: Ungar Villamizar  

**CS50 Certifications**:  
- CS50P — Introduction to Programming with Python  
- CS50SQL — Introduction to Databases with SQL  
- CS50W — Web Programming with Python and JavaScript (Final Project: MedOps)
- CS50AI — Introduction to Artificial Intelligence with Python (upcoming)  

---

### Gratitude

MedOps is not only a technical project but also a **proof of competence and gratitude**.  
This system was made possible thanks to the knowledge and guidance provided by **CS50 and Harvard University**, who empowered the development of a large-scale, professional, and audited clinical management platform.

> *“This project is possible thanks to CS50 and Harvard University, who provided the knowledge and tools to build MedOps, a large‑scale, professional system.”*
