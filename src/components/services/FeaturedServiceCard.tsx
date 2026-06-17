import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin, Sparkles, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCurrency, initialsFromName } from '@/lib/utils'
import type { FeaturedService } from '@/types/database'

const PRICE_TYPE_LABEL: Record<FeaturedService['price_type'], string> = {
  fixed: '',
  hourly: '/hora',
  quote: '',
}

interface FeaturedServiceCardProps {
  service: FeaturedService
  photos?: string[]
}

export function FeaturedServiceCard({ service, photos }: FeaturedServiceCardProps) {
  const allPhotos = photos && photos.length > 0 ? photos : (service.cover_url ? [service.cover_url] : [])
  const [idx, setIdx] = useState(0)
  const total = allPhotos.length
  const src = allPhotos[idx] ?? null

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
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {src ? (
            <img
              src={src}
              alt={service.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">Sem foto</div>
          )}

          {/* Photo navigation arrows — visible on hover, only when multiple photos */}
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
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                {allPhotos.map((_, i) => (
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
          <Badge variant="secondary" className="text-[10px]">
            {service.category_name}
          </Badge>
          <h3 className="line-clamp-1 font-semibold leading-tight">{service.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{service.description}</p>

          <div className="flex items-center gap-2 pt-1">
            <Avatar className="size-6">
              <AvatarImage src={service.provider_avatar ?? undefined} />
              <AvatarFallback className="text-[10px]">{initialsFromName(service.provider_name)}</AvatarFallback>
            </Avatar>
            <span className="line-clamp-1 text-xs text-muted-foreground">{service.provider_name}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            {service.city && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                {service.city}
              </span>
            )}
            <span className="font-semibold text-primary">
              {service.price_type === 'quote' || service.price === null
                ? 'A combinar'
                : `${formatCurrency(service.price)}${PRICE_TYPE_LABEL[service.price_type]}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
