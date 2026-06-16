import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Message } from '@/types/database'

export function useMessages(contractId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!contractId) return
    let active = true

    setLoading(true)
    supabase
      .from('messages')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (active) {
          setMessages(data ?? [])
          setLoading(false)
        }
      })

    const channel = supabase
      .channel(`messages:${contractId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `contract_id=eq.${contractId}` },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message])
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [contractId])

  return { messages, loading }
}

export async function sendMessage(contractId: string, senderId: string, content: string) {
  const { error } = await supabase
    .from('messages')
    .insert({ contract_id: contractId, sender_id: senderId, content })

  if (error) throw error
}

export async function markMessagesRead(contractId: string, exceptSenderId: string) {
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('contract_id', contractId)
    .is('read_at', null)
    .neq('sender_id', exceptSenderId)
}
