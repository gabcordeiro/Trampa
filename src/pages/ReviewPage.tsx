import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ExternalLink } from 'lucide-react'
import { initialsFromName } from '@/lib/utils'

interface PendingService {
  id: string
  title: string
  description: string
  created_at: string
  provider: { full_name: string; avatar_url: string | null } | null
  category: { name: string } | null
}

interface ServicePhoto {
  id: string
  url: string
  position: number
}

export function ReviewPage() {
  const [services, setServices] = useState<PendingService[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Modal state
  const [selectedService, setSelectedService] = useState<PendingService | null>(null)
  const [photos, setPhotos] = useState<ServicePhoto[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)

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

  const fetchPhotos = async (serviceId: string) => {
    setPhotosLoading(true)
    const { data } = await supabase
      .from('service_photos')
      .select('id, url, position')
      .eq('service_id', serviceId)
      .order('position', { ascending: true })
    setPhotos((data as ServicePhoto[]) ?? [])
    setPhotosLoading(false)
  }

  const openModal = (service: PendingService) => {
    setSelectedService(service)
    setPhotos([])
    fetchPhotos(service.id)
  }

  const closeModal = () => {
    setSelectedService(null)
    setPhotos([])
  }

  const updateStatus = async (serviceId: string, status: 'approved' | 'rejected') => {
    setActionLoading(serviceId + status)
    await supabase.from('services').update({ status }).eq('id', serviceId)
    setServices((prev) => prev.filter((s) => s.id !== serviceId))
    setActionLoading(null)
    if (selectedService?.id === serviceId) {
      closeModal()
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Revisar Anúncios</h1>
        {!loading && (
          <Badge variant="accent">
            {services.length}{' '}
            {services.length === 1 ? 'anúncio aguardando revisão' : 'anúncios aguardando revisão'}
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
                {/* Top section: avatar + info + description */}
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
                  <div className="min-w-0 flex-1">
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
                    <p className="mt-2 line-clamp-3 text-sm text-foreground">
                      {service.description}
                    </p>
                  </div>
                </div>

                {/* Bottom action row */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openModal(service)}>
                    Ver detalhes
                  </Button>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full content preview modal */}
      <Dialog open={selectedService !== null} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
                  {selectedService.title}
                  {selectedService.category && (
                    <Badge variant="secondary">{selectedService.category.name}</Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Provider info */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={selectedService.provider?.avatar_url ?? undefined}
                      alt={selectedService.provider?.full_name}
                    />
                    <AvatarFallback>
                      {initialsFromName(selectedService.provider?.full_name ?? 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedService.provider?.full_name ?? '—'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Enviado em{' '}
                      {new Date(selectedService.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {/* Photos grid */}
                {photosLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando fotos...</p>
                ) : photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {photos.map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.url}
                        alt=""
                        className="aspect-square w-full rounded-md object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma foto enviada.</p>
                )}

                {/* Full description */}
                <div>
                  <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Descrição
                  </h3>
                  <p className="whitespace-pre-line text-sm text-foreground">
                    {selectedService.description}
                  </p>
                </div>

                {/* Link to full listing */}
                <a
                  href={`/servicos/${selectedService.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver anúncio completo
                </a>
              </div>

              <DialogFooter className="flex flex-wrap gap-2 sm:justify-start">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                  disabled={actionLoading !== null}
                  onClick={() => updateStatus(selectedService.id, 'approved')}
                >
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                  disabled={actionLoading !== null}
                  onClick={() => updateStatus(selectedService.id, 'rejected')}
                >
                  Rejeitar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
