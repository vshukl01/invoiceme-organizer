-- ============================================================
-- InvoiceMe Organizer (Supabase / Postgres) - Initial Schema
-- ============================================================
-- Goal:
-- - Multi-tenant (multiple orgs)
-- - Admin allowlist approval (you control who can use)
-- - Each user stores their Drive folder IDs
-- - Jobs + Job items for UI to show progress + extracted fields
--
-- Notes:
-- - Worker writes into jobs/job_items using SUPABASE_SERVICE_ROLE_KEY
-- - Web reads jobs/job_items and shows extracted data to the user
-- - Later security hardening: do NOT accept arbitrary folder IDs
--   (store per user/org, enforce server-side lookup, worker uses job_id only)
-- ============================================================

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- ----------------------------
-- Organizations (tenants)
-- ----------------------------
create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------
-- Users
-- ----------------------------
-- Users are created and approved by you.
-- Login uses email+password (password is stored hashed).
-- Each user may save their Drive folder IDs:
-- - raw_folder_id: input folder
-- - docs_folder_id: output folder root where we create docs/<date>/<type>/...
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,

  email text not null,
  password_hash text not null,

  -- Admin user can approve others later; start with your first admin approved.
  is_admin boolean not null default false,
  is_approved boolean not null default false,

  raw_folder_id text,
  docs_folder_id text,

  created_at timestamptz not null default now(),
  unique (org_id, email)
);

create index if not exists idx_users_org on users(org_id);

-- ----------------------------
-- Jobs
-- ----------------------------
-- A job represents one run of "scan raw folder => OCR => extract => upload organized PDFs".
-- We snapshot folder ids in the job row for auditability.
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  created_by uuid references users(id) on delete set null,

  status text not null
    check (status in ('queued', 'running', 'done', 'failed'))
    default 'queued',

  -- A short human-readable summary visible on dashboard
  message text,

  raw_folder_id text,
  docs_folder_id text,

  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_jobs_org_created on jobs(org_id, created_at desc);

-- ----------------------------
-- Job Items (one per PDF)
-- ----------------------------
-- Each file processed from the Raw folder gets a row here.
-- This is what your UI will show to the user:
-- - which file
-- - extracted doc_type/date/company/docnum
-- - output path and status
create table if not exists job_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,

  source_file_id text not null,
  source_filename text,

  -- Invoice or Memo (based on which label is present)
  doc_type text check (doc_type in ('Invoice','Memo')),

  -- Stored in MM-DD-YYYY (STRICT from Invoice Date / Memo Date only)
  extracted_date text,

  -- STRICT source:
  -- - Invoice: Bill To
  -- - Memo: Consignee
  extracted_company text,

  -- Invoice doc numbers start with SG/
  -- Memo doc numbers start with M/
  doc_number text,

  -- Google Drive output
  output_file_id text,
  output_path text,

  status text not null
    check (status in ('processed','skipped','failed'))
    default 'processed',

  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_job_items_job_created on job_items(job_id, created_at asc);

-- ============================================================
-- Optional helper view (nice for debugging)
-- ============================================================
create or replace view job_items_readable as
select
  ji.*,
  j.org_id,
  j.status as job_status,
  j.created_at as job_created_at
from job_items ji
join jobs j on j.id = ji.job_id;
