import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { ReviewForm } from '@/components/contracts/ReviewForm'
import { updateContractStatus } from '@/hooks/useContracts'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'
import type { ContractWithRelations } from '@/types/database'

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [contract, setContract] = useState<ContractWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasReview, setHasReview] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchContract = useCallback(async () => {
    if (!id) return
    const { data } = await supabase
      .from('contracts')
      .select('*, service:services(*), client:profiles!contracts_client_id_fkey(*), provider:profiles!contracts_provider_id_fkey(*)')
      .eq('id', id)
      .single()
    setContract(data as unknown as ContractWithRelations)
    setLoading(false)

    const { data: review } = await supabase.from('reviews').select('id').eq('contract_id', id).maybeSingle()
    setHasReview(Boolean(review))
  }, [id])

  useEffect(() => {
    fetchContract()
  }, [fetchContract])

  const handleStatusChange = async (status: ContractWithRelations['status']) => {
    if (!contract) return
    setUpdating(true)
    try {
      await updateContractStatus(contract.id, status)
      toast.success('Status atualizado.')
      fetchContract()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o status.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="py-20 text-center text-muted-foreground">Carregando…</div>
  if (!contract || !user) return <p className="py-20 text-center text-muted-foreground">Contrato não encontrado.</p>

  const isClient = contract.client_id === user.id
  const isProvider = contract.provider_id === user.id

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card className="mb-6">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{contract.service.title}</h1>
            <ContractStatusBadge status={contract.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Cliente: {contract.client.full_name} · Prestador: {contract.provider.full_name}
          </p>
          {contract.price && <p className="font-medium">{formatCurrency(contract.price)}</p>}

          <Separator />

          <div className="flex flex-wrap gap-2">
            {/* Provider actions */}
            {isProvider && contract.status === 'pending' && (
              <>
                <Button size="sm" disabled={updating} onClick={() => handleStatusChange('accepted')}>
                  Aceitar
                </Button>
                <Button size="sm" variant="outline" disabled={updating} onClick={() => handleStatusChange('cancelled')}>
                  Recusar
                </Button>
              </>
            )}
            {isProvider && contract.status === 'accepted' && (
              <Button size="sm" disabled={updating} onClick={() => handleStatusChange('in_progress')}>
                Iniciar serviço
              </Button>
            )}
            {isProvider && contract.status === 'in_progress' && (
              <Button size="sm" disabled={updating} onClick={() => handleStatusChange('awaiting_confirmation')}>
                Concluir serviço
              </Button>
            )}
            {isProvider && contract.status === 'awaiting_confirmation' && (
              <p className="text-sm text-muted-foreground">
                ⏳ Aguardando o cliente confirmar o recebimento.
              </p>
            )}

            {/* Client actions */}
            {isClient && contract.status === 'awaiting_confirmation' && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="text-sm text-muted-foreground">O prestador marcou o serviço como concluído.</p>
                <Button size="sm" disabled={updating} onClick={() => handleStatusChange('completed')}>
                  Confirmar recebimento ✓
                </Button>
              </div>
            )}
            {isClient && ['pending', 'accepted'].includes(contract.status) && (
              <Button size="sm" variant="outline" disabled={updating} onClick={() => handleStatusChange('cancelled')}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ChatWindow
        contractId={contract.id}
        currentUserId={user.id}
        otherUser={isClient ? contract.provider : contract.client}
      />

      {isClient && contract.status === 'completed' && !hasReview && (
        <div className="mt-6">
          <ReviewForm
            contractId={contract.id}
            serviceId={contract.service_id}
            clientId={contract.client_id}
            providerId={contract.provider_id}
            onSubmitted={() => setHasReview(true)}
          />
        </div>
      )}
    </div>
  )
}
