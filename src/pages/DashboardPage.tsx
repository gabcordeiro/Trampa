import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { deleteService, getMyServices } from '@/hooks/useServices'
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

export function DashboardPage() {
  const { profile } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

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
      setServices((current) => current.filter((service) => service.id !== serviceId))
      toast.success('Anúncio excluído.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus anúncios</h1>
        <Button asChild>
          <Link to="/painel/anuncios/novo">
            <Plus /> Novo anúncio
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <p className="text-muted-foreground">Você ainda não publicou nenhum anúncio.</p>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-semibold">{service.title}</h3>
                    <Badge variant={service.status === 'approved' ? 'success' : 'secondary'}>
                      {STATUS_LABEL[service.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {service.price ? formatCurrency(service.price) : 'A combinar'}
                  </p>
                </div>
                <div className="flex gap-2">
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
          ))}
        </div>
      )}
    </div>
  )
}
