import { createSupabaseAdmin, jsonResponse, errorResponse } from '../../../_utils.js';

export async function onRequest(context) {
  const { request, env, data: ctxData } = context;

  if (request.method === 'OPTIONS') return jsonResponse(null, 204);
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  try {
    const { diary_id, status, feedback } = await request.json();

    if (!diary_id || !status || !['approved', 'rejected'].includes(status)) {
      return errorResponse('diary_id and status ("approved" or "rejected") are required', 400);
    }

    const supabase = createSupabaseAdmin(env);

    // 1. Fetch the diary entry
    const { data: diary, error: fetchErr } = await supabase
      .from('camp_diaries')
      .select('*, volunteer:volunteer_id(name), activity:activity_id(title)')
      .eq('id', diary_id)
      .maybeSingle();

    if (fetchErr) return errorResponse(fetchErr.message, 400);
    if (!diary) return errorResponse('Diary entry not found', 404);

    if (diary.status === 'approved') {
      return errorResponse('This diary entry has already been approved.', 400);
    }

    // 2. Update the diary entry status
    const { data: updatedDiary, error: updateErr } = await supabase
      .from('camp_diaries')
      .update({
        status,
        admin_feedback: feedback || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', diary_id)
      .select()
      .single();

    if (updateErr) return errorResponse(updateErr.message, 400);

    const activityTitle = diary.activity ? diary.activity.title : 'Special Camp';

    if (status === 'approved') {
      // 3. Create approved attendance record
      const attendanceInsert = {
        volunteer_id: diary.volunteer_id,
        activity_id: diary.activity_id,
        status: 'approved',
        hours_attended: parseFloat(diary.hours_spent) || 8.00,
        remarks: `Camp Diary Day ${diary.day_number} Approved`,
        photo_url: diary.photo_url || null,
        submitted_at: diary.created_at,
        approved_by: ctxData.admin.userId,
        approved_at: new Date().toISOString(),
      };

      const { error: attErr } = await supabase
        .from('attendance')
        .insert(attendanceInsert);

      if (attErr) {
        // Rollback diary status if attendance insert fails
        await supabase
          .from('camp_diaries')
          .update({ status: 'pending', admin_feedback: null })
          .eq('id', diary_id);

        return errorResponse(`Failed to record attendance: ${attErr.message}`, 400);
      }

      // 4. Send approval notification
      const notificationMsg = `Your Camp Diary for Day ${diary.day_number} (${activityTitle}) was approved (${diary.hours_spent} hrs).`;
      await supabase.from('notifications').insert({
        volunteer_id: diary.volunteer_id,
        message: notificationMsg,
        link: 'volunteer-dashboard.html',
      });

    } else {
      // 5. Send rejection notification
      const reasonStr = feedback ? ` Reason: ${feedback}` : '';
      const notificationMsg = `Your Camp Diary for Day ${diary.day_number} (${activityTitle}) was rejected.${reasonStr}`;
      await supabase.from('notifications').insert({
        volunteer_id: diary.volunteer_id,
        message: notificationMsg,
        link: 'volunteer-dashboard.html',
      });
    }

    return jsonResponse({ message: `Diary entry was successfully ${status}.`, diary: updatedDiary });
  } catch (e) {
    return errorResponse(e.message, 500);
  }
}
