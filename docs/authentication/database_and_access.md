# Database Interaction & Access Control Matrix

This document provides details on the database tables, SQL queries, and the Role-Based Access Control (RBAC) rules enforced in the application.

---

## 1. Database Schema

The Authentication module uses a single SQLite table named `users` to store profile and credential details.

### Table: `users`
* **Storage Location**: `backend/database.sqlite` (created automatically upon backend startup)
* **SQL Create Script**:
  ```sql
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL, -- 'Employee', 'Admin', 'Super Admin'
    organization TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  ```

### Field Specifications:
| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Internal unique identifier for the user. |
| `name` | TEXT | NOT NULL | The user's full name. |
| `email` | TEXT | NOT NULL, UNIQUE | User login email (stored in lower-case format). |
| `password_hash` | TEXT | NOT NULL | Salted bcrypt hash of the user's password. |
| `role` | TEXT | NOT NULL | Authorization level (`Employee`, `Admin`, `Super Admin`). |
| `organization` | TEXT | NOT NULL | Name of the tenant organization. |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp when the user signed up. |

---

## 2. Database SQL Interactions

Below are the primary SQL statements executed by the Express server routes:

### A. Check for existing email (during signup)
* **Query**: `SELECT id FROM users WHERE email = ?`
* **Parameters**: `[email.toLowerCase()]`

### B. Insert new user record (during signup)
* **Query**: `INSERT INTO users (name, email, password_hash, role, organization) VALUES (?, ?, ?, ?, ?)`
* **Parameters**: `[name, email.toLowerCase(), passwordHash, role, organization]`

### C. Find user record (during login)
* **Query**: `SELECT * FROM users WHERE email = ?`
* **Parameters**: `[email.toLowerCase()]`

---

## 3. Access Control Matrix (RBAC)

The application enforces strict Role-Based Access Control (RBAC) to ensure that users can only access endpoints and submodules appropriate for their role.

### Authorization Level Matrix:
| Feature / Submodule | Employee | Admin (Manager/HR) | Super Admin (System Owner) | Enforced Layer |
| :--- | :---: | :---: | :---: | :--- |
| **Shift Calendar (view own)** | ✓ | ✓ | ✓ | Frontend App / Backend API |
| **Apply for Leave (submit)** | ✓ | ✓ | ✓ | Frontend App / Backend API |
| **AI Assistant Panel** | ✓ | ✓ | ✓ | Frontend App |
| **Manage Staff Scheduling** | ❌ | ✓ | ✓ | Frontend App / API (Role Check) |
| **Approve Leave Applications** | ❌ | ✓ | ✓ | Frontend App / API (Role Check) |
| **Workforce Analytics Dashboard**| ❌ | ✓ | ✓ | Frontend App / API (Role Check) |
| **Edit Tenant Settings** | ❌ | ❌ | ✓ | Frontend App / API (Role Check) |
| **Manage All Users (Audit)** | ❌ | ❌ | ✓ | Frontend App / API (Role Check) |
| **API Keys & Integrations** | ❌ | ❌ | ✓ | Frontend App / API (Role Check) |

### Backend Role Checks (Example):
For endpoints that modify system schedules, the backend route registers the `requireRole` middleware:
```javascript
// Example Endpoint route
router.post('/api/schedule/publish', authenticateToken, requireRole(['Admin', 'Super Admin']), (req, res) => {
  // Only Admin or Super Admin user details can reach here
});
```

---

## 4. Security Enforcements

### A. Password Cryptography
* **Hashing Library**: `bcryptjs`
* **Salt Rounds**: `10`
* **Process**: Raw passwords are never stored in the database. When registering, a unique salt is combined with the raw password, which is then hashed. During login, `bcrypt.compare()` compares the input password against the stored hash.

### B. JWT Token Specifications
* **Secret Key**: `WFM_SECRET_KEY_2026`
* **Expiration Time**: `24 hours`
* **Token Payload Data**:
  ```json
  {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@acme.com",
    "role": "Admin",
    "organization": "Acme Corp",
    "iat": 1680000000,
    "exp": 1680086400
  }
  ```
