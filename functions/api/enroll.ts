import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

type Env = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

type FormData = {
  Name: string; ParentName: string; DOB: string; Gender: string
  BloodGroup: string; Cast: string; AadharNo: string
  Department: string; AcademicYear: string; Class: string; RollNo: string; Eligibility: string
  Email: string; MobileNo: string; EmergencyNo: string; EmergencyRelation: string; Address: string
  Interest: string; PrevNSS: string; TShirtSize: string; Medical: string
  refCode: string; timestamp: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('/api/enroll', cors())

app.post('/api/enroll', async (c) => {
  try {
    const body: FormData = await c.req.json()

    const required = [
      'Name','ParentName','DOB','Gender','BloodGroup','Cast','AadharNo',
      'Department','AcademicYear','Class','RollNo','Eligibility',
      'Email','MobileNo','EmergencyNo','EmergencyRelation','Address',
      'Interest','PrevNSS','TShirtSize'
    ] as const

    for (const field of required) {
      if (!body[field as keyof FormData]?.trim()) {
        return c.json({ error: `Missing required field: ${field}` }, 400)
      }
    }

    const refCode = 'SRH-NSS-' + (body.AcademicYear?.split('-')[0] || '2026') + '-' + Math.floor(1000 + Math.random() * 9000)

    const payload = {
      name: body.Name,
      parent_name: body.ParentName,
      dob: body.DOB,
      gender: body.Gender,
      blood_group: body.BloodGroup,
      cast_category: body.Cast,
      aadhar_no: body.AadharNo.replace(/\s/g, ''),
      department: body.Department,
      academic_year: body.AcademicYear,
      class: body.Class,
      roll_no: body.RollNo,
      eligibility: body.Eligibility,
      email: body.Email,
      mobile_no: body.MobileNo,
      emergency_no: body.EmergencyNo,
      emergency_rel: body.EmergencyRelation,
      address: body.Address,
      interest_area: body.Interest,
      prev_nss: body.PrevNSS,
      tshirt_size: body.TShirtSize,
      medical: body.Medical || 'None',
      ref_code: refCode,
      timestamp: new Date().toISOString()
    }

    const res = await fetch(`${c.env.SUPABASE_URL}/rest/v1/enrollments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('Supabase error:', res.status, errBody)
      return c.json({ error: 'Failed to save enrollment. Please try again.' }, 502)
    }

    return c.json({ success: true, refCode })
  } catch (err) {
    console.error('Server error:', err)
    return c.json({ error: 'Internal server error.' }, 500)
  }
})

export const onRequest = handle(app)
