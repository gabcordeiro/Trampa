export type ProviderBadge = {
  label: string
  color: string
  minReviews: number
}

export const PROVIDER_BADGES: ProviderBadge[] = [
  { label: 'Diamante', color: 'bg-cyan-500 text-white', minReviews: 100 },
  { label: 'Ouro',     color: 'bg-amber-500 text-white', minReviews: 30 },
  { label: 'Prata',    color: 'bg-slate-400 text-white', minReviews: 10 },
  { label: 'Bronze',   color: 'bg-orange-700 text-white', minReviews: 3 },
  { label: 'Novo',     color: 'bg-muted text-muted-foreground', minReviews: 0 },
]

export function getBadge(ratingCount: number): ProviderBadge {
  return PROVIDER_BADGES.find((b) => ratingCount >= b.minReviews) ?? PROVIDER_BADGES[PROVIDER_BADGES.length - 1]
}

export function isOnline(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return false
  return Date.now() - new Date(lastSeenAt).getTime() < 10 * 60 * 1000 // 10 min
}
