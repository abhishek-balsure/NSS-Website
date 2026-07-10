-- ============================================
-- Resources & Alumni Stories schema
-- Run this in your Supabase SQL editor
-- ============================================

-- ── Resources / Downloads ──
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view resources"
    ON resources FOR SELECT
    USING (true);

-- ── Alumni Success Stories ──
CREATE TABLE IF NOT EXISTS alumni_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    graduation_year INTEGER,
    profession TEXT,
    company TEXT,
    photo_url TEXT,
    story_content TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE alumni_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view alumni stories"
    ON alumni_stories FOR SELECT
    USING (true);

-- ── Seed data (optional) ──
INSERT INTO resources (title, description, file_url, category) VALUES
('NSS Annual Report 2024-25', 'Complete annual report of all NSS activities and achievements.', '/files/annual-report-2024-25.pdf', 'reports'),
('NSS Handbook', 'Official NSS handbook for volunteers and programme officers.', '/files/nss-handbook.pdf', 'guides'),
('Activity Calendar 2025-26', 'Yearly calendar of all planned NSS activities and events.', '/files/activity-calendar-2025-26.pdf', 'calendars'),
('Poster: Swachh Bharat Abhiyan', 'Informational poster on Swachh Bharat campaign.', '/files/swachh-bharat-poster.pdf', 'posters'),
('Blood Donation Camp Flyer', 'Promotional flyer for the annual blood donation drive.', '/files/blood-donation-flyer.pdf', 'posters')
ON CONFLICT DO NOTHING;

INSERT INTO alumni_stories (name, graduation_year, profession, company, photo_url, story_content, linkedin_url) VALUES
('Priya Sharma', 2022, 'Software Engineer', 'Google', 'https://i.pravatar.cc/150?img=1', 'My journey with NSS taught me leadership, empathy, and the importance of giving back. The rural camps and community projects shaped my perspective and helped me grow both personally and professionally. I credit NSS for building the confidence that later helped me succeed in my tech career.', 'https://linkedin.com/in/priya-sharma'),
('Rahul Deshmukh', 2021, 'IAS Officer', 'Government of India', 'https://i.pravatar.cc/150?img=11', 'NSS was the foundation of my public service journey. The grassroots exposure during NSS camps gave me a real understanding of rural India. Those experiences were instrumental in my UPSC preparation and continue to guide my work as a civil servant.', 'https://linkedin.com/in/rahul-deshmukh'),
('Anjali Patil', 2023, 'Medical Student', 'Seth G.S. Medical College', 'https://i.pravatar.cc/150?img=5', 'Participating in health awareness campaigns and blood donation drives through NSS confirmed my passion for medicine. The organizational skills and community outreach experience I gained are invaluable in my medical training today.', 'https://linkedin.com/in/anjali-patil'),
('Siddharth Joshi', 2020, 'Entrepreneur', 'EcoTech Solutions', 'https://i.pravatar.cc/150?img=12', 'The environmental projects I led with NSS inspired me to start my own clean-tech venture. From tree-plantation drives to waste management initiatives, NSS gave me the hands-on experience and network that became the foundation of EcoTech.', 'https://linkedin.com/in/siddharth-joshi'),
('Neha Kulkarni', 2022, 'PhD Researcher', 'IIT Bombay', 'https://i.pravatar.cc/150?img=9', 'My NSS experience in conducting surveys and analyzing community data sparked my interest in research. The discipline and analytical thinking I developed during my NSS tenure have been crucial to my academic journey.', 'https://linkedin.com/in/neha-kulkarni')
ON CONFLICT DO NOTHING;
