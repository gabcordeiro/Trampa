// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const PIXABAY_KEY = '56337945-cb3ebb32f225b8f0dbc993b0a'

// Maps category slug → Pixabay search term
const CATEGORY_KEYWORDS: Record<string, string> = {
  'cleaning':     'house cleaning',
  'plumbing':     'plumber pipe',
  'electrical':   'electrician work',
  'painting':     'house painting',
  'gardening':    'garden landscaping',
  'moving':       'moving boxes',
  'tech-repair':  'computer repair',
  'beauty':       'hair salon',
  'tutoring':     'teacher student',
  'pet-care':     'dog grooming',
  'events':       'party event',
  'other':        'handyman tools',
}

async function fetchPixabayUrls(query: string, count: number): Promise<string[]> {
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=${Math.max(count, 3)}&order=popular`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Pixabay error: ${res.status}`)
  const data = await res.json()
  // previewURL is on cdn.pixabay.com — permanent, no expiry
  return (data.hits ?? []).map((h: { previewURL: string }) => h.previewURL)
}

Deno.serve(async (req) => {
  // Only allow POST with valid service-role key
  const authHeader = req.headers.get('Authorization') ?? ''
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Fetch all services with their category slugs
  const { data: services, error: svcErr } = await supabase
    .from('services')
    .select('id, category_id, categories!inner(slug)')

  if (svcErr) return new Response(JSON.stringify({ error: svcErr.message }), { status: 500 })

  let updated = 0
  let errors = 0

  // Group by category to minimise Pixabay API calls
  const byCat = new Map<string, Array<{ id: string }>>()
  for (const s of services ?? []) {
    const slug = (s as unknown as { categories: { slug: string } }).categories.slug
    if (!byCat.has(slug)) byCat.set(slug, [])
    byCat.get(slug)!.push({ id: s.id })
  }

  for (const [slug, svcs] of byCat) {
    const keyword = CATEGORY_KEYWORDS[slug] ?? 'service work'
    let urls: string[] = []
    try {
      // Fetch enough images: 3 per service
      urls = await fetchPixabayUrls(keyword, svcs.length * 3)
    } catch {
      errors++
      continue
    }

    for (let i = 0; i < svcs.length; i++) {
      const svcId = svcs[i].id
      // 3 photos per service, cycling through available URLs
      const photos = [0, 1, 2].map((pos) => ({
        service_id: svcId,
        url: urls[(i * 3 + pos) % urls.length] ?? urls[0],
        position: pos,
      }))

      // Delete old photos and insert new ones
      await supabase.from('service_photos').delete().eq('service_id', svcId)
      const { error: insErr } = await supabase.from('service_photos').insert(photos)
      if (insErr) { errors++; continue }
      updated++
    }
  }

  return new Response(JSON.stringify({ updated, errors }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
