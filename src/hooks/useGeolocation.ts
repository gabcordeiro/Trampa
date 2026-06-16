import { useEffect, useState } from 'react'

interface GeolocationState {
  lat: number | null
  lng: number | null
  loading: boolean
  error: string | null
}

const DEFAULT_COORDS = { lat: -23.5505, lng: -46.6333 } // Sao Paulo fallback

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ ...DEFAULT_COORDS, loading: false, error: 'Geolocalização não suportada' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          loading: false,
          error: null,
        })
      },
      () => {
        setState({ ...DEFAULT_COORDS, loading: false, error: 'Permissão de localização negada' })
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  return state
}
