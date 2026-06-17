import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useCategories } from '@/hooks/useCategories'
import type { ExploreFilters } from '@/hooks/useExploreServices'

const BR_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
]

const RADIUS_OPTIONS = [5, 10, 25, 50, 100]

interface ServiceFiltersProps {
  filters: ExploreFilters
  onFiltersChange: (filters: ExploreFilters) => void
}

export function ServiceFilters({ filters, onFiltersChange }: ServiceFiltersProps) {
  const { categories } = useCategories()
  const isStateMode = filters.state !== null

  const update = (partial: Partial<ExploreFilters>) => {
    onFiltersChange({ ...filters, ...partial })
  }

  const handleModeChange = (mode: 'nearby' | 'state') => {
    if (mode === 'nearby') {
      update({ state: null })
    } else {
      update({ state: BR_STATES[0].value })
    }
  }

  const handleStarClick = (star: number) => {
    update({ minRating: filters.minRating === star ? 0 : star })
  }

  const handleClear = () => {
    onFiltersChange({
      lat: filters.lat,
      lng: filters.lng,
      radiusKm: 25,
      categorySlug: null,
      state: null,
      minPrice: null,
      maxPrice: null,
      minRating: 0,
      query: filters.query,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Modo de busca */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Modo de busca
        </Label>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={!isStateMode ? 'default' : 'outline'}
            className="flex-1 text-xs"
            onClick={() => handleModeChange('nearby')}
          >
            Perto de mim
          </Button>
          <Button
            size="sm"
            variant={isStateMode ? 'default' : 'outline'}
            className="flex-1 text-xs"
            onClick={() => handleModeChange('state')}
          >
            Por estado
          </Button>
        </div>
      </div>

      <Separator />

      {/* Estado (only in state mode) */}
      {isStateMode && (
        <>
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Estado
            </Label>
            <Select
              value={filters.state ?? ''}
              onValueChange={(value) => update({ state: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {BR_STATES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
        </>
      )}

      {/* Raio de busca (only in nearby mode) */}
      {!isStateMode && (
        <>
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Raio de busca
            </Label>
            <Select
              value={String(filters.radiusKm)}
              onValueChange={(value) => update({ radiusKm: Number(value) })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    Até {option} km
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
        </>
      )}

      {/* Categoria */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Categoria
        </Label>
        <Select
          value={filters.categorySlug ?? 'all'}
          onValueChange={(value) => update({ categorySlug: value === 'all' ? null : value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Preço */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Preço
        </Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="De"
            min={0}
            value={filters.minPrice ?? ''}
            onChange={(e) =>
              update({ minPrice: e.target.value === '' ? null : Number(e.target.value) })
            }
            className="w-full"
          />
          <Input
            type="number"
            placeholder="Até"
            min={0}
            value={filters.maxPrice ?? ''}
            onChange={(e) =>
              update({ maxPrice: e.target.value === '' ? null : Number(e.target.value) })
            }
            className="w-full"
          />
        </div>
      </div>

      <Separator />

      {/* Avaliação mínima */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Avaliação mínima
        </Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              className="rounded p-0.5 transition-colors hover:bg-muted"
              aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
            >
              <Star
                className={`size-6 transition-colors ${
                  star <= filters.minRating
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-muted text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Clear filters */}
      <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handleClear}>
        Limpar filtros
      </Button>
    </div>
  )
}
