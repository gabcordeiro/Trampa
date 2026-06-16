import { cn, getPasswordStrength } from '@/lib/utils'

const COLORS_BY_SCORE = ['bg-border', 'bg-destructive', 'bg-amber-500', 'bg-amber-500', 'bg-success']

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label } = getPasswordStrength(password)

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn('h-1.5 flex-1 rounded-full bg-border', step <= score && COLORS_BY_SCORE[score])}
          />
        ))}
      </div>
      {label && <p className="text-xs text-muted-foreground">Força da senha: {label}</p>}
    </div>
  )
}
