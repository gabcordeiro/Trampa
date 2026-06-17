import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, Crown, Pencil, Plus, Sparkles, Trash2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { deleteService, getMyServices } from '@/hooks/useServices'
import { useCheckout } from '@/hooks/useCheckout'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'
import type { Service, ServiceStatus } from '@/types/database'

const STATUS_LABEL: Record<ServiceStatus, string> = {
  draft: 'Rascunho',
  pending: 'Em análise',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  paused: 'Pausado',
}

const FREE_LIMIT = 2

export function DashboardPage() {
  const { profile, refreshProfile } = useAuth()
  const [searchParams] = useSearchParams()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [boostingId, setBoostingId] = useState<string | null>(null)
  const { startCheckout, loading: checkoutLoading } = useCheckout()

  const isPro = profile?.plan === 'pro'
  const activeCount = services.filter((s) => s.status !== 'paused' && s.status !== 'rejected').length
  const atFreeLimit = !isPro && activeCount >= FREE_LIMIT

  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout')
    if (checkoutStatus === 'success') {
      const type = searchParams.get('type')
      if (type === 'pro') {
        toast.success('🎉 Bem-vindo ao Plano Pro!')
        refreshProfile()
      } else if (type === 'boost') {
        toast.success('🚀 Anúncio impulsionado por 30 dias!')
      }
    }
  }, [searchParams, refreshProfile])

  useEffect(() => {
    if (!profile) return
    getMyServices(profile.id)
      .then(setServices)
      .finally(() => setLoading(false))
  }, [profile])

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Excluir este anúncio? Esta ação não pode ser desfeita.')) return
    try {
      await deleteService(serviceId)
      setServices((current) => current.filter((s) => s.id !== serviceId))
      toast.success('Anúncio excluído.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir.')
    }
  }

  const handleBoost = async (serviceId: string) => {
    setBoostingId(serviceId)
    try {
      await startCheckout('boost', serviceId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar boost.')
      setBoostingId(null)
    }
  }

  const handleUpgradePro = async () => {
    try {
      await startCheckout('pro')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar.')
    }
  }

  const isBoosted = (s: Service) =>
    s.is_featured || (s.featured_until != null && new Date(s.featured_until) > new Date())

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Meus anúncios</h1>
          {isPro ? (
            <Badge className="gap-1 bg-primary text-primary-foreground">
              <Crown className="size-3" /> Pro
            </Badge>
          ) : (
            <Badge variant="secondary">Free</Badge>
          )}
        </div>
        <Button asChild={!atFreeLimit} disabled={atFreeLimit} onClick={atFreeLimit ? handleUpgradePro : undefined}>
          {atFreeLimit ? (
            <span className="flex items-center gap-1.5"><Crown className="size-3.5" /> Assinar Pro para criar</span>
          ) : (
            <Link to="/painel/anuncios/novo">
              <Plus /> Novo anúncio
            </Link>
          )}
        </Button>
      </div>

      {/* Free-limit upsell banner */}
      {!isPro && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">
                  {atFreeLimit ? 'Você atingiu o limite do plano grátis' : `Plano grátis: ${activeCount}/${FREE_LIMIT} anúncios`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Assine o Pro por R$ 49/mês e tenha anúncios ilimitados + destaque no feed.
                </p>
              </div>
            </div>
            <Button size="sm" className="shrink-0 gap-1" onClick={handleUpgradePro} disabled={checkoutLoading}>
              <Crown className="size-3.5" /> Assinar Pro <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : services.length === 0 ? (
        <div className="py-12 text-center">
          <p className="mb-4 text-muted-foreground">Você ainda não publicou nenhum anúncio.</p>
          <Button asChild>
            <Link to="/painel/anuncios/novo"><Plus /> Criar primeiro anúncio</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => {
            const boosted = isBoosted(service)
            const isBoostingThis = boostingId === service.id
            return (
              <Card key={service.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{service.title}</h3>
                      <Badge variant={service.status === 'approved' ? 'success' : 'secondary'}>
                        {STATUS_LABEL[service.status]}
                      </Badge>
                      {boosted && (
                        <Badge className="gap-1 bg-amber-500 text-white">
                          <Zap className="size-3" /> Impulsionado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {service.price ? formatCurrency(service.price) : 'A combinar'}
                      {service.featured_until && new Date(service.featured_until) > new Date() && (
                        <span className="ml-2 text-amber-600">
                          · Boost até {new Date(service.featured_until).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {service.status === 'approved' && !boosted && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 border-amber-400 text-amber-600 hover:bg-amber-50"
                        onClick={() => handleBoost(service.id)}
                        disabled={isBoostingThis || checkoutLoading}
                      >
                        <Zap className="size-3.5" />
                        {isBoostingThis ? 'Redirecionando…' : 'Impulsionar R$ 19'}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/painel/anuncios/${service.id}/editar`}>
                        <Pencil /> Editar
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(service.id)}>
                      <Trash2 /> Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pricing link at bottom */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link to="/precos" className="text-primary hover:underline">Ver todos os planos →</Link>
      </p>
    </div>
  )
}
