# CarePulse Healthcare Management System (HMS)
## Technical Report, Relational Schema & SDE Interview Prep Manual

This documentation serves as a comprehensive reference guide for the technical architecture, database schemas, security flows, key engineering implementations, limitations, scalability strategies, and SDE interview questions for the CarePulse Healthcare Management System.

---

## 1. Executive Summary & Project Goal

The **CarePulse Healthcare Management System (HMS)** is a secure, responsive, full-stack application designed to coordinate clinic-wide workflows, schedule patient consultations, and log electronic medical records.

### Project Goals
*   **Demonstrate Full-Stack Competency**: Integrate a React SPA with a Python FastAPI REST API.
*   **Production-Grade Relational Schema**: Enforce strict data integrity with foreign keys, index structures, and cascade conditions.
*   **State-Isolated Access Control**: Implement JSON Web Token (JWT) credentials alongside role-based access controls (RBAC) at the API and UI levels.
*   **Schedule Conflict Resolution**: Write atomic scheduling checks to prevent concurrent doctor double-bookings.
*   **Recruiter Portability**: Design dynamic fallback mechanisms (PostgreSQL to local SQLite) ensuring the application executes immediately in any evaluator environment.

---

## 2. Tech Stack Architecture

The system uses a decoupled **Client-Server Architecture** to isolate state management and data control layers.

```
+-------------------------------------------------------------+
|                       FRONTEND (React)                      |
|  - Vite, React Router, Axios Client, Vanilla CSS3, Lucide   |
+-------------------------------------------------------------+
                               |
                               | HTTP Requests (REST / JSON)
                               v
+-------------------------------------------------------------+
|                      BACKEND (FastAPI)                      |
|  - Uvicorn Server, Pydantic Schemas, SQLAlchemy ORM         |
+-------------------------------------------------------------+
                               |
                               | Database Dialect Queries
                               v
+-------------------------------------------------------------+
|                     DATABASE ENGINE                         |
|  - PostgreSQL (Primary) / SQLite (Dynamic Local Fallback)   |
+-------------------------------------------------------------+
```

### 2.1 Frontend Module (React)
*   **Vite**: The bundle server enabling fast compile loops and hot-module replacement.
*   **React Router Dom (v6)**: Manages URL routes and wraps views inside a protective `<ProtectedRoute>` route guard component.
*   **Axios Client**: Configured with request interceptors to automatically fetch the token from `localStorage` and inject it as a `Bearer` header. Response interceptors handle `401 Unauthorized` states by flushing credentials and returning users to `/login`.
*   **Vanilla CSS3**: Formulates the aesthetic system using CSS custom properties (variables), styling tables, buttons, sidebar navigation panels, cards, and transitions.

### 2.2 Backend Module (FastAPI)
*   **FastAPI**: Serves endpoints asynchronously (`async/await`) and auto-generates OpenAPI (`openapi.json`) schemas.
*   **SQLAlchemy (v2.0)**: Coordinates DB connections, parses raw schemas into model objects, and runs SQL transactions.
*   **PyJWT**: Generates and decodes SHA256 cryptographically signed JSON Web Tokens.
*   **Passlib (Bcrypt)**: Hashes and saltes user passwords, protecting credentials at rest.

---

## 3. Database Relational Schema Design

Enforces normalization, indexing, and cascade behaviors using 5 key tables:

```
                  +-------------------+
                  |       users       |
                  +-------------------+
                  | id (PK)           |
                  | username (Unique) |
                  | password_hash     |
                  | role              |
                  +-------------------+
                       /         \
          (1:1 Cascade)           (1:1 Cascade)
                     /             \
       +------------------+   +-------------------+
       |     doctors      |   |     patients      |
       +------------------+   +-------------------+
       | id (PK)          |   | id (PK)           |
       | user_id (FK)     |   | user_id (FK)      |
       | full_name        |   | full_name         |
       | department       |   | age / gender      |
       | available_slots  |   | phone / email     |
       +------------------+   +-------------------+
             \                       /
              \                     /
        (1:N Cascade)         (1:N Cascade)
                \                 /
             +-----------------------+
             |     appointments      |
             +-----------------------+
             | id (PK)               |
             | patient_id (FK)       |
             | doctor_id (FK)        |
             | date / time           |
             | status                |
             +-----------------------+
                         |
                   (1:1 Cascade)
                         |
             +-----------------------+
             |     prescriptions     |
             +-----------------------+
             | id (PK)               |
             | patient_id (FK)       |
             | doctor_id (FK)        |
             | appointment_id (FK)   |
             | medicine / dosage     |
             | duration / notes      |
             +-----------------------+
```

