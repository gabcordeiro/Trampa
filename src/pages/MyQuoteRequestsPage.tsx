import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Megaphone, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import type { QuoteRequest } from '@/types/database'

export function MyQuoteRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<QuoteRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('quote_requests')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRequests((data ?? []) as QuoteRequest[])
        setLoading(false)
      })
  }, [user])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus pedidos</h1>
          <p className="text-sm text-muted-foreground">Acompanhe os orçamentos que você publicou.</p>
        </div>
        <Button asChild>
          <Link to="/pedir-orcamento">
            <Plus /> Novo pedido
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center">
          <Megaphone className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Você ainda não publicou nenhum pedido.</p>
          <Button className="mt-4" asChild>
            <Link to="/pedir-orcamento">Publicar pedido grátis</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{req.title}</h3>
                      <Badge variant={req.status === 'open' ? 'success' : 'secondary'}>
                        {req.status === 'open' ? 'Aberto' : 'Fechado'}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{req.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {req.quote_count} {req.quote_count === 1 ? 'proposta' : 'propostas'}
                      </span>
                      {req.budget_max && (
                        <span className="text-primary">Orç. até {formatCurrency(req.budget_max)}</span>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild className="shrink-0">
                    <Link to={`/orcamentos/${req.id}`}>Ver propostas</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
