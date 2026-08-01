-- ============================================
-- Quiz system schema — monthly rotating quiz
-- Run this in your Supabase SQL editor
-- ============================================

-- ── Question sets ──
-- Each set has a `slot` (1, 2, 3, ...). The API picks the active set for the
-- current month using: slot = ((month_number - 1) % active_set_count) + 1
-- So with 2 sets: odd months use set 1, even months use set 2. Add more sets
-- (or change slots) whenever you want the quiz to rotate differently.
CREATE TABLE IF NOT EXISTS quiz_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slot INTEGER NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Questions ──
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID NOT NULL REFERENCES quiz_sets(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,           -- array of 4 strings
    correct_index INTEGER NOT NULL,   -- 0..3
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (set_id, question)
);

-- ── Attempts (once per volunteer per month) ──
-- `month` is the first day of the calendar month the attempt belongs to,
-- set explicitly by the API (a plain DATE column so it can be indexed —
-- date_trunc(now()) is timezone-dependent and cannot be used in indexes).
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    set_id UUID REFERENCES quiz_sets(id),
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    month DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Make the column exist even if the table was created by an earlier (failed)
-- migration run, then backfill it so the NOT NULL constraint can apply.
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS month DATE;
UPDATE quiz_attempts SET month = (created_at AT TIME ZONE 'UTC')::date WHERE month IS NULL;
ALTER TABLE quiz_attempts ALTER COLUMN month SET NOT NULL;

-- Enforce one attempt per volunteer per calendar month.
DROP INDEX IF EXISTS quiz_attempts_monthly_unique;
CREATE UNIQUE INDEX quiz_attempts_monthly_unique
    ON quiz_attempts (volunteer_id, month);

CREATE INDEX IF NOT EXISTS quiz_attempts_volunteer_idx
    ON quiz_attempts (volunteer_id);

-- ── Row Level Security ──
-- Questions contain the correct answers, so anon/public reads are BLOCKED.
-- The Cloudflare Functions use the service-role key, which bypasses RLS.
ALTER TABLE quiz_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Volunteers can view own attempts"
    ON quiz_attempts FOR SELECT
    USING (auth.uid() = (SELECT auth_user_id FROM volunteers WHERE id = quiz_attempts.volunteer_id));

CREATE POLICY "Volunteers can insert own attempts"
    ON quiz_attempts FOR INSERT
    WITH CHECK (auth.uid() = (SELECT auth_user_id FROM volunteers WHERE id = quiz_attempts.volunteer_id));

-- ════════════════════════════════════════════
-- SEED DATA
-- Set 1 (odd months) — the original quiz
-- ════════════════════════════════════════════
INSERT INTO quiz_sets (name, slot) VALUES ('Foundation Set', 1)
ON CONFLICT (slot) DO NOTHING;

