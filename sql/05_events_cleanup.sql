-- ============================================
-- Events consolidation cleanup
-- Run this in your Supabase SQL editor
-- ============================================
--
-- The Events page now reads live from the `activities` table and
-- registrations are stored in `event_registrations.event_id` (which
-- holds ACTIVITY ids). The separate `events` table is no longer used.
--
-- 1) Point the registrations FK at `activities` instead of `events`
ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_event_id_fkey;
ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_activity_id_fkey
    FOREIGN KEY (event_id) REFERENCES activities(id) ON DELETE CASCADE;

-- 2) Drop the now-unused `events` table (and its helper RPCs).
--    ONLY run this after confirming the migration above succeeded and
--    after any old `events` rows you still want are copied/removed.
DROP TABLE IF EXISTS events;
DROP FUNCTION IF EXISTS increment_event_count(UUID);
DROP FUNCTION IF EXISTS decrement_event_count(UUID);
