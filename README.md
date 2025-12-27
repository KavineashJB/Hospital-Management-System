<div align="center">

# 🏥 𝐂𝐥𝐢𝐧𝐞𝐱𝐚 𝐇𝐌𝐒

### 🚀 𝘛𝘩𝘦 𝘕𝘦𝘹𝘵-𝘎𝘦𝘯 𝘏𝘰𝘴𝘱𝘪𝘵𝘢𝘭 𝘔𝘢𝘯𝘢𝘨𝘦𝘮𝘦𝘯𝘵 𝘚𝘺𝘴𝘵𝘦𝘮

  <p align="center">
    <b>Clinexa</b> is a cloud-based, AI-powered healthcare ecosystem designed to streamline hospital operations. <br />
    From <i>Smart OPD</i> to <i>Pharmacy Inventory</i>, we bridge the gap between patient care and technology.
  </p>

</div>

---

## 📑 **Table of Contents**

- [✨ Key Features](#-key-features)
- [🏗️ System Architecture](#-system-architecture)
- [🔑 Environment Configuration](#-environment-configuration)
- [📂 Project Structure](#-project-structure)

---

## ✨ **Key Features**

### 🩺 **Doctor's Module**

> _Empowering doctors with AI-driven insights._

- **🤖 AI Clinical Assistant**: Integrated OpenAI (GPT-4) for real-time differential diagnosis & treatment suggestions.
- **📄 Smart Summarizer**: Upload past medical records (PDF/DOCX) and get instant, structured clinical summaries via OCR.
- **💊 Digital Prescriptions**: Frictionless e-prescribing with automatic drug interaction checks.

### 🏥 **Patient & OPD Management**

> _Efficient triage and patient flow._

- **📝 Pre-OPD Intake**: Digital triage forms for capturing complaints, allergies, and history _before_ consultation.
- **📊 Vitals Dashboard**: Real-time tracking of vital signs (BP, SpO2, BMI) with **Red Flag Alerts** for abnormalities.
- **🚶 Live Queue System**: Real-time waiting list management for IPD and OPD.

### 💊 **Pharmacy & Inventory**

> _Never run out of essential meds._

- **📦 Stock Tracking**: Real-time inventory levels with low-stock warnings.
- **🧾 Instant Billing**: Integrated POS for prescriptions and OTC sales.
- **🔄 Auto-Fulfillment**: Direct prescription routing from doctor to pharmacist.

### 🔐 **Security & Access**

> _Data privacy first._

- **🛡️ Role-Based Access (RBAC)**: Distinct portals for Doctors, Receptionists, Pharmacists, and Admins.
- **🔒 Secure Backend**: Powered by Firebase Authentication & Firestore Security Rules.

---

## 🏗️ **System Architecture**

| Component        | Technology Used    | Description                                   |
| :--------------- | :----------------- | :-------------------------------------------- |
| **Frontend**     | React + Vite       | Blazing fast UI with HMR.                     |
| **Styling**      | Tailwind CSS       | Utility-first responsive design.              |
| **Backend**      | Firebase           | Serverless Auth, Database, and Hosting.       |
| **AI Engine**    | OpenAI API         | GPT models for clinical decision support.     |
| **Data Parsing** | Tesseract / PDF.js | OCR and text extraction from medical reports. |

---

## 📂 **Project Structure**

```text
src/
├── 📂 components/
│   ├── 🔐 auth/            # Login, Signup, Protected Routes
│   ├── 🩺 doctor/          # AI Assist, Consultation, Diagnosis
│   ├── 🏥 vitals/          # Pre-OPD Intake, Vitals Assessment
│   ├── 💊 pharmacy/        # Inventory, Billing, Prescription Fulfillment
│   ├── 🧪 LabModule/       # Lab Test Queue & Management
│   ├── 📝 registration/    # Patient Registration & Package Management
│   ├── 👥 queue/           # Patient Queue (OPD & IPD)
│   ├── 💼 Staff/           # Staff Dashboard
│   ├── 💁 Receptionist/    # Receptionist Dashboard
│   ├── 🛌 IP/              # In-Patient Management
│   ├── 👤 Patients/        # Patient Dashboard
│   ├── 💳 billing/         # General Billing Module
│   ├── 🖥️ layout/          # Sidebar, Header, Main Layout
│   └── 🧩 ui/              # Reusable UI Components & Form Elements
├── 📂 contexts/            # Global State (Auth, Prescription)
├── 📂 data/                # Mock Data & Static Constants
├── 📂 pages/               # Admin Configuration & Pages
├── 📂 types/               # TypeScript Type Definitions
├── 📜 App.tsx              # Main Application Routing
├── 📜 firebase.ts          # Firebase Initialization
└── 📜 main.tsx             # Entry Point
```
