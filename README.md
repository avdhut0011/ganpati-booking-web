# 🌺 गणपती बाप्पा मूर्ती बुकिंग व व्यवस्थापन प्रणाली
### Ganpati Bappa Statue Booking & Multi-Stall SaaS Platform

A production-grade, enterprise-ready Web & Cloud platform designed specifically for Ganpati festival sculptors, statue artisans, and multi-stall booking centers. Built with **FastAPI**, **React 18 + Vite**, **PostgreSQL**, and powered by **Google Gemini 1.5 Flash AI**.

---

## 🌟 Key Features & Capabilities

### 🎪 1. Multi-Stall & Multi-Tenant SaaS Architecture
- **Super Admin Workspace:** Onboard unlimited artisan stalls, branches, and workshop centers with independent addresses, branding, and contact details.
- **Stall Admin & Co-Owner Management:** Assign unique staff and partners (उदा. *शिव, राहुल, हर्षद*) per stall.
- **Data Isolation:** Complete database separation ensures each stall only accesses its own reservations and collection metrics.

### 📝 2. High-Speed Counter Booking & Financial Settlement
- **3-Step Streamlined Form:** Customer information, statue details with camera photo dropzone, and live balance calculator.
- **Duplicate Statue Prevention:** Instant atomic validation prevents double-booking the same statue number.
- **Smart Payment Settlement:** Partial advance tracking, one-click settlement to ₹0 balance, and audit trails.
- **Cancellation Protection:** Track cancellation reasons and timestamps with a strict no-refund calculation policy.

### 📄 3. Dynamic Devanagari Vector PDF Receipts
- **Branded Festival Invoices:** Automatically renders each stall's Marathi name, stall number, workshop address, and phone numbers.
- **Visual Bill Preview:** Includes statue photograph, amount breakdown, payment mode checkboxes, and artisan stamp.
- **Direct WhatsApp Sharing:** 1-click share button to send customized PDF receipts directly to customer WhatsApp numbers.

### 🤖 4. Multilingual AI Copilot (AI ला विचारा)
- **Powered by Gemini 1.5 Flash:** Understands Marathi Devanagari, Minglish (*"aajche ekun sankalan kiti?"*), and English.
- **Financial Health Score Gauge:** Real-time collection efficiency score (0–100) with performance insights.
- **Automated Debt Recovery Action Plan:** Generates prioritized 3-day recovery strategies and customer reminder links.
- **Offline Math Fallback:** Local aggregation fallback ensures 100% uptime even if external AI quotas are exceeded.

### 🎨 5. Handcrafted Marathi UI/UX Design System
- **Artisan Color Palette:** Artisan Saffron (`#C84B19`), Deep Royal Plum (`#3B1845`), and Temple Gold (`#D4881A`).
- **Devanagari Typography:** Optimized with `Noto Sans Devanagari` and `Plus Jakarta Sans` for numeric amounts.
- **Pristine Layout:** Zero raw markdown asterisks, beautiful badges, interactive radio tiles, and high-density data tables.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Clients ["Client Layer (Responsive SPA)"]
        Desk["Billing Counter (Desktop / Tablet)"]
        Mobile["Mobile Web App (Artisans / Owners)"]
    end

    subgraph SecurityGateway ["Security & Reverse Proxy"]
        Nginx["Nginx / CloudFront CDN<br>HTTPS / SSL Termination"]
    end

    subgraph BackendApp ["FastAPI Backend Engine (Port 8000)"]
        API["FastAPI REST Routers (/api/*)"]
        Auth["JWT (HS256) + Bcrypt Auth Layer"]
        AI["Gemini 1.5 Flash AI Engine"]
        PDF["Headless Chromium Vector PDF Generator"]
    end

    subgraph StorageLayer ["Database & Cloud Assets"]
        PG[("PostgreSQL 16 Database<br>(or SQLite for local dev)")]
        S3[("AWS S3 / Static Storage<br>(Statue Photos & PDF Bills)")]
    end

    Desk --> SecurityGateway
    Mobile --> SecurityGateway
    SecurityGateway --> API
    API --> Auth
    API --> AI
    API --> PDF
    API --> PG
    PDF --> S3
