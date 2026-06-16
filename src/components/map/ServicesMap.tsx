import { useEffect, useRef } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { NearbyService } from '@/types/database'
import 'leaflet/dist/leaflet.css'

interface ServicesMapProps {
  services: NearbyService[]
  centerLat: number
  centerLng: number
}

export function ServicesMap({ services, centerLat, centerLng }: ServicesMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return // already initialised

    let map: import('leaflet').Map

    import('leaflet').then((L) => {
      // Fix Leaflet's default icon paths that break in Vite builds
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      map = L.map(containerRef.current!, { zoomControl: true }).setView([centerLat, centerLng], 13)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // User position marker (blue dot)
      const userIcon = L.divIcon({
        html: '<div class="size-4 rounded-full border-2 border-white bg-blue-500 shadow-md"></div>',
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })
      L.marker([centerLat, centerLng], { icon: userIcon }).addTo(map)

      // Service markers
      const pinIcon = L.divIcon({
        html: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" class="text-primary drop-shadow"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
        className: 'text-primary',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      })

      services
        .filter((s) => s.lat !== null && s.lng !== null)
        .forEach((s) => {
          const price =
            s.price_type === 'quote' || s.price === null ? 'A combinar' : formatCurrency(s.price)
          const popup = L.popup({ closeButton: true, minWidth: 160 }).setContent(`
            <a href="/servicos/${s.id}" class="block space-y-1 no-underline">
              <p class="font-semibold text-sm leading-tight line-clamp-2 text-foreground">${s.title}</p>
              <p class="text-xs text-muted-foreground">${price}</p>
            </a>
          `)
          L.marker([s.lat!, s.lng!], { icon: pinIcon }).bindPopup(popup).addTo(map)
        })
    })

    return () => {
      map?.remove()
      mapRef.current = null
    }
    // intentionally run once — parent re-mounts on coord change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className="size-full rounded-xl" />
}
