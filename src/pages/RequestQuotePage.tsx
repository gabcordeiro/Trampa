import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CityCombobox } from '@/components/ui/city-combobox'
import { useCategories } from '@/hooks/useCategories'
import { useGeolocation } from '@/hooks/useGeolocation'
import { BR_STATES, useCities } from '@/hooks/useBrazilianLocations'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  category_id: z.string().min(1, 'Selecione uma categoria'),
  title: z.string().min(5, 'Descreva brevemente o que você precisa'),
  description: z.string().min(20, 'Detalhe um pouco mais para receber propostas certeiras'),
  budget_max: z.string().optional(),
  state: z.string().min(2, 'Selecione o estado'),
  city: z.string().min(2, 'Informe a cidade'),
})
type FormValues = z.infer<typeof schema>

export function RequestQuotePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { categories } = useCategories()
  const { lat, lng } = useGeolocation()
  const [submitting, setSubmitting] = useState(false)
  const [selectedState, setSelectedState] = useState<string | null>(null)

  const { cities, loading: citiesLoading } = useCities(selectedState)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const cityValue = watch('city') ?? ''

  if (!user) {
    navigate('/login')
    return null
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const { error } = await supabase.from('quote_requests').insert({
        client_id: user.id,
        category_id: values.category_id,
        title: values.title,
        description: values.description,
        budget_max: values.budget_max ? Number(values.budget_max) : null,
        city: values.city,
        state: values.state,
        lat: lat ?? -23.5505,
        lng: lng ?? -46.6333,
      })
      if (error) throw error
      toast.success('Pedido publicado! Você receberá propostas em breve.')
      navigate('/orcamentos/meus')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao publicar pedido.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Card>
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Megaphone className="size-5" />
          </span>
          <CardTitle>Pedir orçamentos</CardTitle>
          <CardDescription>
            Descreva o que você precisa e receba propostas de prestadores próximos a você.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select onValueChange={(v) => setValue('category_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">O que você precisa?</Label>
              <Input id="title" placeholder="Ex: Pintura de 2 quartos e sala" {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Detalhes</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Quando, tamanho do espaço, materiais, qualquer detalhe que ajude o prestador a dar um preço justo…"
                {...register('description')}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                onValueChange={(v) => {
                  setValue('state', v)
                  setSelectedState(v)
                  setValue('city', '')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado…" />
                </SelectTrigger>
                <SelectContent>
                  {BR_STATES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <CityCombobox
                cities={cities}
                value={cityValue}
                onChange={(v) => setValue('city', v)}
                loading={citiesLoading}
                disabled={!selectedState}
                placeholder={selectedState ? 'Selecione a cidade…' : 'Selecione o estado primeiro'}
              />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="budget_max">Orçamento máx. (R$)</Label>
              <Input id="budget_max" type="number" placeholder="Opcional" {...register('budget_max')} />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Publicando…' : 'Publicar pedido grátis'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
