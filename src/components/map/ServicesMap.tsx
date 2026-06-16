import { useMemo, useState } from 'react'
import { Map, Marker, NavigationControl, Popup } from 'react-map-gl/mapbox'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { formatCurrency } from '@/lib/utils'
import type { NearbyService } from '@/types/database'

interface ServicesMapProps {
  services: NearbyService[]
  centerLat: number
  centerLng: number
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

export function ServicesMap({ services, centerLat, centerLng }: ServicesMapProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeService = useMemo(
    () => services.find((service) => service.id === activeId) ?? null,
    [services, activeId],
  )

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-muted text-sm text-muted-foreground">
        Configure VITE_MAPBOX_TOKEN para exibir o mapa.
      </div>
    )
  }

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{ longitude: centerLng, latitude: centerLat, zoom: 12 }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
    >
      <NavigationControl position="top-right" />

      <Marker longitude={centerLng} latitude={centerLat} anchor="center">
        <div className="size-4 rounded-full border-2 border-white bg-blue-500 shadow" />
      </Marker>

      {services
        .filter((service) => service.lat !== null && service.lng !== null)
        .map((service) => (
          <Marker
            key={service.id}
            longitude={service.lng!}
            latitude={service.lat!}
            anchor="bottom"
            onClick={(event) => {
              event.originalEvent.stopPropagation()
              setActiveId(service.id)
            }}
          >
            <MapPin className="size-7 cursor-pointer fill-primary text-primary drop-shadow" />
          </Marker>
        ))}

      {activeService && activeService.lat !== null && activeService.lng !== null && (
        <Popup
          longitude={activeService.lng}
          latitude={activeService.lat}
          anchor="top"
          onClose={() => setActiveId(null)}
          closeOnClick={false}
        >
          <Link to={`/servicos/${activeService.id}`} className="block min-w-40 space-y-1 p-1">
            <p className="line-clamp-1 font-semibold text-sm">{activeService.title}</p>
            <p className="text-xs text-muted-foreground">
              {activeService.price ? formatCurrency(activeService.price) : 'A combinar'}
            </p>
          </Link>
        </Popup>
      )}
    </Map>
  )
}
