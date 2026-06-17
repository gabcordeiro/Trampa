import { useState } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CityComboboxProps {
  cities: string[]
  value: string
  onChange: (value: string) => void
  loading?: boolean
  disabled?: boolean
  placeholder?: string
}

export function CityCombobox({ cities, value, onChange, loading, disabled, placeholder = 'Selecione a cidade…' }: CityComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = cities
    .filter(c => c.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 60)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled || loading}
          className="w-full justify-between font-normal"
        >
          {loading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Carregando cidades…
            </span>
          ) : (
            <span className={cn(!value && 'text-muted-foreground')}>{value || placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="border-b p-2">
          <Input
            autoFocus
            placeholder="Pesquisar cidade…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground text-center">Nenhuma cidade encontrada.</p>
          ) : (
            filtered.map(city => (
              <button
                key={city}
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left',
                  value === city && 'bg-muted font-medium',
                )}
                onClick={() => { onChange(city); setOpen(false); setSearch('') }}
              >
                <Check className={cn('size-4 shrink-0', value === city ? 'opacity-100' : 'opacity-0')} />
                {city}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
