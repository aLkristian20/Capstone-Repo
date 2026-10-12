# Barangay Watch security dashboard

React dashboard and Express/MySQL API for the Solar-Powered Home Security System capstone. Sensor events are shown as **Possible Intrusion Detected** and require human review. The ESP32-CAM is not integrated; the device status is deliberately shown as not yet integrated.

## Folder structure

```text
frontend/                 Vite + React dashboard
  src/App.jsx             Pages, reusable dashboard components
  src/api.js              Frontend API client
  src/styles.css          Responsive dashboard styling
backend/                  Express REST API
  src/server.js           Routes and MySQL access
  schema.sql              MySQL setup
  .env.example            Backend configuration template
```

## Start the application

Requires Node.js and npm. Open two terminals at the project directory:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dashboard loads records directly from MySQL through the backend API. It contains no hard-coded alert or household examples. If MySQL is unavailable, the dashboard reports the connection error.

## Connect MySQL

1. Open `backend/schema.sql` in MySQL Workbench or phpMyAdmin and run it. It creates the `barangay_security` database and the `users`, `households`, `alerts`, and `incident_updates` tables.
2. Edit `backend/.env` with your local DB credentials. XAMPP's default MySQL account is often `root` with an empty password; use the credentials configured on your computer.
3. Restart the backend. `/api/status` reports MySQL connection state. With MySQL unavailable, database-backed API requests return an error and the UI shows it.
4. Add household records in the dashboard. Alerts can be added to the `alerts` table. The future `POST /api/device/alerts` route requires `DEVICE_API_KEY` and the `x-device-key` request header; configure a strong secret before connecting a device.

Never put the database password in the frontend. `.env` is local configuration and should not be committed. This first version does not include official login or role-based access control; keep it on a trusted development network until authentication is added.

## API routes

`GET /api/status`, `GET /api/dashboard/summary`, `GET /api/alerts`, `GET /api/alerts/:id`, `PATCH /api/alerts/:id`, `GET /api/households`, `POST /api/households`, and future device ingestion at `POST /api/device/alerts`. Opening an alert marks it read; `PATCH` also accepts `is_read: true`. The frontend's default API base (`http://localhost:4000/api`) matches these routes. Override it with `VITE_API_URL` in `frontend/.env` when needed.

## Try the dashboard

Register a household, then check that it appears in the household list and dashboard count. Alerts will appear after a device or authorized operator adds records to the database. Open an alert to mark it read, update its status, and save response notes. The System integration status panel shows the live backend and database connections; the ESP32-CAM remains marked as pending integration.
