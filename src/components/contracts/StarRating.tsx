import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: number
  readOnly?: boolean
}

export function StarRating({ value, onChange, size = 18, readOnly = false }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5" role={readOnly ? undefined : 'radiogroup'}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={cn('transition-transform', !readOnly && 'cursor-pointer hover:scale-110')}
          aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            className={cn(star <= value ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground')}
          />
        </button>
      ))}
    </div>
  )
}
