import { Link } from 'react-router-dom'
import { MapPin, Sparkles, Star } from 'lucide-react'
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

export function FeaturedServiceCard({ service }: { service: FeaturedService }) {
  return (
    <Link to={`/servicos/${service.id}`} className="group block">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {service.cover_url ? (
            <img
              src={service.cover_url}
              alt={service.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">Sem foto</div>
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
