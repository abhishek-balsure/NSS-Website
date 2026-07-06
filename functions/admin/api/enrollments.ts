import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

type Env = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('/admin/api/enrollments', cors())

// GET /admin/api/enrollments — list all with optional search
app.get('/admin/api/enrollments', async (c) => {
  try {
    const search = c.req.query('search') || ''
    const limit = Math.min(Number(c.req.query('limit')) || 100, 500)
    const offset = Number(c.req.query('offset')) || 0

    let url = `${c.env.SUPABASE_URL}/rest/v1/enrollments?order=created_at.desc&limit=${limit}&offset=${offset}`

    if (search) {
      const q = encodeURIComponent(search)
      url += `&or=(name.ilike.*${q}*,email.ilike.*${q}*,ref_code.ilike.*${q}*,department.ilike.*${q}*,mobile_no.ilike.*${q}*)`
    }

    const res = await fetch(url, {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_KEY}`
      }
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('Supabase error:', res.status, errBody)
      return c.json({ error: 'Failed to fetch enrollments.' }, 502)
    }

    const data = await res.json()
    return c.json({ data, count: data.length })
  } catch (err) {
    console.error('Server error:', err)
    return c.json({ error: 'Internal server error.' }, 500)
  }
})

// GET /admin/api/enrollments/stats — aggregate stats
app.get('/admin/api/enrollments/stats', async (c) => {
  try {
    const url = `${c.env.SUPABASE_URL}/rest/v1/enrollments?select=ref_code&limit=1000`
    const res = await fetch(url, {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_KEY}`
      }
    })

    if (!res.ok) {
      return c.json({ error: 'Failed to fetch stats.' }, 502)
    }

    const data = await res.json()

    const departments: Record<string, number> = {}
    data.forEach((r: { department: string }) => {
      departments[r.department] = (departments[r.department] || 0) + 1
    })

    return c.json({ total: data.length, departments })
  } catch (err) {
    console.error('Stats error:', err)
    return c.json({ error: 'Internal server error.' }, 500)
  }
})

export const onRequest = handle(app)
