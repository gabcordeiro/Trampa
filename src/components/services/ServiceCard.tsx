import { useState } from 'react'
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
}

const PRICE_TYPE_LABEL: Record<NearbyService['price_type'], string> = {
  fixed: '',
  hourly: '/hora',
  quote: '',
}

export function ServiceCard({ service, categoryName, photos }: ServiceCardProps) {
  const [idx, setIdx] = useState(0)
  const total = photos.length
  const src = photos[idx] ?? null

  const prev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIdx((i) => (i - 1 + total) % total)
  }

  const next = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIdx((i) => (i + 1) % total)
  }

  return (
    <Link to={`/servicos/${service.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {src ? (
            <img
              src={src}
              alt={service.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground text-sm">
              Sem foto
            </div>
          )}

          {/* Photo navigation arrows — only show when multiple photos exist */}
          {total > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={next}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                aria-label="Próxima foto"
              >
                <ChevronRight className="size-4" />
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx(i) }}
                    className={`size-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/50'}`}
                    aria-label={`Foto ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {service.is_featured && (
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-sm">
              <Sparkles className="size-3" /> Destaque
            </span>
          )}
          {service.rating_count > 0 && (
            <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold shadow-sm">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {service.rating_avg.toFixed(1)}
              <span className="text-muted-foreground">({service.rating_count})</span>
            </span>
          )}
        </div>

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
            <div className="font-semibold text-primary">
              {service.price_type === 'quote' || service.price === null
                ? 'A combinar'
                : `${formatCurrency(service.price)}${PRICE_TYPE_LABEL[service.price_type]}`}
            </div>
            {service.rating_count >= 10 && (
              <span className="text-[10px] font-medium text-emerald-600">Muito procurado</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
