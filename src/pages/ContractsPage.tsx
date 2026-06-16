import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge'
import { useContracts } from '@/hooks/useContracts'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'

export function ContractsPage() {
  const { user } = useAuth()
  const { contracts, loading } = useContracts(user?.id)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Meus contratos</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <p className="text-muted-foreground">Você ainda não tem contratos.</p>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => {
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
