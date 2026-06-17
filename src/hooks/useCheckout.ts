import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type CheckoutType = 'pro' | 'boost'

export function useCheckout() {
  const [loading, setLoading] = useState(false)

  const startCheckout = async (type: CheckoutType, serviceId?: string) => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Você precisa estar logado.')

      const returnUrl = `${window.location.origin}/painel`
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { type, service_id: serviceId, return_url: returnUrl },
      })

      if (error || !data?.url) throw new Error(error?.message ?? 'Erro ao criar sessão de pagamento.')
      window.location.href = data.url
    } catch (err) {
      setLoading(false)
      throw err
    }
  }

  return { startCheckout, loading }
}
