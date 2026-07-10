/*
  SQL schema — run in Supabase SQL Editor:

  CREATE TABLE resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE alumni_stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    graduation_year INT,
    profession TEXT,
    company TEXT,
    photo_url TEXT,
    story_content TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
  ALTER TABLE alumni_stories ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Public can read resources" ON resources FOR SELECT USING (true);
  CREATE POLICY "Public can read alumni_stories" ON alumni_stories FOR SELECT USING (true);
*/

import { createSupabase, jsonResponse, errorResponse } from '../../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabase(env);
  const url = new URL(request.url);
  const category = url.searchParams.get('category');

  let query = supabase.from('resources').select('*', { count: 'exact' });
  if (category) query = query.eq('category', category);
  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ resources: data, count });
}
