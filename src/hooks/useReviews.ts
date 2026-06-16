import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ReviewWithRelations } from '@/types/database'

export function useServiceReviews(serviceId: string | undefined) {
  const [reviews, setReviews] = useState<ReviewWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!serviceId) return
    supabase
      .from('reviews')
      .select('*, client:profiles(*)')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews((data ?? []) as unknown as ReviewWithRelations[])
        setLoading(false)
      })
  }, [serviceId])

  return { reviews, loading }
}

export async function createReview(input: {
  contract_id: string
  service_id: string
  client_id: string
  provider_id: string
  rating: number
  comment?: string
}) {
  const { data, error } = await supabase.from('reviews').insert(input).select().single()
  if (error) throw error
  return data
}