```

---

## 🛠️ Tech Stack

| Component | Technologies Used |
|---|---|
| **Frontend SPA** | React 18, Vite 5, React Router v6, Axios, FontAwesome 6.5 |
| **Backend API** | Python 3.11, FastAPI, Uvicorn (ASGI), Pydantic v2 |
| **Database & ORM** | PostgreSQL 16 (Production) / SQLite, SQLAlchemy 2.0 |
| **Authentication** | OAuth2 Bearer, Stateless JWT (HS256), Passlib (Bcrypt) |
| **AI Intelligence** | Google Gemini 1.5 Flash API (`google-generativeai`) |
| **PDF Generation** | Headless Chromium & WeasyPrint with Devanagari Fonts |
| **Deployment & Cloud**| Docker, Docker Compose, AWS EC2, AWS S3, AWS CloudFront |

---

## 🚀 Quick Start Guide (Local Development)

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL 16 (or local SQLite)

### 2. Clone Repository
```bash
git clone git@github.com:avdhut0011/ganpati-booking-web.git
cd ganpati-booking-web
```

### 3. Backend Setup
```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
venv\Scripts\activate  # Windows (or source venv/bin/activate on Linux)

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.production.example .env
```

Edit `backend/.env`:
```ini
DATABASE_URL=postgresql://postgres:root@localhost:5432/ganpatidb
JWT_SECRET=your-random-jwt-secret-key-2026
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
```

Start the backend server:
```bash
python run.py
# API is live at http://127.0.0.1:8000
```

### 4. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
# Frontend is live at http://localhost:5173
```

---

## 🔑 Default Login Credentials

| Role | Username | Password | Display Name |
|---|---|---|---|
| **Super Admin (Platform Provider)** | `admin` | `admin123` | सुपर अॅडमिन |
| **Co-Owner 1** | `shiv` (or `शिव`) | `shiv123` | शिव |
| **Co-Owner 2** | `rahul` (or `राहुल`) | `rahul123` | राहुल |
| **Co-Owner 3** | `harshad` (or `हर्षद`) | `harshad123` | हर्षद |

---

## ☁️ AWS Free Tier Deployment (₹0 Cost)

This application is ready for 1-click deployment on the **AWS Free Tier**:

1. **Backend (AWS EC2):** Run on `t3.micro` Ubuntu 22.04 (**750 hours/month Free**).
2. **Frontend (AWS S3 + CloudFront):** Host static build on S3 with global CDN (**1 TB/month transfer Free**).
3. **Photos & PDF Bills (AWS S3):** Set `USE_CLOUD_STORAGE=true` for direct cloud uploads (**5 GB Storage Free**).

Complete step-by-step AWS guide is documented in [`AWS_DEPLOYMENT_GUIDE.md`](./AWS_DEPLOYMENT_GUIDE.md).

---

## 🧪 Master Automated QA Test Suite

To run the complete automated test suite verifying all 7 modules:

```bash
python scripts/test_master_suite.py
```

### Verified Test Modules:
- [x] **Test 1:** Database & Multi-Stall Branding Isolation
- [x] **Test 2:** Multi-Language Owner Authentication (`admin`, `shiv`, `शिव`, `rahul`, `राहुल`)
- [x] **Test 3:** New Booking & Financial Calculation Engine
- [x] **Test 4:** Atomic Duplicate Statue Prevention
- [x] **Test 5:** Payment Settlement & Status Transitions
- [x] **Test 6:** AI Business Intelligence & Health Scoring
- [x] **Test 7:** Multilingual AI Chatbot (Marathi, English, Minglish)

---

## 👨‍💻 Developer & Support

- **Lead Developer:** Avadhut Jagtap
- **Contact:** 📞 8390397800 | ✉️ avadhutjagtap1341@gmail.com
- **Repository:** [https://github.com/avdhut0011/ganpati-booking-web](https://github.com/avdhut0011/ganpati-booking-web)

*॥ गणपती बाप्पा मोरया, मंगलमूर्ती मोरया ॥* 🌺
