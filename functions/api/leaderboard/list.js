import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../_utils.js';

// Public: top volunteers by approved hours. Only shows name, department,
// and hours — never Aadhar, address, or other sensitive registration
// fields. Uses the service-role key because volunteers/attendance RLS
// intentionally blocks anon reads entirely (they hold PII) — safe here
// ONLY because this code selects exactly 3 non-sensitive columns and
// nothing else, never `select('*')`.
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);

  const { data: attendance, error } = await supabase
    .from('attendance')
    .select('hours_attended, activity:activity_id(activity_type), volunteer:volunteer_id(id, name, department, ref_code, show_on_leaderboard)')
    .eq('status', 'approved');

  if (error) return errorResponse(error.message, 400);

  const totals = {};
  (attendance || []).forEach(a => {
    if (!a.volunteer || a.volunteer.show_on_leaderboard === false) return;
    const id = a.volunteer.id;
    if (!totals[id]) {
      totals[id] = {
        name: a.volunteer.name,
        department: a.volunteer.department,
        hours: 0,
        categories: {}
      };
    }
    const hrs = parseFloat(a.hours_attended) || 0;
    totals[id].hours += hrs;

    if (a.activity && a.activity.activity_type) {
      const cat = a.activity.activity_type;
      totals[id].categories[cat] = (totals[id].categories[cat] || 0) + 1;
    }
  });

  const leaderboard = Object.values(totals)
    .filter(v => v.hours > 0)
    .map(v => {
      const badges = [];
      const cats = v.categories || {};

      // 1. Milestone Level Badge
      if (v.hours >= 120) {
        badges.push({ id: 'centurion', title: 'Centurion Champion', desc: 'Completed 120+ verified community service hours', icon: '👑', color: '#f59e0b' });
      } else if (v.hours >= 80) {
        badges.push({ id: 'gold', title: 'Gold Medalist', desc: 'Completed 80+ verified community service hours', icon: '🥇', color: '#fbbf24' });
      } else if (v.hours >= 50) {
        badges.push({ id: 'silver', title: 'Silver Ribbon', desc: 'Completed 50+ verified community service hours', icon: '🥈', color: '#94a3b8' });
      } else if (v.hours >= 20) {
        badges.push({ id: 'bronze', title: 'Bronze Ribbon', desc: 'Completed 20+ verified community service hours', icon: '🥉', color: '#b45309' });
      } else {
        badges.push({ id: 'initiate', title: 'NSS Initiate', desc: 'Began their volunteer journey', icon: '🌱', color: '#10b981' });
      }

      // 2. Specialty Badges
      const envCount = (cats.environment || 0) + (cats.drive || 0);
      if (envCount >= 2) {
        badges.push({ id: 'eco', title: 'Eco Warrior', desc: 'Participated in 2+ environment or cleanliness drives', icon: '🌳', color: '#22c55e' });
      }
      
      const healthCount = cats.health || 0;
      if (healthCount >= 2) {
        badges.push({ id: 'lifesaver', title: 'Lifesaver', desc: 'Participated in 2+ blood donation or health camps', icon: '❤️', color: '#ef4444' });
      }

      const advCount = (cats.social || 0) + (cats.national || 0) + (cats.awareness || 0);
      if (advCount >= 2) {
        badges.push({ id: 'advocate', title: 'Social Advocate', desc: 'Participated in 2+ national awareness, rallies or social events', icon: '📢', color: '#3b82f6' });
      }

      const campCount = cats.camp || 0;
      if (campCount >= 1) {
        badges.push({ id: 'camp', title: 'Camp Veteran', desc: 'Successfully completed at least one NSS Special Camp', icon: '🏕️', color: '#ec4899' });
      }

      const skillCount = (cats.workshop || 0) + (cats.education || 0);
      if (skillCount >= 2) {
        badges.push({ id: 'skill', title: 'Skill Master', desc: 'Participated in 2+ workshops or educational sessions', icon: '🎓', color: '#8b5cf6' });
      }

      return {
        name: v.name,
        department: v.department,
        hours: v.hours,
        badges
      };
    })
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 50);

  return jsonResponse({ leaderboard });
}
