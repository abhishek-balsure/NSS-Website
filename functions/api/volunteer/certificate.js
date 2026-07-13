import { createSupabaseAdmin, errorResponse } from '../../_utils.js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const MIN_HOURS_REQUIRED = 10;

export async function onRequest(context) {
  const { request, env, data: ctxData } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405);

  const supabase = createSupabaseAdmin(env);
  const vid = ctxData.volunteer.volunteerId;

  const { data: volunteer, error: volErr } = await supabase
    .from('volunteers').select('name, ref_code, department').eq('id', vid).single();
  if (volErr || !volunteer) return errorResponse('Volunteer not found', 404);

  const { data: approved, error: attErr } = await supabase
    .from('attendance').select('hours_attended').eq('volunteer_id', vid).eq('status', 'approved');
  if (attErr) return errorResponse(attErr.message, 400);

  const totalHours = (approved || []).reduce((sum, a) => sum + (parseFloat(a.hours_attended) || 0), 0);

  if (totalHours < MIN_HOURS_REQUIRED) {
    return errorResponse(
      `You need at least ${MIN_HOURS_REQUIRED} approved hours to generate a certificate. You currently have ${totalHours}.`,
      403
    );
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const navy = rgb(0.12, 0.31, 0.47);
  const gray = rgb(0.3, 0.3, 0.3);

  // Border
  page.drawRectangle({ x: 20, y: 20, width: 802, height: 555, borderColor: navy, borderWidth: 3 });
  page.drawRectangle({ x: 32, y: 32, width: 778, height: 531, borderColor: navy, borderWidth: 1 });

  const centerText = (text, y, size, useFont, color) => {
    const width = useFont.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (842 - width) / 2, y, size, font: useFont, color });
  };

  centerText('CERTIFICATE OF PARTICIPATION', 480, 28, font, navy);
  centerText('National Service Scheme — Sarhad College of Arts, Commerce & Science', 450, 13, fontRegular, gray);

  centerText('This is to certify that', 390, 14, fontItalic, gray);
  centerText(volunteer.name, 350, 26, font, navy);
  centerText(
    `(Ref. Code: ${volunteer.ref_code}${volunteer.department ? ' · ' + volunteer.department : ''})`,
    322, 12, fontRegular, gray
  );

  const bodyText = `has actively participated in NSS volunteer activities, completing a total of`;
  centerText(bodyText, 280, 13, fontRegular, gray);
  centerText(`${totalHours} hours`, 245, 22, font, navy);
  centerText('of verified community service.', 215, 13, fontRegular, gray);

  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  page.drawText(`Issued on: ${dateStr}`, { x: 60, y: 80, size: 11, font: fontRegular, color: gray });
  page.drawText('NSS Program Officer', { x: 650, y: 80, size: 11, font: fontRegular, color: gray });
  page.drawLine({ start: { x: 650, y: 100 }, end: { x: 782, y: 100 }, thickness: 1, color: gray });

  const pdfBytes = await pdfDoc.save();

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="NSS_Certificate_${volunteer.ref_code}.pdf"`,
    },
  });
}
