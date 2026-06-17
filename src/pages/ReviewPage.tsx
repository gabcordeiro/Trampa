import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { initialsFromName } from '@/lib/utils'

interface PendingService {
  id: string
  title: string
  description: string
  created_at: string
  provider: { full_name: string; avatar_url: string | null } | null
  category: { name: string } | null
}

export function ReviewPage() {
  const [services, setServices] = useState<PendingService[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchPending = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('services')
      .select(
        '*, provider:profiles!services_provider_id_fkey(full_name, avatar_url), category:categories(name)',
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    setServices((data as unknown as PendingService[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const updateStatus = async (serviceId: string, status: 'approved' | 'rejected') => {
    setActionLoading(serviceId + status)
    await supabase.from('services').update({ status }).eq('id', serviceId)
    setServices((prev) => prev.filter((s) => s.id !== serviceId))
    setActionLoading(null)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Revisar Anúncios</h1>
        {!loading && (
          <Badge variant="accent">
            {services.length} {services.length === 1 ? 'anúncio aguardando revisão' : 'anúncios aguardando revisão'}
          </Badge>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando anúncios pendentes...</p>
      ) : services.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          Nenhum anúncio aguardando revisão.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarImage
                        src={service.provider?.avatar_url ?? undefined}
                        alt={service.provider?.full_name}
                      />
                      <AvatarFallback>
                        {initialsFromName(service.provider?.full_name ?? 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{service.title}</h2>
                        {service.category && (
                          <Badge variant="secondary">{service.category.name}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        por {service.provider?.full_name ?? '—'} &middot;{' '}
                        {new Date(service.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="mt-2 text-sm text-foreground line-clamp-3">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500 text-green-600 hover:bg-green-50"
                      disabled={actionLoading !== null}
                      onClick={() => updateStatus(service.id, 'approved')}
                    >
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                      disabled={actionLoading !== null}
                      onClick={() => updateStatus(service.id, 'rejected')}
                    >
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
