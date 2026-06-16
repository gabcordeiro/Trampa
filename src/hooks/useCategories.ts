import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types/database'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
      .then(({ data }) => {
        setCategories(data ?? [])
        setLoading(false)
      })
  }, [])

  return { categories, loading }
}
