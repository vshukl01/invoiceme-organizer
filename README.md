# InvoiceMe Organizer

InvoiceMe Organizer is a 2-service system:

1) **Web App (Next.js)**: login + dashboard + API routes
2) **Worker (FastAPI)**: pulls PDFs from Google Drive, extracts fields, renames, and writes results back

It uses **Supabase (Postgres)** as the database for:
- users/orgs
- saved drive folders (raw + arranged)
- jobs and job_items (status + extracted fields)

---

## High-Level Flow (End-to-End)

### Step 0 — Admin creates users
- A user row exists in DB with:
  - email
  - password_hash
  - org_id
  - is_approved = true/false
- User can only login if `is_approved = true`.

### Step 1 — User logs in (Web)
- UI: `src/app/(auth)/login/page.tsx`
- API: `src/app/api/auth/login/route.ts`
- Auth helper: `src/lib/auth.ts`
- If successful, the server stores a signed cookie/session and redirects to `/dashboard`.

### Step 2 — User saves Drive folder IDs (Web)
User provides:
- RAW folder link (where PDFs are)
- ARRANGED folder link (where renamed PDFs go)

API route:
- `src/app/api/drive/save-folders/route.ts`
Stores folder IDs in DB associated with the user/org.

> Note: right now, folder IDs come from user input.
> Security hardening later will prevent arbitrary folder IDs by enforcing server-side validation and lookup.

### Step 3 — User creates a processing job (Web)
API route:
- `src/app/api/jobs/create/route.ts`

This:
- creates a row in `jobs`
- calls the Worker `/enqueue` endpoint (via `src/lib/workerClient.ts`)

### Step 4 — Worker runs the job (FastAPI)
Worker endpoint:
- `services/worker/app/main.py` (POST `/enqueue`)

Worker does:
1) set job status = "queued" / "running"
2) lists PDFs in raw folder (Drive API)
3) downloads each PDF
4) ensures text exists (OCR layer if needed)
5) extracts:
   - Invoice Date (ONLY invoice date)
   - Memo Date (ONLY memo date)
   - Company (Bill To / Consignee rules)
   - Doc number prefixes (SG... for invoices, M... for memos)
6) normalizes names for safe filenames
7) uploads renamed PDF to arranged folder
8) inserts a row in `job_items` for each processed file
9) sets job status = "done" (or "failed" if error)

---

## Repository Structure

### apps/web (Next.js)
- `src/app/(auth)/login/page.tsx`
  - Login form UI
  - Calls `/api/auth/login`

- `src/app/dashboard/page.tsx`
  - Dashboard UI
  - Shows saved folders, job creation, job status, and items

- `src/app/api/auth/login/route.ts`
  - Validates credentials using `src/lib/auth.ts`
  - Sets auth cookie/session

- `src/app/api/auth/logout/route.ts`
  - Clears auth cookie/session

- `src/app/api/drive/save-folders/route.ts`
  - Saves raw/arranged folder IDs to DB (per user/org)

- `src/app/api/jobs/create/route.ts`
  - Creates a DB job
  - Triggers worker `/enqueue`

- `src/app/api/jobs/list/route.ts`
  - Lists jobs for the logged-in user/org

- `src/app/api/jobs/items/route.ts`
  - Lists job items (each processed PDF + extracted fields)

#### apps/web/src/lib
- `env.ts`
  - Reads env vars (Supabase keys, worker URL, cookie secret, etc.)
  - Central place for configuration

- `db.ts`
  - Creates Supabase clients:
    - anon client (safe for limited reads if needed)
    - admin/service-role client (server-only)

- `auth.ts`
  - Verifies login:
    - user exists
    - approved
    - bcrypt compares password_hash

- `drive.ts`
  - Helpers for parsing folder links -> extracting folder IDs, etc.

- `workerClient.ts`
  - Calls Worker service:
    - adds header `x-worker-token`
    - sends job_id to `/enqueue`

---

### services/worker (FastAPI)
Location: `services/worker/app`

- `settings.py`
  - Loads worker env vars (Supabase URL, service role key, worker token, Google creds path/json)

