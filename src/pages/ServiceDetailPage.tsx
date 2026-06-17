import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { MapPin, Megaphone, Share2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { PhotoLightbox } from '@/components/ui/photo-lightbox'
import { Link } from 'react-router-dom'
import { StarRating } from '@/components/contracts/StarRating'
import { getServiceWithRelations } from '@/hooks/useServices'
import { useServiceReviews } from '@/hooks/useReviews'
import { createContract } from '@/hooks/useContracts'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency, initialsFromName } from '@/lib/utils'
import type { ServiceWithRelations } from '@/types/database'
import { ServiceLocationMap } from '@/components/map/ServiceLocationMap'

const APP_URL = import.meta.env.VITE_APP_URL ?? 'https://trampa-omega.vercel.app'

const PRICE_TYPE_LABEL: Record<string, string> = { fixed: '', hourly: '/hora', quote: '' }

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [service, setService] = useState<ServiceWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [hiring, setHiring] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const { reviews } = useServiceReviews(id)

  useEffect(() => {
    if (!id) return
    getServiceWithRelations(id).then((data) => {
      setService(data)
      setLoading(false)
    })
  }, [id])

  const handleShare = () => {
    const url = `${APP_URL}/servicos/${id}`
    const text = `Confira este serviço na Trampa: ${service?.title}\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleHire = async () => {
    if (!user) { navigate('/login'); return }
    if (!service) return
    if (user.id === service.provider_id) {
      toast.error('Você não pode contratar seu próprio serviço.')
      return
    }
    setHiring(true)
    try {
      const contract = await createContract({
        service_id: service.id,
        client_id: user.id,
        provider_id: service.provider_id,
      })
      toast.success('Solicitação enviada ao prestador!')
      navigate(`/contratos/${contract.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível contratar.')
    } finally {
      setHiring(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!service) {
    return <p className="py-20 text-center text-muted-foreground">Serviço não encontrado.</p>
  }

  const photoUrls = service.photos.map((p) => p.url)
  const total = photoUrls.length

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const goPrev = () => setLightboxIndex((i) => (i === null ? 0 : (i - 1 + total) % total))
  const goNext = () => setLightboxIndex((i) => (i === null ? 0 : (i + 1) % total))

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Photo grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          className="sm:col-span-2 aspect-[4/3] overflow-hidden rounded-xl bg-muted text-left"
          onClick={() => photoUrls.length > 0 && openLightbox(0)}
        >
          {photoUrls[0] ? (
            <img
              src={photoUrls[0]}
              alt={service.title}
              className="size-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">Sem foto</div>
          )}
        </button>

        {service.photos.slice(1).map((photo, i) => (
          <button
            key={photo.id}
            className="aspect-[4/3] overflow-hidden rounded-xl bg-muted text-left"
            onClick={() => openLightbox(i + 1)}
          >
            <img
              src={photo.url}
              alt=""
              className="size-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photoUrls}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{service.category.name}</Badge>
            {service.rating_count > 0 && (
              <span className="flex items-center gap-1 text-sm font-medium">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                {service.rating_avg.toFixed(1)} ({service.rating_count})
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{service.title}</h1>
          {service.city && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {service.city}, {service.state}
            </p>
          )}
          <p className="whitespace-pre-line text-muted-foreground">{service.description}</p>
          {service.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {service.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="w-full shrink-0 space-y-4 rounded-xl border border-border p-5 sm:w-64">
          <div className="text-2xl font-bold text-primary">
            {service.price_type === 'quote' || service.price === null
              ? 'A combinar'
              : `${formatCurrency(service.price)}${PRICE_TYPE_LABEL[service.price_type]}`}
          </div>
          <Button className="w-full" onClick={handleHire} disabled={hiring || profile?.id === service.provider_id}>
            Contratar agora
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
            <Share2 className="size-4" /> Compartilhar no WhatsApp
          </Button>
          <Separator />
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={service.provider.avatar_url ?? undefined} />
              <AvatarFallback>{initialsFromName(service.provider.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{service.provider.full_name}</p>
              <p className="text-xs text-muted-foreground">Prestador</p>
            </div>
          </div>
        </div>
      </div>

      {service.lat !== null && service.lng !== null && (
        <>
          <Separator className="my-6" />
          <div>
            <h2 className="mb-3 text-lg font-semibold">Localização</h2>
            <ServiceLocationMap lat={service.lat} lng={service.lng} title={service.title} />
          </div>
        </>
      )}

      <Separator className="my-8" />

      <div className="mb-8 flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/40 px-5 py-4">
        <div>
          <p className="font-medium">Quer receber propostas de vários prestadores?</p>
          <p className="text-sm text-muted-foreground">Publique um pedido grátis e compare orçamentos.</p>
        </div>
        <Button variant="outline" asChild className="shrink-0 gap-2">
          <Link to="/pedir-orcamento">
            <Megaphone className="size-4" /> Pedir orçamento
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Avaliações ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground">Ainda sem avaliações.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-3">
                <Avatar>
                  <AvatarImage src={review.client.avatar_url ?? undefined} />
                  <AvatarFallback>{initialsFromName(review.client.full_name)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{review.client.full_name}</p>
                  <StarRating value={review.rating} readOnly size={14} />
                  {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
