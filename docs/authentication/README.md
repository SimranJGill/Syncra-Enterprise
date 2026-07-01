# Feature Documentation: Enterprise WFM Authentication System

Welcome to the **Authentication Module** of the **Enterprise Workforce Management (WFM) Platform with AI Operations Assistant**. This document serves as a comprehensive onboarding guide for developers and new team members to understand the purpose, layout, and components of the system.

---

## 1. Purpose and Functionality

The Authentication system provides a secure, role-based entry point for all users of the Enterprise Workforce Management Platform. It is designed to register new users, verify returning users, manage active sessions, and redirect them to their respective operational dashboards.

### Core Features:
1. **Security-First Signup**: Full validations on Name, Email, Password, and Organization.
2. **Access Control Tokens**: Prevents unauthorized registrations. To sign up as an **Admin** or **Super Admin**, users must input a security access code:
   * **Admin Access Code**: `ADMIN2026`
   * **Super Admin Access Code**: `SUPER2026`
3. **Session Persistence**: Implements stateless authentication via JSON Web Tokens (JWT) saved locally in the browser to maintain session state.
4. **Vibrant Pastel Aesthetics**: Styled with a high-fidelity **Yellow and Red Pastel** design system that provides a warm, clean, and premium user experience (glassmorphic containers, floating label animations, and micro-hover states).

---

## 2. System Submodules

The feature is split into two distinct submodules:

### A. Frontend Submodule (`/frontend/src/`)
* **`index.css`**: Defines all global variables (colors, fonts, shadow tokens), dynamic radial mesh backgrounds, and custom card/form-input animations.
* **`App.jsx`**: Handles overall workspace state, checks session token validity on mount, and manages routing between the Login, Registration, and Dashboard views.
* **`components/Login.jsx`**: Custom form that handles credentials input, input validations, error message shaking, and token storage.
* **`components/Register.jsx`**: Handles sign-up validation, dynamic access code input fields, and role-based sign-up filters.
* **`components/Dashboard.jsx`**: Multi-tenant operational view showcasing modules specific to the user's role (Employee, Admin, Super Admin).

### B. Backend Submodule (`/backend/`)
* **`server.js`**: Mounts CORS settings, Express middleware, status checks, and handles the startup of the backend process.
* **`database.js`**: Connects to the SQLite database and executes database tables and CRUD wrappers.
* **`routes/auth.js`**: Contains API routes for `POST /register`, `POST /login`, and `GET /me`.
* **`middleware/auth.js`**: Middleware that decrypts JWT tokens and implements role checks.

---

## 3. UI Wireframe Layout

Here is a visual schematic of the core user interface screens:

### Wireframe 1: Login Screen (`Login.jsx`)
```
+-----------------------------------------------------------+
|                      EnterpriseWFM                        |
|             AI Operations Assistant Login                 |
|                                                           |
|  [ Email Address ]  <------------------ Floating Label    |
|  [ Password      ]  <------------------ Floating Label    |
|                                                           |
|  +-----------------------------------------------------+  |
|  |                     SIGN IN                         |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  Don't have an account? Create new account                |
+-----------------------------------------------------------+
```

### Wireframe 2: Registration Screen (`Register.jsx`)
```
+-----------------------------------------------------------+
|                      EnterpriseWFM                        |
|               Create your WFM Account                     |
|                                                           |
|  [ Full Name          ]                                   |
|  [ Email Address      ]                                   |
|  [ Password          ]                                   |
|  [ Organization Name  ]                                   |
|  [ Workspace Role  v ]  <-------------- Options dropdown   |
|                                                           |
|  *Conditional Security Access Banner*                     |
|  "Demo access code required: ADMIN2026 / SUPER2026"       |
|  [ Security Access Code ] <------------ Shown if Admin    |
|                                                           |
|  +-----------------------------------------------------+  |
|  |                  CREATE ACCOUNT                     |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  Already have an account? Sign in                         |
+-----------------------------------------------------------+
```

### Wireframe 3: Role-Based Dashboard Screen (`Dashboard.jsx`)
```
+-----------------------------------------------------------+
|  EnterpriseWFM                      [ROLE BADGE] Logout   |
|  Welcome back, Jane Doe!                                  |
|  🏢 Acme Corp | ✉ jane@acme.com                           |
|                                                           |
|  Active Operations Modules                                |
|  +------------------------+  +------------------------+   |
|  |  Module 1 (e.g. Shift) |  |  Module 2 (e.g. Leave) |   |
|  |  Detail description    |  |  Detail description    |   |
|  +------------------------+  +------------------------+   |
|  +------------------------+  +------------------------+   |
|  |  Module 3 (e.g. AI)    |  |  Module 4 (e.g. Audit) |   |
|  |  Detail description    |  |  Detail description    |   |
|  +------------------------+  +------------------------+   |
|                                                           |
|  💬 WFM AI Assistant Panel                                 |
|  [ Type a request here...                           ] Send |
+-----------------------------------------------------------+
```
