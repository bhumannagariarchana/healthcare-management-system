# CarePulse - Full-Stack Healthcare Management System

A secure, responsive, and role-scoped Full-Stack Healthcare Management System built using **React** for the frontend and **Python FastAPI** for the backend, backed by **PostgreSQL/SQLite** databases.

This repository is structured as a production-grade demonstration for SDE Internship and entry-level software engineering portfolios, highlighting REST API design, relational schema constraints, stateless JWT authentication, and concurrency conflict resolution.

---

## 🚀 Key Features

*   **Role-Based Access Control (RBAC)**: Segregated layouts and endpoints for **Admins**, **Receptionists**, **Doctors**, and **Patients**.
*   **Secure Authentication**: Passwords hashed using `bcrypt`, stateless session validation via SHA256 cryptographically signed JSON Web Tokens (JWT).
*   **Dynamic Scheduler**: Receptionists can schedule patient appointments. Includes conflict validation preventing overlapping doctor bookings.
*   **Consultation & Prescriptions Console**: Doctors view daily schedules and issue prescriptions. Submitting a prescription automatically completes the corresponding appointment.
*   **Patient EHR Portal**: Patients can log in to view their consultation history and print out signed prescription slips.
*   **Database Portability**: The database engine automatically attempts to connect to PostgreSQL. If unavailable, it dynamically falls back to a local SQLite database, ensuring immediate out-of-the-box execution.

---

## 🛠️ Tech Stack

### Frontend
*   **React.js (Vite)**
*   **React Router Dom (v6)** (Guarded routes via ProtectedRoute)
*   **Axios** (With JWT request/response interceptors)
*   **Lucide-React** (SVG icons)
*   **CSS3** (Glassmorphism design tokens)

### Backend
*   **Python 3.10+**
*   **FastAPI** (Asynchronous execution & Swagger/OpenAPI docs)
*   **SQLAlchemy ORM (v2.0)**
*   **Passlib (Bcrypt)** & **PyJWT**

### Database & Testing
*   **PostgreSQL** (Primary) / **SQLite** (Fallback)
*   **Pytest** (Backend integration suite)
*   **Postman** (Pre-configured collection with automatic JWT token bindings)

---

## 📐 System Architecture

```
                       +-----------------------------+
                       |       React Frontend        |
                       |       (Local: 5173)         |
                       +-----------------------------+
                                      |
                                      | HTTP REST / JSON
                                      v
                       +-----------------------------+
                       |       FastAPI Backend       |
                       |       (Local: 8000)         |
                       +-----------------------------+
                                      |
                                      | SQLAlchemy ORM
                                      v
                       +-----------------------------+
                       |  PostgreSQL / SQLite DB     |
                       +-----------------------------+
```

---

## 🔑 Seeded Login Accounts (Out-of-the-box)

The database is pre-seeded with the following test credentials:

| Role | Username / Email | Password | Scope |
|---|---|---|---|
| **Admin** | `admin@healthcare.com` | `AdminPassword123` | Add doctors, manage receptionists, view dashboard stats |
| **Receptionist** | `receptionist@healthcare.com` | `ReceptionistPassword123` | Register patients, book/cancel appointments |
| **Doctor** | `doctor@healthcare.com` | `DoctorPassword123` | View schedule, consult, issue prescriptions |
| **Patient** | `patient@healthcare.com` | `PatientPassword123` | View history and print prescription slips |

---

## 💻 Installation & Setup

Clone this repository and follow the instructions below:

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install httpx email-validator bcrypt==4.0.1
   ```
4. Copy the environment variables template and configure it if needed (defaults work out-of-the-box):
   ```bash
   cp .env.example .env
   ```
5. Start the backend Uvicorn server:
   ```bash
   uvicorn app.main:app --port 8000 --reload
   ```
*Access Swagger API documentation at: [http://localhost:8000/docs](http://localhost:8000/docs)*

### 2. Frontend Setup
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev -- --port 5173
   ```
*Access the React app interface at: [http://localhost:5173](http://localhost:5173)*

---

## 🧪 Testing

### Backend Integration Tests
We have built an integration test suite validating logins, user registers, available slots, and double-booking conflict protections. To run them:
```bash
cd backend
source venv/bin/activate
PYTHONPATH=. pytest app/test_main.py
```

### Postman API Testing
Import the [`healthcare_management_system.postman_collection.json`](./healthcare_management_system.postman_collection.json) file into Postman. It includes pre-configured parameters and automated scripts that extract the JWT token on login and bind it for subsequent calls automatically.

---

## 📁 Repository Structure

```
healthcare-management-system/
├── backend/
│   ├── app/
│   │   ├── main.py              # Entrypoint & CORS setup
│   │   ├── config.py            # Pydantic Settings loader
│   │   ├── database.py          # SQLAlchemy engine & SQLite fallback logic
│   │   ├── auth.py              # JWT token controls & role dependency guards
│   │   ├── models/              # SQLAlchemy database mapping classes
│   │   ├── routers/             # Endpoint controllers (auth, patients, scheduling...)
│   │   └── utils/seeder.py      # Database seeding scripts
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/MainLayout.jsx
│   │   ├── pages/               # Screens (Dashboards, Logins, CRUDs...)
│   │   ├── services/            # Axios endpoints connectors
│   │   ├── App.jsx              # Routes & guards
│   │   └── index.css            # Custom design tokens
│   └── package.json
├── healthcare_system_interview_guide.md # Interview Prep Handbook
└── healthcare_management_system.postman_collection.json # API Postman Collection
```
