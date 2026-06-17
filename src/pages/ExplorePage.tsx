import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { LayoutGrid, LayoutList, List, MapIcon, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ServiceCard } from '@/components/services/ServiceCard'
import { ServiceFilters } from '@/components/services/ServiceFilters'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useExploreServices, type ExploreFilters } from '@/hooks/useExploreServices'
import { useCategories } from '@/hooks/useCategories'
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
  const [view, setView] = useState<'list' | 'map'>('list')
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('list')
  const [sort, setSort] = useState<SortOption>('relevance')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  // Default to São Paulo so map + RPC work immediately before geolocation resolves
  const [filters, setFilters] = useState<ExploreFilters>({
    lat: -23.5505,
    lng: -46.6333,
    radiusKm: 25,
    categorySlug: null,
    state: null,
    minPrice: null,
    maxPrice: null,
    minRating: 0,
    query: '',
  })

  const { lat, lng, loading: locationLoading } = useGeolocation()
  const { categories } = useCategories()
  const { services, photos, loading } = useExploreServices(filters)

  // Update lat/lng in filters when geolocation resolves
  useEffect(() => {
    if (lat !== null && lng !== null) {
      setFilters((prev) => ({ ...prev, lat, lng }))
    }
  }, [lat, lng])

  // Debounce search input 300ms before applying to filters
  useEffect(() => {
    const t = setTimeout(() => setFilters(f => ({ ...f, query: searchInput })), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  const sortedServices = useMemo(() => sortServices(services, sort), [services, sort])

  // Reset to page 0 when filters or sort change
  useEffect(() => { setPage(0) }, [filters, sort, displayMode])


  const totalPages = Math.ceil(sortedServices.length / PAGE_SIZE)
  const pagedServices = sortedServices.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const resultsSubtitle = locationLoading
    ? 'Localizando você…'
    : filters.state
    ? `${services.length} resultados`
    : `${services.length} resultados perto de você`

  const emptyMessage =
    filters.state
      ? 'Nenhum serviço encontrado nesse estado. Tente outra categoria ou estado.'
      : 'Nenhum serviço encontrado nessa região. Tente aumentar o raio de busca.'

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Page header */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Explorar serviços</h1>
          <p className="text-sm text-muted-foreground">{resultsSubtitle}</p>
        </div>
        {/* Mobile controls row */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-1"
          >
            <SlidersHorizontal className="size-4" />
            Filtros
          </Button>
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <Button
              size="sm"
              variant={view === 'list' ? 'default' : 'ghost'}
              onClick={() => setView('list')}
              className="flex-1"
            >
              <List className="size-4" /> Lista
            </Button>
            <Button
              size="sm"
              variant={view === 'map' ? 'default' : 'ghost'}
              onClick={() => setView('map')}
              className="flex-1"
            >
              <MapIcon className="size-4" /> Mapa
            </Button>
          </div>
        </div>
      </div>

      {/* Search bar — full width, above the main 3-column layout */}
      <div className="relative mb-6 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9 pr-10"
            placeholder="Pesquisar por serviço…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main layout: sidebar + results + map */}
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0">
          <div className="rounded-lg border border-border bg-card p-4 sticky top-20">
            <ServiceFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </aside>

        {/* Results column */}
        <div className="min-w-0 flex-1">
          {/* Sort + display mode toggle row */}
          <div className="mb-4 flex items-center justify-between gap-2">
            {/* Display mode toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              <button
                onClick={() => setDisplayMode('list')}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${displayMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Visualização em lista"
              >
                <LayoutList className="size-3.5" /> Lista
              </button>
              <button
                onClick={() => setDisplayMode('grid')}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${displayMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Visualização em grade"
              >
                <LayoutGrid className="size-3.5" /> Grade
              </button>
            </div>

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

          <div className={cn(view === 'map' && 'hidden lg:block')}>
            {loading ? (
              <div className={displayMode === 'list' ? 'flex flex-col gap-3' : 'grid grid-cols-2 gap-4 sm:grid-cols-3'}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className={displayMode === 'list' ? 'h-36 w-full' : 'aspect-[4/3] w-full'} />
                ))}
              </div>
            ) : services.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">{emptyMessage}</p>
            ) : displayMode === 'list' ? (
              <div className="flex flex-col gap-3">
                {pagedServices.map((service) => (
                  <ServiceCard key={service.id} service={service} categoryName={categoryNameById[service.category_id]} photos={photos[service.id] ?? []} layout="list" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {pagedServices.map((service) => (
                  <ServiceCard key={service.id} service={service} categoryName={categoryNameById[service.category_id]} photos={photos[service.id] ?? []} layout="grid" />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                  ← Anterior
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {page + 1} de {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                  Próxima →
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Map column */}
        <div
          className={cn(
            'hidden lg:block w-[420px] shrink-0 h-[calc(100vh-6rem)] sticky top-20',
            view === 'map' && '!block',
          )}
        >
          {lat !== null && lng !== null && (
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <ServicesMap key={`${lat},${lng}`} services={services} centerLat={lat} centerLng={lng} />
            </Suspense>
          )}
        </div>
      </div>

      {/* Mobile map view */}
      {view === 'map' && (
        <div className="lg:hidden mt-4 h-[calc(100vh-12rem)]">
          {lat !== null && lng !== null && (
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <ServicesMap key={`${lat},${lng}`} services={services} centerLat={lat} centerLng={lng} />
            </Suspense>
          )}
        </div>
      )}

      {/* Mobile filters dialog */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filtros</DialogTitle>
          </DialogHeader>
          <ServiceFilters filters={filters} onFiltersChange={setFilters} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
