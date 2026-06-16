import { Link } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
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
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={service.title}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground text-sm">
              Sem foto
            </div>
          )}
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold leading-tight">{service.title}</h3>
            {service.rating_count > 0 && (
              <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {service.rating_avg.toFixed(1)}
              </span>
            )}
          </div>

          <p className="line-clamp-2 text-sm text-muted-foreground">{service.description}</p>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {formatDistance(service.distance_km * 1000)}
            </div>
            {categoryName && <Badge variant="secondary">{categoryName}</Badge>}
          </div>

          <div className="font-semibold text-primary">
            {service.price_type === 'quote' || service.price === null
              ? 'A combinar'
              : `${formatCurrency(service.price)}${PRICE_TYPE_LABEL[service.price_type]}`}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
