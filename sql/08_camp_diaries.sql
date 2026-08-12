-- ============================================
-- Option A: Digital Camp Diary System Schema
-- Run this in your Supabase SQL editor
-- ============================================

CREATE TABLE IF NOT EXISTS camp_diaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
    work_description TEXT NOT NULL,
    hours_spent DECIMAL(4,2) NOT NULL DEFAULT 8.00,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (volunteer_id, activity_id, day_number)
);

-- Enable Row Level Security
ALTER TABLE camp_diaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Volunteers read own diaries" ON camp_diaries;
DROP POLICY IF EXISTS "Service role manages diaries" ON camp_diaries;

-- Volunteers read their own diaries
CREATE POLICY "Volunteers read own diaries" ON camp_diaries
    FOR SELECT
    USING (volunteer_id = (SELECT id FROM volunteers WHERE auth_user_id = auth.uid()));

-- Service role bypasses RLS (used in Cloudflare backend API calls)
CREATE POLICY "Service role manages diaries" ON camp_diaries
    FOR ALL
    USING (true)
    WITH CHECK (true);
