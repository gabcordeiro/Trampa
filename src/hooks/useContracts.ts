import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ContractStatus, ContractWithRelations } from '@/types/database'

export function useContracts(userId: string | undefined) {
  const [contracts, setContracts] = useState<ContractWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContracts = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('contracts')
      .select('*, service:services(*), client:profiles!contracts_client_id_fkey(*), provider:profiles!contracts_provider_id_fkey(*)')
      .or(`client_id.eq.${userId},provider_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setContracts(data as unknown as ContractWithRelations[])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  return { contracts, loading, error, refetch: fetchContracts }
}

export async function createContract(input: {
  service_id: string
  client_id: string
  provider_id: string
  notes?: string
  scheduled_at?: string
  price?: number
}) {
  const { data, error } = await supabase.from('contracts').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateContractStatus(contractId: string, status: ContractStatus) {
  const { data, error } = await supabase
    .from('contracts')
    .update({ status })
    .eq('id', contractId)
    .select()
    .single()

  if (error) throw error
  return data
}
