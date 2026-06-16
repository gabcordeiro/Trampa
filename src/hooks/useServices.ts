import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { FeaturedService, NearbyService, Service, ServicePhoto, ServiceWithRelations } from '@/types/database'

export function useFeaturedServices(limit = 8) {
  const [services, setServices] = useState<FeaturedService[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .rpc('featured_services', { limit_count: limit })
      .then(({ data }) => {
        setServices(data ?? [])
        setLoading(false)
      })
  }, [limit])

  return { services, loading }
}

interface NearbyFilters {
  lat: number
  lng: number
  radiusKm?: number
  categorySlug?: string | null
}

export function useNearbyServices({ lat, lng, radiusKm = 25, categorySlug }: NearbyFilters) {
  const [services, setServices] = useState<NearbyService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('nearby_services', {
      search_lat: lat,
      search_lng: lng,
      radius_km: radiusKm,
      category_slug: categorySlug ?? null,
    })
    if (error) setError(error.message)
    else setServices(data ?? [])
    setLoading(false)
  }, [lat, lng, radiusKm, categorySlug])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  return { services, loading, error, refetch: fetchServices }
}

export async function getServiceWithRelations(serviceId: string): Promise<ServiceWithRelations | null> {
  const { data, error } = await supabase
    .from('services')
    .select('*, category:categories(*), provider:profiles(*), photos:service_photos(*)')
    .eq('id', serviceId)
    .order('position', { referencedTable: 'service_photos', ascending: true })
    .single()

  if (error) return null
  return data as unknown as ServiceWithRelations
}

export async function getMyServices(providerId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export interface ServiceInput {
  title: string
  description: string
  category_id: string
  price: number | null
  price_type: 'fixed' | 'hourly' | 'quote'
  address: string | null
  city: string | null
  state: string | null
  lat: number | null
  lng: number | null
}

export async function createService(providerId: string, input: ServiceInput): Promise<Service> {
  const { data, error } = await supabase
    .from('services')
    .insert({ ...input, provider_id: providerId, status: 'pending' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateService(serviceId: string, input: Partial<ServiceInput>): Promise<Service> {
  const { data, error } = await supabase
    .from('services')
    .update(input)
    .eq('id', serviceId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteService(serviceId: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', serviceId)
  if (error) throw error
}

export async function uploadServicePhoto(serviceId: string, file: File, position: number): Promise<ServicePhoto> {
  const ext = file.name.split('.').pop()
  const path = `${serviceId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage.from('service-photos').upload(path, file)
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from('service-photos').getPublicUrl(path)

  const { data, error } = await supabase
    .from('service_photos')
    .insert({ service_id: serviceId, url: urlData.publicUrl, position })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteServicePhoto(photoId: string): Promise<void> {
  const { error } = await supabase.from('service_photos').delete().eq('id', photoId)
  if (error) throw error
}
