import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { NearbyService } from '@/types/database'

export interface ExploreFilters {
  lat: number
  lng: number
  radiusKm: number
  categorySlug: string | null
  state: string | null
  minPrice: number | null
  maxPrice: number | null
  minRating: number
  query: string
}

function applyClientFilters(services: NearbyService[], filters: ExploreFilters): NearbyService[] {
  return services.filter((s) => {
    if (filters.minPrice !== null && (s.price === null || s.price < filters.minPrice)) return false
    if (filters.maxPrice !== null && (s.price === null || s.price > filters.maxPrice)) return false
    if (filters.minRating > 0 && s.rating_avg < filters.minRating) return false
    if (filters.query.trim()) {
      const q = filters.query.trim().toLowerCase()
      if (!s.title.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false
    }
    return true
  })
}

async function fetchPhotos(ids: string[]): Promise<Record<string, string[]>> {
  const { data } = await supabase
    .from('service_photos')
    .select('service_id, url, position')
    .in('service_id', ids)
    .order('position', { ascending: true })

  const map: Record<string, string[]> = {}
  for (const row of data ?? []) {
    if (!map[row.service_id]) map[row.service_id] = []
    map[row.service_id].push(row.url)
  }
  return map
}

export function useExploreServices(filters: ExploreFilters) {
  const [services, setServices] = useState<NearbyService[]>([])
  const [photos, setPhotos] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)

    let filtered: NearbyService[] = []

    if (filters.state) {
      let query = supabase
        .from('services')
        .select('id, provider_id, category_id, title, description, price, price_type, city, state, lat, lng, rating_avg, rating_count, tags, is_featured')
        .eq('state', filters.state)
        .eq('status', 'approved')

      if (filters.categorySlug) {
        const { data: catData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', filters.categorySlug)
          .single()
        if (catData) query = query.eq('category_id', catData.id)
      }

      const { data, error } = await query.limit(200)
      if (!error) {
        const mapped = ((data ?? []) as unknown as NearbyService[]).map((row) => ({
          ...row,
          distance_km: 0,
        }))
        filtered = applyClientFilters(mapped, filters)
      }
    } else {
      const { data, error } = await supabase.rpc('nearby_services', {
        search_lat: filters.lat,
        search_lng: filters.lng,
        radius_km: filters.radiusKm,
        category_slug: filters.categorySlug ?? null,
      })
      if (!error) {
        filtered = applyClientFilters(data ?? [], filters)
      }
    }

    // Fetch services and their photos before showing anything — no "Sem foto" flash
    const photoMap = filtered.length > 0 ? await fetchPhotos(filtered.map((s) => s.id)) : {}

    setServices(filtered)
    setPhotos(photoMap)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.lat, filters.lng, filters.radiusKm, filters.categorySlug, filters.state, filters.minPrice, filters.maxPrice, filters.minRating, filters.query])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { services, photos, loading }
}
