export type QuoteRequestStatus = 'open' | 'closed' | 'cancelled'
export type QuoteStatus = 'pending' | 'accepted' | 'rejected'

export type QuoteRequest = {
  id: string
  client_id: string
  category_id: string | null
  title: string
  description: string
  city: string | null
  state: string | null
  lat: number | null
  lng: number | null
  budget_max: number | null
  status: QuoteRequestStatus
  quote_count: number
  created_at: string
  expires_at: string
}

export type NearbyQuoteRequest = QuoteRequest & {
  category_name: string | null
  distance_km: number
}

export type Quote = {
  id: string
  request_id: string
  provider_id: string
  price: number | null
  message: string
  status: QuoteStatus
  created_at: string
}

export type QuoteWithProvider = Quote & {
  provider: {
    id: string
    full_name: string
    avatar_url: string | null
    rating_avg?: number
    rating_count?: number
  }
}
