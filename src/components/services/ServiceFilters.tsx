import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategories } from '@/hooks/useCategories'

interface ServiceFiltersProps {
  categorySlug: string | null
  onCategoryChange: (slug: string | null) => void
  radiusKm: number
  onRadiusChange: (radius: number) => void
}

const RADIUS_OPTIONS = [5, 10, 25, 50, 100]

export function ServiceFilters({
  categorySlug,
  onCategoryChange,
  radiusKm,
  onRadiusChange,
}: ServiceFiltersProps) {
  const { categories } = useCategories()

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={categorySlug ?? 'all'}
        onValueChange={(value) => onCategoryChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-44">
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

      <Select value={String(radiusKm)} onValueChange={(value) => onRadiusChange(Number(value))}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Distância" />
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
  )
}
