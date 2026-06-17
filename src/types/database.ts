export type ServiceStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'paused'
export type PriceType = 'fixed' | 'hourly' | 'quote'
export type ContractStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'

export type Plan = 'free' | 'pro'

export type Profile = {
  id: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  phone: string | null
  is_provider: boolean
  city: string | null
  state: string | null
  plan: Plan
  plan_expires_at: string | null
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  slug: string
  name: string
  icon: string
  cover_url: string | null
  created_at: string
}

export type Service = {
  id: string
  provider_id: string
  category_id: string
  title: string
  description: string
  price: number | null
  price_type: PriceType
  status: ServiceStatus
  address: string | null
  city: string | null
  state: string | null
  lat: number | null
  lng: number | null
  rating_avg: number
  rating_count: number
  tags: string[]
  is_featured: boolean
  featured_until: string | null
  created_at: string
  updated_at: string
}

export type ServiceWithRelations = Service & {
  category: Category
  provider: Profile
  photos: ServicePhoto[]
}

export type ServicePhoto = {
  id: string
  service_id: string
  url: string
  position: number
  created_at: string
}

export type Contract = {
  id: string
  service_id: string
  client_id: string
  provider_id: string
  status: ContractStatus
  price: number | null
  notes: string | null
  scheduled_at: string | null
  created_at: string
  updated_at: string
}

export type ContractWithRelations = Contract & {
  service: Service
  client: Profile
  provider: Profile
}

export type Message = {
  id: string
  contract_id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
}

export type Review = {
  id: string
  contract_id: string
  service_id: string
  client_id: string
  provider_id: string
  rating: number
  comment: string | null
  created_at: string
}

export type ReviewWithRelations = Review & {
  client: Profile
}

export type NearbyService = {
  id: string
  provider_id: string
  category_id: string
  title: string
  description: string
  price: number | null
  price_type: PriceType
  city: string | null
  state: string | null
  lat: number | null
  lng: number | null
  rating_avg: number
  rating_count: number
  tags: string[]
  is_featured: boolean
  distance_km: number
}

export type FeaturedService = {
  id: string
  title: string
  description: string
  price: number | null
  price_type: PriceType
  city: string | null
  state: string | null
  rating_avg: number
  rating_count: number
  tags: string[]
  is_featured: boolean
  category_slug: string
  category_name: string
  provider_name: string
  provider_avatar: string | null
  cover_url: string | null
}

type Relationships = {
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string; full_name: string }
        Update: Partial<Profile>
      } & Relationships
      categories: {
        Row: Category
        Insert: Partial<Category>
        Update: Partial<Category>
      } & Relationships
      services: {
        Row: Service
        Insert: Partial<Service> & {
          provider_id: string
          category_id: string
          title: string
          description: string
        }
        Update: Partial<Service>
      } & Relationships
      service_photos: {
        Row: ServicePhoto
        Insert: Partial<ServicePhoto> & { service_id: string; url: string }
        Update: Partial<ServicePhoto>
      } & Relationships
      contracts: {
        Row: Contract
        Insert: Partial<Contract> & { service_id: string; client_id: string; provider_id: string }
        Update: Partial<Contract>
      } & Relationships
      messages: {
        Row: Message
        Insert: Partial<Message> & { contract_id: string; sender_id: string; content: string }
        Update: Partial<Message>
      } & Relationships
      reviews: {
        Row: Review
        Insert: Partial<Review> & {
          contract_id: string
          service_id: string
          client_id: string
          provider_id: string
          rating: number
        }
        Update: Partial<Review>
      } & Relationships
    }
    Views: Record<string, never>
    Functions: {
      nearby_services: {
        Args: { search_lat: number; search_lng: number; radius_km?: number; category_slug?: string | null }
        Returns: NearbyService[]
      }
      featured_services: {
        Args: { limit_count?: number }
        Returns: FeaturedService[]
      }
    }
  }
}
