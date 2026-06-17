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
  const markersRef = useRef<import('leaflet').Marker[]>([])

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current!, { zoomControl: true }).setView([centerLat, centerLng], 13)
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
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers whenever services change
  useEffect(() => {
    if (!mapRef.current) return

    import('leaflet').then((L) => {
      const map = mapRef.current
      if (!map) return

      // Clear existing service markers
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      const pinIcon = L.divIcon({
        html: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#7c3aed"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
        className: '',
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
              <p class="font-semibold text-sm leading-tight line-clamp-2">${s.title}</p>
              <p class="text-xs text-gray-500">${price}</p>
            </a>
          `)
          const marker = L.marker([s.lat!, s.lng!], { icon: pinIcon }).bindPopup(popup).addTo(map)
          markersRef.current.push(marker)
        })
    })
  }, [services])

  return <div ref={containerRef} className="size-full rounded-xl" />
}
