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

CREATE INDEX IF NOT EXISTS idx_enrollments_ref_code ON enrollments (ref_code);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON enrollments (created_at DESC);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Allow INSERT via the anon key (Cloudflare function uses this)
CREATE POLICY "Allow anon inserts" ON enrollments
  FOR INSERT TO anon WITH CHECK (true);

-- Allow individual volunteers to read their own record (matched via profiles)
CREATE POLICY "Volunteers can read own enrollment" ON enrollments
  FOR SELECT USING (
    ref_code IN (
      SELECT ref_code FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================
-- PROFILES TABLE (links auth.users to enrollments)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ref_code      TEXT UNIQUE NOT NULL REFERENCES enrollments(ref_code),
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- PARTICIPATION HOURS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS participation_hours (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ref_code      TEXT NOT NULL REFERENCES enrollments(ref_code),
  activity_name TEXT NOT NULL,
  hours         NUMERIC(5,1) NOT NULL CHECK (hours > 0),
  activity_date DATE NOT NULL,
  description   TEXT DEFAULT '',
  logged_by     TEXT DEFAULT 'NSS Officer',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hours_ref_code ON participation_hours (ref_code);

ALTER TABLE participation_hours ENABLE ROW LEVEL SECURITY;

-- Volunteers can read their own hours (matched via their profile's ref_code)
CREATE POLICY "Volunteers can read own hours" ON participation_hours
  FOR SELECT USING (
    ref_code IN (
      SELECT ref_code FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins can insert hours (via service_role key — not anon)
-- Sample data to test with
-- INSERT INTO participation_hours (ref_code, activity_name, hours, activity_date, description)
-- VALUES ('SRH-NSS-2026-4231', 'Tree Plantation Drive', 4.0, '2026-07-15', 'Planted 50 saplings at Katraj hill'),
--        ('SRH-NSS-2026-4231', 'Swachh Bharat Abhiyan', 3.0, '2026-08-05', 'Campus cleanliness drive'),
--        ('SRH-NSS-2026-4231', 'Blood Donation Camp', 5.0, '2026-08-20', 'Assisted in organizing blood donation');
