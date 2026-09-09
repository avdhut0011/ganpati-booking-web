<div align="center">

# 🌺 गणपती बाप्पा मूर्ती बुकिंग सिस्टीम
### Enterprise Ganpati Bappa Statue Booking, AI Business Intelligence, Marathi Bill Generation & Stall Management Platform

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![PyInstaller](https://img.shields.io/badge/PyInstaller-Standalone%20EXE-FFD43B?style=for-the-badge&logo=windows&logoColor=black)](https://pyinstaller.org)

> A production-grade statue booking management and business intelligence platform tailored for Ganpati festival stalls. Features include AI Business Intelligence, multilingual natural language querying (Marathi, English, Minglish), first-time setup onboarding, multi-owner collaboration, dynamic stall branding, instant Marathi PDF bill generation, deposit/payment tracking, duplicate statue validation, and 1-click WhatsApp payment reminders.

</div>

---

## 📋 Table of Contents

- [Key Highlights & Architecture](#-key-highlights--architecture)
- [System Features](#-system-features)
  - [1. 🤖 AI Business Intelligence & Smart Insights](#1--ai-business-intelligence--smart-insights)
  - [2. 💬 Multilingual "AI ला विचारा" (Ask AI) Chatbot](#2--multilingual-ai-ला-विचारा-ask-ai-chatbot)
  - [3. ⏰ 1-Click WhatsApp Payment Reminders & Daily Reports](#3--1-click-whatsapp-payment-reminders--daily-reports)
  - [4. First-Time Setup Wizard](#4-first-time-setup-wizard)
  - [5. Dynamic Stall Branding](#5-dynamic-stall-branding)
  - [6. Owner & Co-Owner Management](#6-owner--co-owner-management)
  - [7. Booking Lifecycle & Validation](#7-booking-lifecycle--validation)
  - [8. Marathi PDF Bill Generation](#8-marathi-pdf-bill-generation)
  - [9. Admin & Analytics Dashboard](#9-admin--analytics-dashboard)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Installation & Quick Start](#-installation--quick-start)
  - [Option A: Run Standalone Executable (.exe)](#option-a-run-standalone-executable-exe)
  - [Option B: Run from Source Code (Dev Environment)](#option-b-run-from-source-code-dev-environment)
- [AI Configuration (Google Gemini 1.5/2.5 Flash)](#-ai-configuration-google-gemini)
- [Building for Production](#-building-for-production)
- [Default Login Credentials](#-default-login-credentials)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Contact & Developer Credits](#-contact--developer-credits)

---

## 🌟 Key Highlights & Architecture

- **Dual-Engine AI Intelligence**: Powered by Google Gemini Flash API with an intelligent, zero-dependency offline fallback engine that answers queries instantly without internet.
- **Trilingual Natural Language Understanding**: Handles questions in pure Marathi (मराठी देवनागरी), English, and Minglish (Romanized Marathi, e.g. `aajche ekun sankalan kiti?`).
- **Single-Stall Deployment with Dynamic Branding**: Each deployment operates as an independent instance for a stall. Stall owners configure their stall name, stall number, location address, and contact details during initial setup.
- **Dynamic Owner Synchronization**: Adding, editing, or deactivating co-owners automatically synchronizes across all booking forms, filter dropdowns, dashboard metrics, and Marathi PDF bills in real-time.
- **Strict Role Separation**: Superadmin accounts are kept separate from stall owners, ensuring only actual stall owners appear on public booking forms and PDF receipts.
- **Standalone Windows Executable**: Bundled with PyInstaller into a single `GanpatiBookingSystem.exe` binary with embedded static files and web UI, requiring no pre-installed Python or Node.js runtime.

---

## ✨ System Features

### 1. 🤖 AI Business Intelligence & Smart Insights
- **Stall Health Index**: Real-time gauge of stall performance (Excellent, Good, Moderate, Attention Needed) based on live collection velocity.
- **Executive Summary in Marathi**: 2-sentence executive summary of business health, revenue, and collection rates.
- **Strategic Key Takeaways**: Automatic detection of cash vs. UPI trends, top pending debtor alerts, and inventory movement.

### 2. 💬 Multilingual "AI ला विचारा" (Ask AI) Chatbot
- Ask natural language questions in any of the 3 formats:
  - **Minglish (Roman Marathi)**:
    - `aajche ekun sankalan kiti?` ➔ Today's collection, cash/UPI split, and new booking counts.
    - `sarvat jast baki konakade ahe?` / `top pending list dakhva` ➔ Top debtors list with names, statue numbers, phone numbers, and balances.
    - `shiv ne kiti booking kelya?` / `rahul che kiti jama zale?` ➔ Granular metrics for any individual owner.
    - `what should be our planning to collect the pending amount` ➔ Actionable 3-day recovery action plan.
  - **Marathi Devanagari**:
    - `आजचे एकूण संकलन किती आहे?`
    - `रोख आणि UPI चे प्रमाण काय आहे?`
    - `पुढील ३ दिवसांची बाकी वसुली रणनीती काय असावी?`
  - **English**:
    - `What is today's total collection?`
    - `Who has the highest pending balance?`
    - `Show cash collection`

### 3. ⏰ 1-Click WhatsApp Payment Reminders & Daily Reports
- **1-Click WhatsApp Reminders**: Direct WhatsApp button beside top pending debtors that generates personalized payment reminder messages with balance amounts and statue numbers.
- **Daily WhatsApp Report**: 1-click formatted daily summary ready to share with business partners and family on WhatsApp.

### 4. First-Time Setup Wizard
- Automatically detects if the application is unconfigured on first launch.
- Two-step interactive onboarding wizard (`/setup`):
  - **Step 1 — Stall Details**: Stall Name, Stall Number, Location Address, Contact Phone, and Email.
  - **Step 2 — Primary Owner Registration**: Full Name, Username, and Secure Password.
- Automatically generates an active JWT session upon completion and redirects directly to the main booking interface.

### 5. Dynamic Stall Branding
- All UI banners, header titles, location badges, and footer contact cards render dynamically from the database.
- Marathi PDF bills and WhatsApp receipt templates automatically adapt to the configured stall name and contact information.
- Stall details can be updated at any time from **Dashboard → Settings (⚙️ सेटिंग्ज)**.

### 6. Owner & Co-Owner Management
- Co-owners can be added, updated, or deactivated via **Dashboard → Co-Owner Management (👥 सह-मालक व्यवस्थापन)**.
- **Flexible Login Support**: Login using either English username (`shiv`, `rahul`, `admin`) or Marathi display name (`शिव`, `राहुल`, `सुपर अॅडमिन`).
- **Profile & Password Management**: Owners can edit their display names and change/reset passwords directly with password visibility toggle.

### 7. Booking Lifecycle & Validation
- **New Booking (`नवीन बुकिंग`)**:
  - Live duplicate statue number validation (warns if a statue is already reserved).
  - Photo capture via live webcam/mobile camera or image file upload.
  - Auto-calculates advance, remaining balance, and initial status (`BOOKED` or `PAID`).
- **Mark as Paid / Deposit Amount (`बाकी जमा`)**:
  - Search by Booking ID, Mobile Number, Customer Name, or Statue Number.
  - Partial deposit support (caps to remaining balance) and auto-status upgrade to `PAID` when balance reaches ₹0.
- **Cancel Booking (`बुकिंग रद्द`)**:
  - Cancellation reason logging with owner attribution and UTC timestamp.
  - Non-refundable advance retention policy for accounting accuracy.
- **All Bookings & Filters (`सर्व बुकिंग`)**:
  - Multi-field search (Name, Mobile, ID, Statue No).
  - Date-range and dynamic owner filter dropdowns.
  - Instant WhatsApp receipt generator with pre-formatted Marathi greetings and PDF download links.

### 8. Marathi PDF Bill Generation
- Generates high-fidelity festival-themed bills styled in Devanagari typography (`Mangal` / `Noto Sans Devanagari`).
- Includes embedded statue photos, customer info, transaction breakdown, payment mode checkboxes, dynamic owner checkboxes, and shop contact footers.
- Uses Chrome/Edge headless rendering engine for print-quality vector PDFs with automatic `xhtml2pdf` fallback.

### 9. Admin & Analytics Dashboard
- **Revenue Overview**: Total business value, total collections, cash vs. UPI percentage split.
- **Status Counts**: Active reservations, fully settled bookings, and cancellations.
- **Owner Performance Breakdown**: Table tracking booking counts and cash/UPI collections per owner.
- **CSV Data Export**: One-click download of all booking records for Excel/Google Sheets.

---

## 🛠 Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| **AI Intelligence Engine** | Google Gemini Flash + Rule Engine | Natural language Marathi/English/Minglish analytics & strategy |
| **Backend Framework** | FastAPI 0.111.0 | Asynchronous REST API, OpenAPI / Swagger documentation |
| **ORM & Database** | SQLAlchemy 2.0 + SQLite | Relational database persistence with auto-migration |
| **Authentication** | JWT (python-jose) + bcrypt | Secure token-based authentication with password hashing |
| **PDF Generation** | Headless Chrome / xhtml2pdf | High-resolution Marathi PDF bill generation |
| **Frontend Framework** | React 18.3 + Vite 5.4 | Responsive Single Page Application (SPA) |
| **Routing** | React Router DOM v6 | Protected client-side routing & setup guards |
| **HTTP Client** | Axios | REST API communication |
| **Styling & Icons** | CSS3 Variables + FontAwesome 6 | Responsive festival theme (`#d35400` Orange & `#6c3483` Purple) |
| **Packaging** | PyInstaller 6.6 | Standalone Windows `.exe` packaging |

---

## 📁 Project Directory Structure

```
Ganpati Web/
├── 📄 README.md                        ← Project documentation
├── ⚙️ GanpatiBookingSystem.spec         ← PyInstaller build specification
├── 🚀 start.bat                        ← Quick start batch script for Windows
├── 📦 dist/
│   └── GanpatiBookingSystem.exe        ← Standalone production executable
│
├── 🐍 backend/                         ← FastAPI Python Backend
│   ├── requirements.txt                ← Python package dependencies
│   ├── .env                            ← Backend environment configuration
│   ├── run.py                          ← Backend server entrypoint
│   ├── ganpati.db                      ← SQLite database (auto-created)
│   ├── static/
│   │   ├── fonts/                      ← Mangal.ttf Devanagari font
│   │   └── uploads/
│   │       ├── photos/                 ← Statue images directory
│   │       └── pdfs/                   ← Generated PDF bills directory
│   └── app/
│       ├── main.py                     ← FastAPI application setup & routes
│       ├── config.py                   ← Environment settings
│       ├── database.py                 ← SQLAlchemy session setup
│       ├── models/                     ← Database models (Booking, Stall, AdminUser)
│       ├── schemas/                    ← Pydantic request/response schemas
│       ├── auth/                       ← JWT creation & auth dependencies
│       ├── services/                   ← Business logic (ai_analytics, booking, admin, pdf, image)
│       └── routers/                    ← API endpoints (bookings, admin, stalls, setup)
│
└── ⚛️ frontend/                        ← React + Vite SPA Frontend
    ├── package.json                    ← Node.js dependencies
    ├── vite.config.js                  ← Vite proxy & build config
    ├── index.html                      ← Application HTML shell
    └── src/
        ├── App.jsx                     ← Route declarations & guards
        ├── main.jsx                    ← Application mount point
        ├── api/                        ← Axios API service clients
        ├── context/                    ← AuthContext & dynamic stall/owner state
        ├── styles/                     ← CSS stylesheets & theme variables
        ├── components/
        │   ├── shared/                 ← Alert, LoadingSpinner, ConfirmModal
        │   ├── booking/                ← NewBookingForm, MarkPaidTab, CancelTab, AllBookingsTab
        │   └── admin/                  ← AIBusinessPanel, StatsPanel, BookingManager, OwnerManager, StallOwnerSettings
        └── pages/
            ├── FirstTimeSetup.jsx      ← 2-step onboarding wizard
            ├── BookingApp.jsx          ← Main 4-tab booking interface
            ├── OwnerAuth.jsx           ← Owner login & registration portal
            ├── AdminLogin.jsx          ← Admin login portal with quick credentials
            └── AdminDashboard.jsx      ← Analytics & management dashboard
```

---

## 🚀 Installation & Quick Start

### Option A: Run Standalone Executable (.exe)
No Python or Node.js installation is required:
1. Navigate to `dist/GanpatiBookingSystem.exe`.
2. Double-click `GanpatiBookingSystem.exe`.
3. Open your browser and go to `http://localhost:8000`.
4. Complete the first-time setup wizard on initial launch.

---

### Option B: Run from Source Code (Dev Environment)

#### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

#### 2. Backend Setup
```bash
cd "d:\Tesseract\Ganpati Web\backend"

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install Python packages
pip install -r requirements.txt

# Run backend development server
python run.py
```
> Backend starts at `http://localhost:8000` (API documentation at `http://localhost:8000/docs`).

#### 3. Frontend Setup
```bash
cd "d:\Tesseract\Ganpati Web\frontend"

# Install Node modules
npm install

# Start Vite development server
npm run dev
```
> Frontend starts at `http://localhost:5173`.

---

## 🔑 AI Configuration (Google Gemini)

1. Obtain a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open **Owner Dashboard → AI व्यवसाय विश्लेषण** and click **🔑 Gemini Key जोडा**.
3. Paste your key and click **सेव्ह करा व टेस्ट करा**.
4. The system validates the key immediately and activates cloud LLM reasoning with seamless fallback to the local smart engine if offline.

---

## 🔨 Building for Production

### 1. Build Frontend Static Assets
```powershell
cd "d:\Tesseract\Ganpati Web\frontend"
npm run build
```
This compiles optimized assets into `frontend/dist/`.

### 2. Build Standalone Windows Executable
```powershell
cd "d:\Tesseract\Ganpati Web"
python -m PyInstaller --noconfirm GanpatiBookingSystem.spec
```
The resulting executable will be created at `dist/GanpatiBookingSystem.exe`.

---

## 🔑 Default Login Credentials

> 💡 *Default accounts are automatically seeded during startup. You can log in using either the English username or the Marathi display name.*

| Role | Username | Marathi Name | Password | Permissions |
|---|---|---|---|---|
| **Super Admin** | `admin` | `सुपर अॅडमिन` | `admin123` | Full system access, stall settings, co-owner management |
| **Stall Owner** | `shiv` | `शिव` | `shiv123` | Bookings, payment settlements, co-owner management, AI insights |
| **Stall Owner** | `rahul` | `राहुल` | `rahul123` | Bookings, payment settlements, co-owner management, AI insights |
| **Stall Owner** | `harshad` | `हर्षद` | `harshad123` | Bookings, payment settlements, co-owner management, AI insights |

---

## 📡 API Reference

### 1. AI Analytics Endpoints (JWT Protected)
- `GET /api/admin/ai/insights` — Returns executive summary, health index, WhatsApp report, and top pending dues.
- `POST /api/admin/ai/query` — Submits a natural language query in Marathi, English, or Minglish and returns answers.
- `GET /api/admin/ai/status` — Returns Gemini API key connection status.
- `POST /api/admin/ai/api-key` — Validates and persists Gemini API key in `.env`.

### 2. Setup & Public Endpoints
- `GET /api/setup/status` — Returns configuration status and primary stall info.
- `POST /api/setup/init` — Completes first-time onboarding (creates stall and primary owner).
- `GET /api/admin/active-owners` — Returns list of active stall owner names (excludes superadmin).

### 3. Booking Endpoints
- `POST /api/bookings/` — Creates a booking and generates a Marathi PDF bill.
- `GET /api/bookings/` — Returns all bookings ordered by latest ID.
- `GET /api/bookings/search?q={query}` — Searches bookings by ID, mobile number, customer name, or statue number.
- `PATCH /api/bookings/{booking_id}/pay` — Records partial or full payment settlement.
- `PATCH /api/bookings/{booking_id}/cancel` — Cancels a booking with reason logging.

### 4. Admin & Management Endpoints (JWT Protected)
- `POST /api/admin/login` — Authenticates user and returns JWT token.
- `GET /api/admin/me` — Returns current logged-in user profile.
- `GET /api/admin/owners` — Lists all owners and co-owners with statuses.
- `POST /api/admin/owners` — Registers a new co-owner.
- `PUT /api/admin/owners/{id}` — Updates owner display name, role, status, or password.
- `DELETE /api/admin/owners/{id}` — Deactivates an owner account.
- `GET /api/admin/stats` — Computes real-time revenue and owner performance analytics.
- `GET /api/admin/export/csv` — Exports all booking data to CSV format.
- `PUT /api/stalls/{id}` — Updates stall branding and contact details.

---

## 🗄️ Database Schema

### `stalls` Table
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment ID |
| `stall_code` | VARCHAR UNIQUE | Unique stall code (e.g. `STALL-001`) |
| `stall_name` | VARCHAR | Stall name (e.g. `सदिच्छा कला केंद्र`) |
| `stall_number` | VARCHAR | Stall number (e.g. `स्टॉल क्र.१०`) |
| `location_address` | TEXT | Physical address of the stall |
| `contact_phone` | VARCHAR | Contact numbers for PDF bills & WhatsApp |
| `contact_email` | VARCHAR | Contact email address |
| `is_active` | BOOLEAN | Stall active status |

### `bookings` Table
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment ID |
| `booking_id` | VARCHAR UNIQUE INDEX | Formatted ID (e.g. `GB-2026-0001`) |
| `booking_date` | VARCHAR | Date formatted as `dd/MM/yyyy` |
| `customer_name` | VARCHAR | Customer full name |
| `mobile_number` | VARCHAR INDEX | 10-digit mobile number |
| `email_id` | VARCHAR | Customer email address |
| `statue_number` | VARCHAR INDEX | Unique statue identifier |
| `statue_image_url` | VARCHAR | Local image path |
| `total_amount` | FLOAT | Total price in ₹ |
| `advance_amount` | FLOAT | Cumulative advance/deposit received in ₹ |
| `balance_amount` | FLOAT | Pending balance in ₹ |
| `payment_mode` | VARCHAR | Initial payment method (`कॅश`, `UPI`, `ऑनलाईन`) |
| `booked_by_owner` | VARCHAR | Booking owner name |
| `booking_status` | VARCHAR | Status (`BOOKED`, `PAID`, `CANCELLED`) |
| `pdf_bill_url` | VARCHAR | Relative path to Marathi PDF bill |
| `final_payment_date` | VARCHAR | Date of full balance settlement |
| `final_payment_mode` | VARCHAR | Mode of final balance settlement |
| `final_payment_owner` | VARCHAR | Owner who recorded the payment |
| `cancellation_reason` | TEXT | Reason recorded for cancellation |
| `cancellation_owner` | VARCHAR | Owner who cancelled the booking |
| `stall_id` | INTEGER FK | Foreign key linking booking to a stall |

### `admin_users` Table
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment ID |
| `username` | VARCHAR UNIQUE INDEX | Unique login username |
| `hashed_password` | VARCHAR | bcrypt hashed password |
| `display_name` | VARCHAR | Marathi display name |
| `role` | VARCHAR | Role (`superadmin` / `owner`) |
| `is_active` | BOOLEAN | Active/Inactive status flag |
| `stall_id` | INTEGER FK | Foreign key linking user to a stall |

---

## 👨‍💻 Contact & Developer Credits

**Application Developer:**
- **Name**: Avadhut Jagtap
- **Mobile**: +91 8390397800
- **Email**: [avadhutjagtap1341@gmail.com](mailto:avadhutjagtap1341@gmail.com)

---

<div align="center">

**🌺 ॥ श्री गणेशाय नमः ॥ 🌺**  
*Built for Ganpati Festival Stall Operations 2026*

</div>
