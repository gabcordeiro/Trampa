import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge'
import { useContracts } from '@/hooks/useContracts'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'

export function ContractsPage() {
  const { user } = useAuth()
  const { contracts, loading } = useContracts(user?.id)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const displayed = statusFilter === 'all' ? contracts : contracts.filter(c => c.status === statusFilter)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Meus contratos</h1>

      {!loading && (
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">Todos ({contracts.length})</TabsTrigger>
            <TabsTrigger value="pending">Pendente</TabsTrigger>
            <TabsTrigger value="accepted">Aceito</TabsTrigger>
            <TabsTrigger value="in_progress">Em andamento</TabsTrigger>
            <TabsTrigger value="completed">Concluído</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelado</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <p className="text-muted-foreground">
          {statusFilter !== 'all' ? 'Nenhum contrato com este status.' : 'Você ainda não tem contratos.'}
        </p>
      ) : (
        <div className="space-y-3">
          {displayed.map((contract) => {
            const isClient = contract.client_id === user?.id
            const otherParty = isClient ? contract.provider : contract.client
            return (
              <Link key={contract.id} to={`/contratos/${contract.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold">{contract.service.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {isClient ? 'Prestador' : 'Cliente'}: {otherParty.full_name}
                      </p>
                      {contract.price && (
                        <p className="text-sm text-muted-foreground">{formatCurrency(contract.price)}</p>
                      )}
                    </div>
                    <ContractStatusBadge status={contract.status} />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
