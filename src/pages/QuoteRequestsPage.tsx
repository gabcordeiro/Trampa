import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, MapPin, MessageSquarePlus, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useGeolocation } from '@/hooks/useGeolocation'
import { formatCurrency, formatDistance } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { NearbyQuoteRequest } from '@/types/database'

export function QuoteRequestsPage() {
  const { lat, lng, loading: locLoading } = useGeolocation()
  const [requests, setRequests] = useState<NearbyQuoteRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (locLoading) return
    supabase
      .rpc('nearby_quote_requests', {
        search_lat: lat ?? -23.5505,
        search_lng: lng ?? -46.6333,
        radius_km: 30,
      })
      .then(({ data }) => {
        setRequests((data as unknown as NearbyQuoteRequest[]) ?? [])
        setLoading(false)
      })
  }, [lat, lng, locLoading])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedidos de orçamento</h1>
          <p className="text-sm text-muted-foreground">
            Clientes próximos procurando prestadores — envie sua proposta.
          </p>
        </div>
        <Button asChild>
          <Link to="/pedir-orcamento">
            <Megaphone /> Pedir orçamento
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center">
          <Megaphone className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum pedido aberto perto de você agora.</p>
          <p className="mt-1 text-sm text-muted-foreground">Volte mais tarde ou aumente o raio de busca.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold leading-tight">{req.title}</h3>
                      {req.category_name && (
                        <Badge variant="secondary">{req.category_name}</Badge>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{req.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {req.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5" /> {req.city}
                          {req.distance_km && ` · ${formatDistance(req.distance_km * 1000)}`}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                      <span className="font-medium text-foreground">
                        {req.quote_count} {req.quote_count === 1 ? 'proposta' : 'propostas'}
                      </span>
                      {req.budget_max && (
                        <span className="font-medium text-primary">
                          Orç. até {formatCurrency(req.budget_max)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" asChild className="shrink-0">
                    <Link to={`/orcamentos/${req.id}`}>
                      <MessageSquarePlus /> Enviar proposta
                    </Link>
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
