import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin, Sparkles, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDistance } from '@/lib/utils'
import type { NearbyService } from '@/types/database'

interface ServiceCardProps {
  service: NearbyService
  categoryName?: string
  photos: string[]
  layout?: 'grid' | 'list'
}

const PRICE_TYPE_LABEL: Record<NearbyService['price_type'], string> = {
  fixed: '',
  hourly: '/hora',
  quote: '',
}

function PhotoArea({
  photos,
  title,
  layout,
}: {
  photos: string[]
  title: string
  layout: 'grid' | 'list'
}) {
  const [idx, setIdx] = useState(0)
  const touchX = useRef<number | null>(null)
  const total = photos.length
  const src = photos[idx] ?? null

  const go = (dir: 1 | -1, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setIdx((i) => (i + dir + total) % total)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null || total <= 1) return
    const diff = touchX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 30) {
      e.preventDefault()
      go(diff > 0 ? 1 : -1)
    }
    touchX.current = null
  }

  const containerClass =
    layout === 'list'
      ? 'relative w-44 sm:w-56 shrink-0 overflow-hidden bg-muted rounded-l-xl'
      : 'relative aspect-[4/3] w-full overflow-hidden bg-muted'

  return (
    <div className={containerClass} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {src ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground text-sm">
          Sem foto
        </div>
      )}

      {total > 1 && (
        <>
          {/* Setas: sempre visíveis em mobile, aparecem no hover em desktop */}
          <button
            onClick={(e) => go(-1, e)}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white transition-opacity opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-black/70 active:scale-95"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={(e) => go(1, e)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white transition-opacity opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-black/70 active:scale-95"
            aria-label="Próxima foto"
          >
            <ChevronRight className="size-4" />
          </button>

          {/* Pontinhos indicadores */}
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 pointer-events-none">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`size-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function ServiceCard({ service, categoryName, photos, layout = 'grid' }: ServiceCardProps) {
  const price =
    service.price_type === 'quote' || service.price === null
      ? 'A combinar'
      : `${formatCurrency(service.price)}${PRICE_TYPE_LABEL[service.price_type]}`

  if (layout === 'list') {
    return (
      <Link to={`/servicos/${service.id}`} className="group block">
        <Card className="overflow-hidden transition-shadow hover:shadow-md">
          <div className="flex h-36 sm:h-40">
            <PhotoArea photos={photos} title={service.title} layout="list" />
            <CardContent className="flex flex-1 flex-col justify-between gap-1 p-3 sm:p-4">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-1 font-semibold leading-tight">{service.title}</h3>
                  {service.is_featured && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <Sparkles className="size-3" /> Destaque
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{service.description}</p>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {service.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px] font-normal">
                        {tag}
                      </Badge>
                    ))}
                    {categoryName && (
                      <Badge variant="secondary" className="text-[10px]">
                        {categoryName}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {formatDistance(service.distance_km * 1000)}
                    </span>
                    {service.rating_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        {service.rating_avg.toFixed(1)} ({service.rating_count})
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-bold text-primary">{price}</span>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    )
  }

  // Grid layout
  return (
    <Link to={`/servicos/${service.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <PhotoArea photos={photos} title={service.title} layout="grid" />
        <CardContent className="space-y-2 p-4">
          <h3 className="line-clamp-1 font-semibold leading-tight">{service.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
          {service.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {service.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {formatDistance(service.distance_km * 1000)}
            </div>
            {categoryName && <Badge variant="secondary">{categoryName}</Badge>}
          </div>
          <div className="flex items-center justify-between">
            <div className="font-semibold text-primary">{price}</div>
            {service.rating_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                {service.rating_avg.toFixed(1)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
