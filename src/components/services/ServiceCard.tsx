import { Link } from 'react-router-dom'
import { MapPin, Sparkles, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDistance } from '@/lib/utils'
import type { NearbyService } from '@/types/database'

interface ServiceCardProps {
  service: NearbyService
  categoryName?: string
  thumbnailUrl?: string | null
}

const PRICE_TYPE_LABEL: Record<NearbyService['price_type'], string> = {
  fixed: '',
  hourly: '/hora',
  quote: '',
}

export function ServiceCard({ service, categoryName, thumbnailUrl }: ServiceCardProps) {
  return (
    <Link to={`/servicos/${service.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={service.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground text-sm">
              Sem foto
            </div>
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