### 3.1 `users` Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_username ON users(username);
```

### 3.2 `doctors` Table
```sql
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    experience INTEGER NOT NULL,
    available_slots JSON NOT NULL, -- list of time slots e.g. ["09:00", "10:00"]
    email VARCHAR(150) UNIQUE NOT NULL
);
```

### 3.3 `patients` Table
```sql
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(50) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL
);
```

### 3.4 `appointments` Table
```sql
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL -- 'Booked', 'Completed', 'Cancelled'
);
```

### 3.5 `prescriptions` Table
```sql
CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    doctor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. REST API Documentation & Endpoints

| Category | Endpoint | Method | Scope Roles | Description |
|---|---|---|---|---|
| **Auth** | `/register` | POST | Public | Self-registration (Creates User + Patient profile) |
| **Auth** | `/login` | POST | Public | Authenticates credentials, issues JWT token |
| **Auth** | `/logout` | POST | All | Session termination |
| **Auth** | `/me` | GET | All | Returns active user profile |
| **Patients** | `/patients` | GET | Admin, Recep, Doc | List and search patient directories |
| **Patients** | `/patients/{id}` | GET | Scoped | Get profile details (self or staff) |
| **Patients** | `/patients` | POST | Recep, Admin | Registrants entry (Creates User + Patient) |
| **Patients** | `/patients/{id}` | PUT | Scoped | Updates patient details and user password |
| **Patients** | `/patients/{id}` | DELETE | Admin, Recep | Deletes user credentials and patient card |
| **Doctors** | `/doctors` | GET | All | Lists active doctors and time shifts |
| **Doctors** | `/doctors` | POST | Admin | Registers doctor credentials and profile |
| **Doctors** | `/doctors/{id}` | PUT | Admin | Edits doctor details and available slots |
| **Doctors** | `/doctors/{id}` | DELETE | Admin | Removes doctor profile and login account |
| **Appts** | `/appointments` | GET | Scoped | List appointments (filtered by user role) |
| **Appts** | `/appointments` | POST | Recep, Admin | Book slot. Triggers double-booking checks |
| **Appts** | `/appointments/{id}`| PUT | Staff, Doc | Reschedule date/time or update status |
| **Appts** | `/appointments/{id}`| DELETE | Scoped | Cancel appointment (marks 'Cancelled') |
| **Rx** | `/prescriptions` | POST | Doctor | Issue medication. Auto-completes appointment |
| **Rx** | `/prescriptions/{id}`| GET | Scoped | Lists patient prescriptions |
| **Dashboard**| `/dashboard/stats` | GET | All | Custom role-specific dashboard metrics |

---

## 5. Security & Access Control Mechanics

### 5.1 Password Hashing & Salts
*   Passwords are never stored in plain text.
*   **Bcrypt** uses a salt-strengthened hashing routine with a work factor. It is computationally expensive, neutralizing brute-force and rainbow table attacks.

### 5.2 JSON Web Tokens (JWT)
*   **Stateless**: The server does not store active sessions. All metadata resides in the signed payload.
*   **Verification**: When a user logs in, the server generates a token containing:
    ```json
    {
      "sub": "username@healthcare.com",
      "role": "Doctor",
      "exp": 1785984000
    }
    ```
    This payload is hashed using **HMAC-SHA256** and a server-side secret key, creating a signature. If an attacker modifies the role in the payload, the signature becomes invalid and access is rejected.

### 5.3 Double-Booking Prevention Logic
```python
# Check for existing bookings
conflict = db.query(Appointment).filter(
    Appointment.doctor_id == payload.doctor_id,
    Appointment.date == payload.date,
    Appointment.time == payload.time,
    Appointment.status == "Booked"
).first()

if conflict:
    raise HTTPException(
        status_code=400,
        detail="Doctor is already booked for this date and time slot."
    )
```

### 5.4 Automatic Appointment Completion
```python
# Create the prescription record
prescription = Prescription(...)
db.add(prescription)

# Auto-complete the corresponding appointment
if payload.appointment_id:
    appt = db.query(Appointment).filter(Appointment.id == payload.appointment_id).first()
    if appt:
        appt.status = "Completed"
        db.add(appt)

db.commit()
```