INSERT INTO quiz_questions (set_id, question, options, correct_index, explanation)
SELECT s.id, q.question, q.options::jsonb, q.correct_index, q.explanation
FROM quiz_sets s,
(VALUES
    ('What is the motto of the National Service Scheme (NSS)?',
     '["Service Before Self", "Not Me, But You", "Unity and Discipline", "Duty Unto Death"]',
     1,
     'The motto of NSS is ''NOT ME, BUT YOU''. It underlines the concept of democratic living and upholds the need for selfless service and appreciation of other persons'' points of view.'),
    ('In which year was the National Service Scheme (NSS) officially launched?',
     '["1947 (Independence Year)", "1950 (Republic Year)", "1969 (Gandhi Centenary Year)", "1972"]',
     2,
     'NSS was launched on 24th September 1969, during the Gandhi Centenary Year, with 37,000 volunteers across 37 universities.'),
    ('The NSS was launched during the centenary year of which national leader?',
     '["Swami Vivekananda", "Mahatma Gandhi", "Subhas Chandra Bose", "Jawaharlal Nehru"]',
     1,
     'NSS was launched in 1969 to commemorate the 100th birth anniversary of Mahatma Gandhi, whose ideals are the foundation of NSS service.'),
    ('What is the primary color of the NSS badge, representing the energy and spirit of volunteers?',
     '["Navy Blue", "Pure Green", "Saffron / Giant Orange-Red", "Deep Yellow"]',
     2,
     'Saffron represents the blood, energy, and spirit of the NSS volunteers. The Navy Blue color represents the cosmos, of which the NSS is a tiny part, ready to contribute to its welfare.'),
    ('How many spokes are there in the NSS emblem wheel, taken from the Konark Sun Temple?',
     '["8 spokes", "12 spokes", "24 spokes", "16 spokes"]',
     0,
     'The NSS emblem contains an 8-spoked wheel. These 8 spokes represent the 24 hours of the day, signifying that a volunteer is ready to serve the nation round the clock.'),
    ('What is the minimum hours of community service a volunteer must complete in a year?',
     '["60 hours", "120 hours", "240 hours", "50 hours"]',
     1,
     'An NSS volunteer is required to complete at least 120 hours of social service activities annually, along with participation in special camping programs.'),
    ('On which day is National Youth Day celebrated, commemorating Swami Vivekananda''s birth anniversary?',
     '["24th September", "2nd October", "12th January", "15th August"]',
     2,
     'National Youth Day is celebrated on 12th January. It honors Swami Vivekananda''s teachings and motivates youth towards nation-building.'),
    ('On which day is ''NSS Day'' celebrated annually across India?',
     '["24th September", "2nd October", "12th January", "1st May"]',
     0,
     'NSS Day is celebrated on 24th September because the scheme was officially declared open on this exact date in 1969.'),
    ('Which ministry governs and sponsors the National Service Scheme in India?',
     '["Ministry of Education", "Ministry of Home Affairs", "Ministry of Youth Affairs and Sports", "Ministry of Social Justice"]',
     2,
     'NSS is a public service program sponsored and run under the guidance of the Ministry of Youth Affairs and Sports, Government of India.'),
    ('The giant wheel in the NSS logo is inspired by which historical monument?',
     '["Taj Mahal", "Sanchi Stupa", "Konark Sun Temple", "Red Fort"]',
     2,
     'The wheel in the NSS emblem is a simplified representation of the giant wheel from the Konark Sun Temple in Odisha, representing continuous motion and progress.'),
    ('What is the main objective of the National Service Scheme (NSS)?',
     '["Personality development of students through community service", "Providing military training to students", "Securing high-paying jobs for college graduates", "Funding college sports events"]',
     0,
     'The main objective of the NSS is the development of the personality of students through community service. It helps students understand community needs and problems.'),
    ('What does the saffron/red color in the NSS badge symbolize?',
     '["Peace and non-violence", "Vibrancy, blood, and active youth", "Cosmos and vastness", "Sacrifice and devotion"]',
     1,
     'Saffron represents the active, energetic blood of the youth, signifying that NSS volunteers are full of energy, spirit, and ready to act.'),
    ('Which committee first recommended the introduction of voluntary national service in Indian educational institutions?',
     '["Kothari Commission", "Radhakrishnan Commission", "Mudaliar Commission", "Sarkaria Commission"]',
     1,
     'The University Education Commission, chaired by Dr. Sarvepalli Radhakrishnan (1948-1950), first introduced the idea of voluntary national service in academic institutions.'),
    ('What is the name of the special residential camp organized by NSS units, typically lasting for 7 days in an adopted village?',
     '["NSS Special Camp", "National Integration Camp (NIC)", "Adventure Camp", "Republic Day Parade Camp (RD)"]',
     0,
     'NSS Special Camps are 7-day residential camps organized in adopted rural villages or urban slums, focusing on local development projects.'),
    ('What is the name of the official song of the National Service Scheme (NSS) sung during camps?',
     '["Vande Mataram", "Hum Honge Kaamyab", "Jana Gana Mana", "Sare Jahan Se Achha"]',
     1,
     '''Hum Honge Kaamyab'' (We Shall Overcome) is the official theme song sung at all NSS assemblies and camps to build solidarity, hope, and community motivation.')
) AS q(question, options, correct_index, explanation)
WHERE s.name = 'Foundation Set'
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════
-- Set 2 (even months) — rotates with Set 1
-- ════════════════════════════════════════════
INSERT INTO quiz_sets (name, slot) VALUES ('Awareness Set', 2)
ON CONFLICT (slot) DO NOTHING;

INSERT INTO quiz_questions (set_id, question, options, correct_index, explanation)
SELECT s.id, q.question, q.options::jsonb, q.correct_index, q.explanation
FROM quiz_sets s,
(VALUES
    ('Who was the Union Education Minister who officially launched the NSS in 1969?',
     '["Dr. V.K.R.V. Rao", "Dr. S. Radhakrishnan", "Maulana Abul Kalam Azad", "Dr. Zakir Husain"]',
     0,
     'NSS was launched on 24th September 1969 by Dr. V.K.R.V. Rao, the then Union Education Minister, during the Gandhi Centenary Year.'),
    ('What does the navy blue color in the NSS badge symbolise?',
     '["The deep ocean", "The cosmos, of which the NSS is a tiny part", "Law and discipline", "Equality and justice"]',
     1,
     'Navy blue represents the cosmos, of which the NSS is a tiny part, ready to contribute its share for the welfare of humanity.'),
    ('What is the Republic Day Camp (RDC) for NSS volunteers?',
     '["An adventure camp in the Himalayas", "A national camp in New Delhi for the best 25 NSS volunteers each year", "A sports meet between colleges", "A music and cultural festival"]',
     1,
     'Every year, the best 25 NSS volunteers are selected for the Republic Day Camp (RDC) in New Delhi, where they participate in the Republic Day Parade and associated programmes.'),
    ('Which students are eligible to become NSS volunteers?',
     '["Only students under 14 years", "Only postgraduate students", "Students of +2 and degree/technical institutions", "Working professionals"]',
     2,
     'Students studying in +2 (junior colleges), degree colleges, and technical institutions are eligible to enroll as NSS volunteers.'),
    ('Where does an NSS volunteer wear the NSS badge?',
     '["On the right shoulder", "On the left breast pocket", "On the cap", "On the sleeve"]',
     1,
     'The NSS badge is worn on the left breast pocket of the volunteer''s dress, close to the heart.'),
    ('The motto ''Not Me, But You'' primarily emphasises what?',
     '["Competitive spirit", "Selfless service and democratic living", "Physical fitness", "Academic excellence"]',
     1,
     'The motto underlines the concept of democratic living and upholds the need for selfless service, concern, and appreciation of other persons'' points of view.'),
    ('What is the main aim of a National Integration Camp (NIC)?',
     '["Training volunteers in military skills", "Bringing together volunteers from different states to foster national unity", "Selecting volunteers for foreign tours", "Organizing inter-college quizzes"]',
     1,
     'NIC brings together NSS volunteers from different states and cultures for about 7 days to promote national integration through shared service and cultural exchange.'),
    ('How is the NSS scheme funded in India?',
     '["Fully by the Central Government", "Fully by State Governments", "Shared by Central and State Governments", "Through private donations only"]',
     2,
     'The NSS is funded jointly by the Central and State Governments, with both sharing the expenditure of the scheme.'),
    ('Who heads the NSS unit at a college?',
     '["The Principal", "The Programme Officer", "The District Youth Officer", "The Student Coordinator"]',
     1,
     'An NSS unit in a college is headed by a Programme Officer, who is a faculty member responsible for planning and supervising all NSS activities.'),
    ('What is the typical strength of one NSS unit in a college?',
     '["50 volunteers", "100 volunteers", "200 volunteers", "500 volunteers"]',
     1,
     'As per NSS guidelines, one NSS unit consists of 100 volunteers. A programme officer heads each unit.'),
    ('2nd October is observed as the birth anniversary of which leader, celebrated by NSS volunteers with service activities?',
     '["Jawaharlal Nehru", "Sardar Patel", "Mahatma Gandhi", "Bhagat Singh"]',
     2,
     '2nd October marks Mahatma Gandhi''s birth anniversary, a day when NSS volunteers typically organize cleanliness drives and community service activities.'),
    ('On which date is International Youth Day observed?',
     '["12th August", "15th August", "2nd October", "24th September"]',
     0,
     'International Youth Day is observed on 12th August every year, highlighting the role of youth in building a better world.'),
    ('What is the primary role of NSS volunteers during natural disasters?',
     '["Emergency relief and rescue support", "Providing paid services to victims", "Military operations", "Media coverage only"]',
     0,
     'NSS volunteers are trained to assist in disaster management — helping with emergency relief, blood donation, shelter arrangements, and awareness campaigns.'),
    ('Who signs the NSS certificate of completion issued to volunteers?',
     '["Only the District Collector", "The Programme Officer and the head of the institution", "The Chief Minister", "The NSS volunteers themselves"]',
     1,
     'NSS completion certificates are signed by the Programme Officer and the Principal/head of the institution, and are recognized for academic and employment benefits.'),
    ('Which national campaign is the NSS strongly associated with for cleanliness drives?',
     '["Beti Bachao Beti Padhao", "Swachh Bharat Abhiyan", "Digital India", "Fit India Movement"]',
     1,
     'NSS volunteers actively participate in the Swachh Bharat Abhiyan, organizing cleanliness drives in campuses, villages, and public spaces across India.')
) AS q(question, options, correct_index, explanation)
WHERE s.name = 'Awareness Set'
ON CONFLICT DO NOTHING;
