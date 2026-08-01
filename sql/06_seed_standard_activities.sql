-- ============================================
-- Seed standard/annual NSS activities
-- These are the recurring activities shown on the
-- Activities page. Seeding them into the activities
-- table makes them appear on the Events page with
-- working registration. Safe to re-run (uses the
-- current year, so re-run each January for the new
-- year, or whenever you like).
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS activities_title_date_uidx ON activities (title, activity_date);

-- The standard/annual activities use categories from the Activities page
-- (national, health, social, environment, education, awareness) alongside
-- the admin form's types (camp, drive, event, workshop). Widen the check.
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_activity_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_activity_type_check
    CHECK (activity_type IN ('camp','drive','event','workshop','national','education','social','environment','health','awareness'));

WITH seed_rows AS (
  SELECT 'National Youth Day'::text AS title, 'Celebrated to honor Swami Vivekananda''s ideals of youth empowerment, character building, and service to the nation.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 1, 12) AS activity_date, 'national'::text AS activity_type
  UNION ALL
  SELECT 'National Youth Week'::text AS title, 'A week dedicated to organizing youth development programs, seminars, debates, and workshops on leadership and social responsibility.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 1, 12) AS activity_date, 'education'::text AS activity_type
  UNION ALL
  SELECT 'World Understanding Day'::text AS title, 'Promoting mutual understanding, peace, and goodwill among all people through dialogue and cultural exchange.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 1, 23) AS activity_date, 'social'::text AS activity_type
  UNION ALL
  SELECT 'Republic Day'::text AS title, 'Flag hoisting, parades, and cultural programs to celebrate the adoption of the Constitution of India in 1950.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 1, 26) AS activity_date, 'national'::text AS activity_type
  UNION ALL
  SELECT 'Martyr''s Day'::text AS title, 'Observed to pay homage to Mahatma Gandhi and the freedom fighters who sacrificed their lives for the nation.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 1, 30) AS activity_date, 'national'::text AS activity_type
  UNION ALL
  SELECT 'University Foundation Day'::text AS title, 'Celebrating the foundation of the university with academic events, cultural programs, and felicitation of achievers.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 2, 10) AS activity_date, 'education'::text AS activity_type
  UNION ALL
  SELECT 'Women''s Day'::text AS title, 'Organizing events to celebrate women''s achievements, promote gender equality, and empower women in society.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 3, 8) AS activity_date, 'social'::text AS activity_type
  UNION ALL
  SELECT 'World Forest Day'::text AS title, 'Tree plantation drives and awareness campaigns to highlight the importance of forests and their conservation.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 3, 31) AS activity_date, 'environment'::text AS activity_type
  UNION ALL
  SELECT 'World Health Day'::text AS title, 'Health check-up camps, blood donation drives, and hygiene awareness programs organized for students and local communities.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 4, 7) AS activity_date, 'health'::text AS activity_type
  UNION ALL
  SELECT 'Fire Prevention Day'::text AS title, 'Conducting fire safety drills, demonstrations, and awareness sessions on fire prevention and emergency response.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 4, 14) AS activity_date, 'awareness'::text AS activity_type
  UNION ALL
  SELECT 'World Labour Day'::text AS title, 'Honoring the contributions of workers and raising awareness about labor rights and dignity of labor.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 5, 1) AS activity_date, 'social'::text AS activity_type
  UNION ALL
  SELECT 'Maharashtra Day'::text AS title, 'Celebrating the formation of the state of Maharashtra with cultural programs, patriotic speeches, and felicitations.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 5, 1) AS activity_date, 'national'::text AS activity_type
  UNION ALL
  SELECT 'Nutrition Week'::text AS title, 'Week-long programs on nutrition, healthy eating habits, balanced diet awareness and food distribution drives.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 5, 1) AS activity_date, 'health'::text AS activity_type
  UNION ALL
  SELECT 'World Environment Day'::text AS title, 'Tree plantations, cleanliness drives, rallies, and poster-making competitions to promote environmental consciousness.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 6, 5) AS activity_date, 'environment'::text AS activity_type
  UNION ALL
  SELECT 'Banamahotsav Week'::text AS title, 'Mass tree plantation drives in colleges, communities, and villages to increase green cover and combat climate change.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 7, 1) AS activity_date, 'environment'::text AS activity_type
  UNION ALL
  SELECT 'World Population Day'::text AS title, 'Awareness campaigns about population growth, family planning, reproductive health, and sustainable development challenges.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 7, 11) AS activity_date, 'awareness'::text AS activity_type
  UNION ALL
  SELECT 'Campaign Against Nuclear Weapons'::text AS title, 'Remembering Hiroshima and promoting peace, disarmament, and the elimination of nuclear weapons worldwide.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 8, 6) AS activity_date, 'awareness'::text AS activity_type
  UNION ALL
  SELECT 'Independence Day'::text AS title, 'Grand flag hoisting ceremony, patriotic songs, cultural programs, and rallies to celebrate India''s freedom.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 8, 15) AS activity_date, 'national'::text AS activity_type
  UNION ALL
  SELECT 'Teacher''s Day'::text AS title, 'Honoring teachers and their invaluable contribution to education with felicitation programs and cultural events.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 9, 5) AS activity_date, 'education'::text AS activity_type
  UNION ALL
  SELECT 'International Literacy Day-Week'::text AS title, 'Literacy campaigns, book distribution, adult education programs, and reading awareness drives in local communities.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 9, 8) AS activity_date, 'education'::text AS activity_type
  UNION ALL
  SELECT 'N.S.S. Foundation Day'::text AS title, 'Grand celebration of NSS Foundation Day with community service, cultural programs, volunteer felicitation, and oath-taking ceremonies.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 9, 24) AS activity_date, 'social'::text AS activity_type
  UNION ALL
  SELECT 'Gandhi Jayanti'::text AS title, 'Paying tribute to Mahatma Gandhi through cleanliness drives, peace rallies, and programs promoting non-violence and truth.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 10, 2) AS activity_date, 'national'::text AS activity_type
  UNION ALL
  SELECT 'World Food Day'::text AS title, 'Food distribution drives, awareness about food wastage, hunger eradication campaigns, and nutrition education programs.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 10, 16) AS activity_date, 'health'::text AS activity_type
  UNION ALL
  SELECT 'U.N.O. Day'::text AS title, 'Seminars and discussions on global peace, human rights, international cooperation, and sustainable development goals.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 10, 24) AS activity_date, 'awareness'::text AS activity_type
  UNION ALL
  SELECT 'Traffic Week'::text AS title, 'Road safety campaigns, traffic rule awareness drives, helmet distribution, and collaboration with traffic police for safety education.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 10, 14) AS activity_date, 'awareness'::text AS activity_type
  UNION ALL
  SELECT 'Savings Day'::text AS title, 'Promoting financial literacy, savings habits, budgeting awareness, and responsible money management among youth.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 10, 31) AS activity_date, 'education'::text AS activity_type
  UNION ALL
  SELECT 'National Integration Day'::text AS title, 'Programs promoting unity, communal harmony, and national integration — celebrating India''s diversity as its strength.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 10, 31) AS activity_date, 'national'::text AS activity_type
  UNION ALL
  SELECT 'Children''s Day'::text AS title, 'Organizing games, educational programs, and distribution drives at local schools to celebrate children and their rights.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 11, 14) AS activity_date, 'social'::text AS activity_type
  UNION ALL
  SELECT 'Mother''s Day'::text AS title, 'Special events to honor mothers and their selfless contributions to families and society through appreciation programs.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 11, 19) AS activity_date, 'social'::text AS activity_type
  UNION ALL
  SELECT 'Quami Ekta Week'::text AS title, 'Week-long programs fostering national unity, communal harmony, and cultural integration through workshops and rallies.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 11, 19) AS activity_date, 'national'::text AS activity_type
  UNION ALL
  SELECT 'Environment Awareness Month'::text AS title, 'A full month of environmental activities — tree planting, cleanliness drives, poster competitions, and conservation awareness.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 11, 19) AS activity_date, 'environment'::text AS activity_type
  UNION ALL
  SELECT 'Weaker''s Section Day'::text AS title, 'Outreach programs, donation drives, and initiatives to support and uplift underprivileged and marginalized communities.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 11, 22) AS activity_date, 'social'::text AS activity_type
  UNION ALL
  SELECT 'World AIDS Day'::text AS title, 'Awareness rallies, red ribbon campaigns, health seminars, and educational sessions on HIV/AIDS prevention and support.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 12, 1) AS activity_date, 'health'::text AS activity_type
  UNION ALL
  SELECT 'International Volunteers Day'::text AS title, 'Celebrating the spirit of volunteerism with community service projects, volunteer recognition, and social impact drives.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 12, 5) AS activity_date, 'social'::text AS activity_type
  UNION ALL
  SELECT 'Human Rights Day'::text AS title, 'Seminars on human rights, constitutional values, equality, and justice — encouraging youth to stand up for fundamental freedoms.'::text AS description, make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 12, 10) AS activity_date, 'awareness'::text AS activity_type
)
INSERT INTO activities (title, description, activity_date, activity_type, max_volunteers, is_waitlist_enabled, is_urgent, status)
SELECT title, description, activity_date, activity_type, 0, false, false,
       CASE WHEN activity_date >= CURRENT_DATE THEN 'upcoming' ELSE 'completed' END AS status
FROM seed_rows
ON CONFLICT (title, activity_date) DO NOTHING;