- `logger.py`
  - Central logging config.
  - Logs clearly at each stage: listing PDFs, downloading, extracting, uploading, DB writes.

- `drive_client.py`
  - Google Drive API client functions:
    - `list_pdfs_in_folder(folder_id)`
    - `download_file(file_id, out_path)`
    - `upload_file(folder_id, local_path, name)`

- `extract.py`
  - Extraction rules:
    - invoice date only (not due date)
    - memo date only
    - company from Bill To / Consignee as specified
    - doc numbers SG... / M...
  - Reads text from PDF and finds fields.

- `normalize.py`
  - Filename-safe normalization:
    - remove weird unicode
    - collapse spaces
    - safe separators
    - consistent casing

- `processor.py`
  - The “job runner”:
    - pulls folder IDs for job from DB
    - loops files
    - downloads -> OCR/text -> extract -> normalize -> upload
    - inserts job_items
    - updates job status + progress

- `main.py`
  - FastAPI server:
    - health endpoint
    - `/enqueue` endpoint
    - auth via header `x-worker-token`

---

## Database Entities (Supabase / Postgres)

### users
- id
- org_id
- email
- password_hash
- is_admin
- is_approved

### orgs (optional but recommended)
- id
- name

### drive_folders (or saved_folders)
- id
- org_id
- raw_folder_id
- arranged_folder_id
- created_at

### jobs
- id
- org_id
- created_by_user_id
- raw_folder_id
- arranged_folder_id
- status: queued | running | done | failed
- message
- created_at
- finished_at

### job_items
- id
- job_id
- source_file_id
- source_filename
- status: done | failed
- doc_type (invoice/memo)
- extracted_date
- extracted_company
- doc_number
- output_file_id
- output_path (or output_filename)
- error
- created_at

---

## Environment Variables

### apps/web/.env.local
- SUPABASE_URL=
- SUPABASE_ANON_KEY=
- SUPABASE_SERVICE_ROLE_KEY=   (server-only; never expose to browser)
- WORKER_BASE_URL=
- WORKER_API_TOKEN=
- AUTH_COOKIE_SECRET=

### services/worker/.env
- SUPABASE_URL=
- SUPABASE_SERVICE_ROLE_KEY=
- WORKER_API_TOKEN=
- GOOGLE_SERVICE_ACCOUNT_JSON_PATH=services/worker/secrets/service_account.json

---

## Google Service Account JSON (IMPORTANT)

### Do NOT commit the .json to git.
Recommended local layout:
- `services/worker/secrets/service_account.json`

Add this to `.gitignore`:
- `services/worker/secrets/`
- `*.json` (optional, but be careful if you do)

In production (Render/Fly/EC2 etc):
- store the JSON as a secret env var or mount as a secret file
- point `GOOGLE_SERVICE_ACCOUNT_JSON_PATH` to that mounted path

---

## Worker API Token (Where it comes from)

`WORKER_API_TOKEN` is not from Google.
It’s your own shared secret between Web and Worker.

Generate one:
- 32+ chars random string
Example:
- `openssl rand -hex 32`

Set the same value in:
- apps/web env (WORKER_API_TOKEN)
- services/worker env (WORKER_API_TOKEN)

Web sends it as header:
- `x-worker-token: <token>`

Worker rejects requests if it doesn’t match.

---

## Can I use Postgres instead of Supabase?

Yes.
Supabase **is Postgres** with a nice API + auth + storage.

If you want “pure Postgres”:
- You can keep the same schema,
- and replace Supabase client calls with:
  - Prisma / Drizzle (Node side)
  - SQLAlchemy / psycopg (Python side)

But right now your code is wired to Supabase clients, so switching is a refactor (not hard, just mechanical).

---

## Planned Security Hardening (Later)
- Do not accept arbitrary Drive folder IDs from user input
- Store folder IDs per org/user server-side
- Validate access before creating a job
- Restrict worker to accepting only `job_id` (no raw folder IDs directly)
- Add least-privilege checks + server-side lookups
