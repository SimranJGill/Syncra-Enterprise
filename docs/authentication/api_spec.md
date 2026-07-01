# API Specification & Function Documentation

This document serves as the reference guide for all backend API endpoints and internal program functions.

---

## 1. REST API Endpoints

### A. Register Account
* **Endpoint**: `POST /api/auth/register`
* **Content-Type**: `application/json`
* **Request Body Schema**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane.doe@organization.com",
    "password": "SecurePassword123",
    "role": "Admin",
    "organization": "Acme Corp",
    "accessCode": "ADMIN2026"
  }
  ```
* **Request Parameters**:
  * `name` *(string, required)*: The full name of the user.
  * `email` *(string, required)*: The unique login email.
  * `password` *(string, required)*: The raw password text (will be hashed).
  * `role` *(string, required)*: Allowed values: `"Employee"`, `"Admin"`, `"Super Admin"`.
  * `organization` *(string, required)*: Name of company/tenant organization.
  * `accessCode` *(string, conditional)*: Required if role is `"Admin"` (code: `ADMIN2026`) or `"Super Admin"` (code: `SUPER2026`).

* **Response Statuses**:
  * `214 Created`: Account successfully registered.
    ```json
    {
      "message": "Registration successful!",
      "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "jane.doe@organization.com",
        "role": "Admin",
        "organization": "Acme Corp"
      }
    }
    ```
  * `400 Bad Request`: Missing fields or invalid role.
  * `403 Forbidden`: Access code is incorrect or missing for Admin/Super Admin roles.
  * `409 Conflict`: Email is already in use.
  * `500 Internal Server Error`: Generic database or code error.

---

### B. Login User
* **Endpoint**: `POST /api/auth/login`
* **Content-Type**: `application/json`
* **Request Body Schema**:
  ```json
  {
    "email": "jane.doe@organization.com",
    "password": "SecurePassword123"
  }
  ```
* **Response Statuses**:
  * `200 OK`: Login successful. Returns JWT session token.
    ```json
    {
      "message": "Login successful!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6Ikph...",
      "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "jane.doe@organization.com",
        "role": "Admin",
        "organization": "Acme Corp"
      }
    }
    ```
  * `400 Bad Request`: Email or password field is missing.
  * `401 Unauthorized`: Invalid email or password.
  * `500 Internal Server Error`: Server failure.

---

### C. Verify Current User Session
* **Endpoint**: `GET /api/auth/me`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Response Statuses**:
  * `200 OK`: Valid token. Returns user session details.
    ```json
    {
      "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "jane.doe@organization.com",
        "role": "Admin",
        "organization": "Acme Corp",
        "iat": 1680000000,
        "exp": 1680086400
      }
    }
    ```
  * `401 Unauthorized`: Token is missing.
  * `403 Forbidden`: Token is invalid or expired.

---

## 2. Code Functions and Middleware

### Backend Functions (`/backend/`)

#### 1. `authenticateToken(req, res, next)` (Middleware)
* **Location**: `backend/middleware/auth.js`
* **Description**: Extracts the Bearer token from the `Authorization` request header, decrypts it using the secret key (`WFM_SECRET_KEY_2026`), and asserts payload integrity.
* **Arguments**: Standard Express `(req, res, next)` lifecycle parameters.
* **Output**: Sets `req.user` to the decoded token payload if valid, otherwise responds with `401` or `403`.

#### 2. `requireRole(allowedRoles)` (Middleware)
* **Location**: `backend/middleware/auth.js`
* **Description**: Returns an Express middleware handler that checks if the authenticated user's role is matching any entry in `allowedRoles`.
* **Arguments**: `allowedRoles` *(array of strings)* (e.g. `['Admin', 'Super Admin']`).
* **Output**: Invokes `next()` if matches, otherwise responds with `403 Forbidden`.

#### 3. `dbRun(sql, params)`
* **Location**: `backend/database.js`
* **Description**: Promise-based wrapper for SQLite's `Database#run`. Used for `INSERT`, `UPDATE`, or `DELETE` queries that modify data.
* **Arguments**:
  * `sql` *(string)*: SQL script.
  * `params` *(array)*: Parameterized values to bind, preventing SQL injection.
* **Output**: Resolves with `{ id, changes }` or rejects with an error.

#### 4. `dbGet(sql, params)`
* **Location**: `backend/database.js`
* **Description**: Promise-based wrapper for SQLite's `Database#get`. Fetches a single row.
* **Arguments**: `sql` *(string)*, `params` *(array)*.
* **Output**: Resolves with the single row object (or `undefined`), or rejects with an error.

---

### Frontend Functions (`/frontend/src/`)

#### 1. `handleSubmit(e)`
* **Location**: `components/Login.jsx` & `components/Register.jsx`
* **Description**: Intercepts HTML form submit events, performs initial validation checks, enables loading state spinners, and dispatches HTTP requests to the backend server.
* **Arguments**: `e` *(React FormEvent)*.

#### 2. `checkSession()`
* **Location**: `App.jsx` (inside `useEffect`)
* **Description**: Evaluates if the user has previously authenticated on this browser. Loads token and profile from `localStorage` and verifies status against the `/api/auth/me` endpoint.

#### 3. `handleLoginSuccess(token, user)`
* **Location**: `App.jsx`
* **Description**: Callback triggered by `Login.jsx` upon successful API authentication. Saves token to `localStorage` and changes current view to `'dashboard'`.
* **Arguments**: `token` *(JWT string)*, `user` *(user object)*.

#### 4. `handleLogout()`
* **Location**: `App.jsx`
* **Description**: Clears all local storage variables, nullifies user React states, and redirects the client back to the Login view.