### 5.5 Portability Fallback Connection Engine
```python
db_url = settings.DATABASE_URL
engine = None

if db_url.startswith("postgresql"):
    try:
        # Try connecting to PostgreSQL with a 3-second timeout
        temp_engine = create_engine(db_url, connect_args={"connect_timeout": 3})
        with temp_engine.connect() as conn:
            pass
        engine = temp_engine
    except Exception as e:
        # Fallback to local SQLite database if connection fails
        db_url = "sqlite:///./healthcare.db"

if engine is None:
    connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
    engine = create_engine(db_url, connect_args=connect_args)
```

---

## 6. SDE Portfolio Interview Q&A Cheatsheet

### Q1: How did you implement double-booking validation?
> **Answer**: Double-booking validation is handled on the backend in the appointments router. Before saving a booking request, we query the DB to check if the doctor has any active appointments (`status == 'Booked'`) on the same date and time. If a match is found, we raise an HTTP 400 Bad Request. For rescheduling, we run the same query but exclude the current appointment ID (`Appointment.id != current_id`) to allow updates without self-conflict.

### Q2: Why did you choose JWT instead of Session Cookies?
> **Answer**: JWT is stateless and scales better in modern architectures. By signing user metadata (username, role) inside the token, the backend does not need to store session states in a database or cache (like Redis). The client stores the token in `localStorage` and attaches it to request headers. The backend decodes and validates the signature using the SHA256 secret key, verifying authentication statelessly. This approach makes horizontal scaling across multiple server instances much simpler.

### Q3: How does your database fallback mechanism function?
> **Answer**: To ensure high portability and ease of evaluation for recruiters, the backend database engine in `database.py` connects dynamically. It tries to establish a connection with the PostgreSQL server using the URL from the environment variables (with a 3-second timeout). If the connection fails (e.g. PostgreSQL is not installed or running locally), it catches the exception, logs a warning, and falls back to a local SQLite database file (`sqlite:///./healthcare.db`). The system automatically runs SQLAlchemy schema migrations on the active database engine to create tables, followed by database seeding.

### Q4: How does issuing a prescription affect appointment statuses?
> **Answer**: I integrated the prescription and appointment flows. When a doctor writes a prescription post-consultation, they provide the patient_id, doctor_id, and appointment_id. When the API handler receives this request, it inserts the prescription record and updates the status of the corresponding appointment to 'Completed' in the same database transaction. This automates the clinical workflow and updates receptionist dashboards immediately.

---

## 7. Limitations, Scalability Challenges & Future Work

### 7.1 System Limitations
1.  **Stateless JWT Revocation**: Because JWTs are stateless, once issued, they remain valid until they expire. If a user logs out, the frontend deletes the token, but if the token was intercepted, it could theoretically still access endpoints. Implementing a Redis-based blacklist database would solve this.
2.  **Local File System SQLite Fallback**: While convenient for portfolio runs, SQLite doesn't support concurrent writes at scale, causing database locking issues in high-traffic applications. Production must enforce PostgreSQL.
3.  **Lack of Real-Time Updates**: The frontend dashboard counts and lists rely on page reloads or API polling. It lacks push notifications.

### 7.2 Scalability Challenges
1.  **Database Read-Write Bottlenecks**: In a real clinic, doctor/patient directory reads are high, while appointment writes are frequent. To scale, we must implement database replication (Primary writes, Replica reads) with SQLAlchemy routing.
2.  **Scheduling Overlaps under High Concurrency**: If two receptionists click 'Confirm' on the same slot at the exact same millisecond, a race condition could bypass the Python conflict check. We would need to enforce database transaction isolation levels (Serializable) or use Redis distributed locks (Redlock) for time slots.
3.  **Monolith Splits**: To support millions of queries, the modules (Auth, Doctor scheduling, Patients EHR records, Billing) should be split into microservices, communicating via message queues like RabbitMQ or Kafka.

### 7.3 Future Work & Enhancements
1.  **HL7 FHIR Protocol Integration**: Align patient EHR cards with HL7 FHIR (Fast Healthcare Interoperability Resources) medical standards to support data exchanges with hospitals.
2.  **WebSockets Real-Time Queues**: Implement WebSocket connections so receptionists see patient check-ins and doctors see live queue updates immediately.
3.  **Video Consultation**: Integrate WebRTC (e.g., Twilio or Zoom API) directly into the Doctor and Patient portals for remote telehealth appointments.
4.  **Push Reminders**: Connect SendGrid and Twilio SMS APIs to send automated email/SMS reminders to patients 24 hours before their appointments, reducing clinic no-shows.
