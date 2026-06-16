import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { List, MapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ServiceCard } from '@/components/services/ServiceCard'
import { ServiceFilters } from '@/components/services/ServiceFilters'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useNearbyServices } from '@/hooks/useServices'
import { useCategories } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { NearbyService } from '@/types/database'

const ServicesMap = lazy(() => import('@/components/map/ServicesMap').then((m) => ({ default: m.ServicesMap })))

type SortOption = 'relevance' | 'rating' | 'price_asc' | 'price_desc' | 'distance'

const SORT_LABELS: Record<SortOption, string> = {
  relevance: 'Relevância',
  rating: 'Melhor avaliados',
  price_asc: 'Menor preço',
  price_desc: 'Maior preço',
  distance: 'Mais próximos',
}

function sortServices(services: NearbyService[], sort: SortOption): NearbyService[] {
  const copy = [...services]
  switch (sort) {
    case 'rating':
      return copy.sort((a, b) => b.rating_avg - a.rating_avg || b.rating_count - a.rating_count)
    case 'price_asc':
      return copy.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
    case 'price_desc':
      return copy.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity))
    case 'distance':
      return copy.sort((a, b) => a.distance_km - b.distance_km)
    default:
      return copy // keep RPC order: featured first, then distance
  }
}

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categorySlug = searchParams.get('categoria')
  const [radiusKm, setRadiusKm] = useState(25)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [sort, setSort] = useState<SortOption>('relevance')
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})

  const { lat, lng, loading: locationLoading } = useGeolocation()
  const { categories } = useCategories()
  const { services, loading } = useNearbyServices({
    lat: lat ?? 0,
    lng: lng ?? 0,
    radiusKm,
    categorySlug,
  })

  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  const sortedServices = useMemo(() => sortServices(services, sort), [services, sort])

  useEffect(() => {
    if (services.length === 0) return
    supabase
      .from('service_photos')
      .select('service_id, url')
      .in('service_id', services.map((service) => service.id))
      .eq('position', 0)
      .then(({ data }) => {
        if (!data) return
        setThumbnails(Object.fromEntries(data.map((row) => [row.service_id, row.url])))
      })
  }, [services])

  const handleCategoryChange = (slug: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (slug) next.set('categoria', slug)
    else next.delete('categoria')
    setSearchParams(next)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Explorar serviços</h1>
          <p className="text-sm text-muted-foreground">
            {locationLoading ? 'Localizando você…' : `${services.length} resultados perto de você`}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border p-1 sm:hidden">
          <Button
            size="sm"
            variant={view === 'list' ? 'default' : 'ghost'}
            onClick={() => setView('list')}
            className="flex-1"
          >
            <List /> Lista
          </Button>
          <Button
            size="sm"
            variant={view === 'map' ? 'default' : 'ghost'}
            onClick={() => setView('map')}
            className="flex-1"
          >
            <MapIcon /> Mapa
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <ServiceFilters
          categorySlug={categorySlug}
          onCategoryChange={handleCategoryChange}
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
        />
        <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
              <SelectItem key={option} value={option}>
                {SORT_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className={cn(view === 'map' && 'hidden sm:block')}>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[4/3] w-full" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              Nenhum serviço encontrado nessa região. Tente aumentar o raio de busca.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {sortedServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  categoryName={categoryNameById[service.category_id]}
                  thumbnailUrl={thumbnails[service.id]}
                />
              ))}
            </div>
          )}
        </div>

        <div className={cn('h-[420px] lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]', view === 'list' && 'hidden sm:block')}>
          {lat !== null && lng !== null && (
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <ServicesMap key={`${lat},${lng}`} services={services} centerLat={lat} centerLng={lng} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
