-- ============================================
-- Events capacity & waitlist schema
-- Run this in your Supabase SQL editor
-- ============================================

-- ── Add capacity columns to existing events table ──
-- If the events table doesn't exist yet, create it.
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    time TEXT,
    category TEXT DEFAULT 'general' NOT NULL,
    venue TEXT,
    leader TEXT,
    max_capacity INTEGER DEFAULT 0 NOT NULL,
    current_count INTEGER DEFAULT 0 NOT NULL,
    is_waitlist_enabled BOOLEAN DEFAULT false NOT NULL,
    is_urgent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view events"
    ON events FOR SELECT
    USING (true);

-- Allow volunteer auth to insert registrations (handled in API via service key)
-- but we still need SELECT policy for public reads.

-- ── Event Registrations table ──
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'registered'
        CHECK (status IN ('registered', 'waitlisted', 'cancelled')),
    registered_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, volunteer_id)
);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Volunteers can read their own registrations
CREATE POLICY "Volunteers read own registrations"
    ON event_registrations FOR SELECT
    USING (volunteer_id = (SELECT id FROM volunteers WHERE auth_id = auth.uid()));

-- Service-role API manages insert/update (handled in Functions)
CREATE POLICY "Service role manages registrations"
    ON event_registrations FOR ALL
    USING (true)
    WITH CHECK (true);

-- ── Helper RPCs for atomic count updates ──
CREATE OR REPLACE FUNCTION increment_event_count(eid UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE events SET current_count = current_count + 1 WHERE id = eid;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_event_count(eid UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE events SET current_count = GREATEST(current_count - 1, 0) WHERE id = eid;
END;
$$;

-- ── Seed events ──
INSERT INTO events (title, description, event_date, time, category, venue, leader, max_capacity, is_waitlist_enabled, is_urgent) VALUES
('Tree Plantation Drive', 'Mass tree plantation drive on World Environment Day. Wear comfortable shoes, carry water.', '2026-06-05', '07:00 AM', 'camp', 'College Campus', 'Dr. Sharma', 50, true, false),
('NSS Orientation 2026', 'Welcome event for new first-year volunteers. Introduction to NSS goals and activities.', '2026-06-15', '10:00 AM', 'meeting', 'Seminar Hall', 'Prof. Patil', 100, false, false),
('Blood Donation Camp', 'Annual blood donation drive in association with Red Cross.', '2026-06-20', '08:00 AM', 'camp', 'College Auditorium', 'Dr. Kulkarni', 30, true, true),
('Cleanliness Rally', 'Plastic waste collection, bus stop cleaning, wall painting. Mandatory for active volunteers.', '2026-07-05', '06:30 AM', 'camp', 'Katraj Area', 'NSS PO', 40, false, false),
('Yoga & Meditation Workshop', 'International Yoga Day celebration with certified instructors.', '2026-06-21', '06:00 AM', 'camp', 'College Ground', 'Yoga Guru', 25, true, false),
('Road Safety Awareness', 'Traffic rules awareness campaign with poster display and street play.', '2026-07-15', '09:00 AM', 'general', 'Market Area', 'Mr. Jadhav', 60, false, false),
('General Body Meeting', 'Monthly coordination meeting for all active NSS volunteers.', '2026-07-10', '11:00 AM', 'meeting', 'Room 101', 'Secretary', 80, false, false)
ON CONFLICT DO NOTHING;
