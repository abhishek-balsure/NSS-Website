-- ============================================
-- Add Hindi/Marathi names for annual activities
-- So the Activities page can be rendered fully from
-- the database (single source of truth) and still
-- show the regional sub-titles. Safe to re-run.
-- ============================================

ALTER TABLE activities ADD COLUMN IF NOT EXISTS hindi_name TEXT;

UPDATE activities AS a
SET hindi_name = v.hindi
FROM (VALUES
  ('National Youth Day', 'राष्ट्रीय युवा दिवस'),
  ('National Youth Week', 'राष्ट्रीय युवा सप्ताह'),
  ('World Understanding Day', 'जागतिक सामंजस्य दिन'),
  ('Republic Day', 'प्रजासत्ताक दिन'),
  ('Martyr''s Day', 'शहीद दिवस'),
  ('University Foundation Day', 'विद्यापीठ वर्धापन दिन'),
  ('Women''s Day', 'महिला दिन'),
  ('World Forest Day', 'जागतिक वन दिन'),
  ('World Health Day', 'जागतिक आरोग्य दिन'),
  ('Fire Prevention Day', 'अग्निपासून बचाव दिन'),
  ('World Labour Day', 'जागतिक कामगार दिन'),
  ('Maharashtra Day', 'महाराष्ट्र दिन'),
  ('Nutrition Week', 'आहार सप्ताह'),
  ('World Environment Day', 'जागतिक पर्यावरण दिन'),
  ('Banamahotsav Week', 'वनमहोत्सव सप्ताह'),
  ('World Population Day', 'जागतिक लोकसंख्या दिन'),
  ('Campaign Against Nuclear Weapons', 'अणुशस्त्र विरोध दिवस'),
  ('Independence Day', 'स्वातंत्र दिन'),
  ('Teacher''s Day', 'शिक्षक दिन'),
  ('International Literacy Day-Week', 'आंतरराष्ट्रीय साक्षरता दिन'),
  ('N.S.S. Foundation Day', 'रा.से.यो. वर्धापन दिन'),
  ('Gandhi Jayanti', 'गांधी जयंती'),
  ('World Food Day', 'जागतिक अन्नधान्य / आहार दिन'),
  ('U.N.O. Day', 'यु.नो. दिवस'),
  ('Traffic Week', 'वाहतूक सप्ताह'),
  ('Savings Day', 'बचत दिवस'),
  ('National Integration Day', 'राष्ट्रीय एकात्मता दिन'),
  ('Children''s Day', 'बाल दिन'),
  ('Mother''s Day', 'माता दिन'),
  ('Quami Ekta Week', 'कौमी एकता दिन'),
  ('Environment Awareness Month', 'पर्यावरण जनजागृती मास'),
  ('Weaker''s Section Day', 'दुर्बल घटक दिन'),
  ('World AIDS Day', 'जागतिक एड्स दिन'),
  ('International Volunteers Day', 'आंतरराष्ट्रीय स्वयंसेवक दिन'),
  ('Human Rights Day', 'मानव अधिकार दिन')
) AS v(title, hindi)
WHERE a.title = v.title;
