-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard > SQL Editor)

-- ============================================
-- ENROLLMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS enrollments (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT now(),

  -- Personal Information
  name          TEXT NOT NULL,
  parent_name   TEXT NOT NULL,
  dob           TEXT NOT NULL,
  gender        TEXT NOT NULL,
  blood_group   TEXT NOT NULL,
  cast_category TEXT NOT NULL,
  aadhar_no     TEXT NOT NULL,

  -- Academic Details
  department    TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  class         TEXT NOT NULL,
  roll_no       TEXT NOT NULL,
  eligibility   TEXT NOT NULL,

  -- Contact Information
  email         TEXT NOT NULL,
  mobile_no     TEXT NOT NULL,
  emergency_no  TEXT NOT NULL,
  emergency_rel TEXT NOT NULL,
  address       TEXT NOT NULL,

  -- NSS Details
  interest_area TEXT NOT NULL,
  prev_nss      TEXT NOT NULL,
  tshirt_size   TEXT NOT NULL,
  medical       TEXT DEFAULT 'None',

  -- Registration
  ref_code      TEXT UNIQUE NOT NULL,
  "timestamp"   TIMESTAMPTZ DEFAULT now()
);

-- Index for looking up by ref code
CREATE INDEX IF NOT EXISTS idx_enrollments_ref_code ON enrollments (ref_code);

-- Index for sorting by most recent
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON enrollments (created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Allow INSERT from anon key (your Cloudflare function will use the anon key)
CREATE POLICY "Allow anon inserts" ON enrollments
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow select only with service_role key (admin dashboard)
-- DO NOT allow anon selects by default
