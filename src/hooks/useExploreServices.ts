import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { NearbyService } from '@/types/database'

export interface ExploreFilters {
  lat: number
  lng: number
  radiusKm: number
  categorySlug: string | null
  state: string | null        // BR state abbreviation, e.g. "SP"
  minPrice: number | null
  maxPrice: number | null
  minRating: number           // 0 = any
}

function applyClientFilters(services: NearbyService[], filters: ExploreFilters): NearbyService[] {
  return services.filter((s) => {
    if (filters.minPrice !== null && (s.price === null || s.price < filters.minPrice)) return false
    if (filters.maxPrice !== null && (s.price === null || s.price > filters.maxPrice)) return false
    if (filters.minRating > 0 && s.rating_avg < filters.minRating) return false
    return true
  })
}

export function useExploreServices(filters: ExploreFilters) {
  const [services, setServices] = useState<NearbyService[]>([])
  const [loading, setLoading] = useState(true)

  const fetchServices = useCallback(async () => {
    setLoading(true)

    if (filters.state) {
      // State mode: query services table directly filtered by state
      let query = supabase
        .from('services')
        .select('id, provider_id, category_id, title, description, price, price_type, city, state, lat, lng, rating_avg, rating_count, tags, is_featured')
        .eq('state', filters.state)
        .eq('status', 'approved')

      if (filters.categorySlug) {
        // Join with categories to filter by slug
        const { data: catData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', filters.categorySlug)
          .single()
        if (catData) {
          query = query.eq('category_id', catData.id)
        }
      }

      const { data, error } = await query
      if (error) {
        setLoading(false)
        return
      }

      const mapped = ((data ?? []) as unknown as NearbyService[]).map((row) => ({
        ...row,
        distance_km: 0,
      }))

      setServices(applyClientFilters(mapped, filters))
    } else {
      // Nearby mode: use nearby_services RPC
      const { data, error } = await supabase.rpc('nearby_services', {
        search_lat: filters.lat,
        search_lng: filters.lng,
        radius_km: filters.radiusKm,
        category_slug: filters.categorySlug ?? null,
      })

      if (error) {
        setLoading(false)
        return
      }

      setServices(applyClientFilters(data ?? [], filters))
    }

    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.lat, filters.lng, filters.radiusKm, filters.categorySlug, filters.state, filters.minPrice, filters.maxPrice, filters.minRating])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  return { services, loading }
}
