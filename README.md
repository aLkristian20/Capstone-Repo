# Barangay Watch security dashboard

React dashboard and Express/MySQL API for the Solar-Powered Home Security System capstone. Sensor events are shown as **Possible Intrusion Detected** and require human review. The ESP32-CAM is not integrated; the device status is deliberately shown as not yet integrated.

## Folder structure

```text
frontend/                 Vite + React dashboard
  src/App.jsx             Pages, reusable dashboard components
  src/api.js              Frontend API client
  src/styles.css          Responsive dashboard styling
backend/                  Express REST API
  src/server.js           API routes and health endpoints
  src/db.js               Reusable mysql2 connection pool
  schema.sql              MySQL schema source
  .env.example            Backend configuration template
database.sql              phpMyAdmin import file
```

## Start the application

Requires Node.js, npm, and XAMPP. Start MySQL in the XAMPP Control Panel first. Open two PowerShell terminals:

```powershell
cd C:\xampp\htdocs\capstone\backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
npm install
npm run dev
```

Set `DB_HOST=localhost`, `DB_PORT=3306`, `DB_USER=root`, `DB_NAME=barangay_security_db`, and set `DB_PASSWORD` to the password actually configured for your XAMPP MySQL account. The password must be present in `.env`; leave it blank only when you verified that this account has no password. Never copy database credentials into React files.

```powershell
cd C:\xampp\htdocs\capstone\frontend
npm install
npm run dev
```

Open http://localhost:5173. The dashboard loads records directly from MySQL through the backend API. It contains no hard-coded alert or household examples. If MySQL is unavailable, the dashboard reports the connection error.

## Initialize MySQL in phpMyAdmin

1. In XAMPP Control Panel, start **MySQL**.
2. Open http://localhost/phpmyadmin.
3. Select **Import**, choose `C:\xampp\htdocs\capstone\database.sql`, then select **Import** or **Go**. The script creates `barangay_security_db` and the `users`, `households`, `alerts`, and `incident_updates` tables. It uses `CREATE TABLE IF NOT EXISTS`, so importing again does not replace existing table contents.
4. Keep the backend `.env` values aligned with your XAMPP server. To check the root account from PowerShell, run `C:\xampp\mysql\bin\mysql.exe -h localhost -P 3306 -u root -p -e "SELECT 1;"`; enter the password when prompted. If the local account has no password, press Enter at the prompt. Then put that verified value in `DB_PASSWORD`.
5. Restart the backend. `GET /health` and `GET /api/status` check the actual database connection.
6. Set `OFFICIAL_API_KEY` in `backend/.env` to a long random secret. Officials enter this key on an incident page to authorize status and response-note updates. It is a shared development key, not individual user sign-in.

This workspace was checked against the local XAMPP server: `root` on `localhost:3306` authenticated with the explicitly blank local password. The earlier `barangay_security` data was copied into `barangay_security_db`; row sets were compared before the duplicate database was removed. `barangay_security_db` is now the sole project database.

## Test the API from PowerShell

With backend and XAMPP MySQL running, these commands call the local API:

```powershell
curl.exe http://localhost:4000/health
curl.exe http://localhost:4000/api/status
curl.exe http://localhost:4000/api/dashboard/summary
curl.exe http://localhost:4000/api/alerts
curl.exe http://localhost:4000/api/households
```

Register a household with a JSON POST:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/households -ContentType 'application/json' -Body '{"name":"Demo Household","address":"1 Sample Street","contact":"09170000000"}'
```

`GET /health` returns HTTP 200 with `{"ok":true,"database":"connected"}` when MySQL is reachable, and HTTP 503 otherwise. `/api/dashboard/summary` returns actual household and alert counts. `/api/alerts` and `/api/households` return their current database rows; an empty list is a valid response.

Common connection errors:

- `ECONNREFUSED`: start MySQL in XAMPP Control Panel and confirm it listens on port 3306; update `DB_PORT` if your local XAMPP is configured differently.
- `ER_ACCESS_DENIED_ERROR`: verify `DB_USER` and `DB_PASSWORD` against the account you tested with the `mysql.exe` command. Do not assume the password is blank.
- `ER_BAD_DB_ERROR`: import `database.sql` in phpMyAdmin and confirm the selected database is `barangay_security_db`.
- `ER_NO_SUCH_TABLE`: import `database.sql` into the configured database, then restart the backend.
- Port 4000 already in use: change `PORT` in `backend/.env` and update the frontend API base if needed.

Never put the database password or official access key in the frontend source. `.env` is local configuration and should not be committed. The shared official key provides basic write authorization for a trusted development network; it is not individual user login or role-based access control.

## API routes

`GET /health`, `GET /api/status`, `GET /api/dashboard/summary`, `GET /api/alerts`, `GET /api/alerts/:id`, `PATCH /api/alerts/:id`, `PATCH /api/alerts/:id/read`, `GET /api/households`, `POST /api/households`, `GET /api/activity/recent`, and future device ingestion at `POST /api/device/alerts`. The frontend's default API base (`http://localhost:4000/api`) matches these API routes. Override it with `VITE_API_URL` in `frontend/.env` when needed.

## Try the dashboard

Register a household, then check that it appears in the household list and dashboard count. Alerts will appear after a device or operator adds records to the database. Open an alert to mark it read, update its status, and save response notes. The dashboard shows recent incident activity and live API/MySQL health; the ESP32-CAM remains pending integration.
