import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check, Loader2, MapPin, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CityCombobox } from '@/components/ui/city-combobox'
import { useCategories } from '@/hooks/useCategories'
import { useGeolocation } from '@/hooks/useGeolocation'
import { BR_STATES, useCities } from '@/hooks/useBrazilianLocations'
import {
  createService,
  deleteServicePhoto,
  getServiceWithRelations,
  updateService,
  uploadServicePhoto,
} from '@/hooks/useServices'
import { useAuth } from '@/context/AuthContext'
import type { ServiceWithRelations } from '@/types/database'

// ─── Steps config ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, name: 'Categoria' },
  { id: 2, name: 'Descrição' },
  { id: 3, name: 'Precificação' },
  { id: 4, name: 'Localização' },
  { id: 5, name: 'Fotos' },
]

// ─── Zod Schema ────────────────────────────────────────────────────────────────
const schema = z
  .object({
    title: z.string().min(5, 'Mínimo de 5 caracteres'),
    category_id: z.string().uuid('Selecione uma categoria'),
    description: z.string().min(20, 'Descreva melhor o seu serviço (mín. 20 caracteres)'),
    tags: z.array(z.string()).optional(),
    price_type: z.enum(['fixed', 'hourly', 'quote']),
    price: z.string().optional(),
    city: z.string().min(2, 'Informe a cidade'),
    state: z.string().min(2, 'Informe o estado'),
    address: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.price_type !== 'quote' && (!data.price || data.price.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o preço',
        path: ['price'],
      })
    }
  })

type FormValues = z.infer<typeof schema>

// Per-step field names used for trigger validation
const STEP_FIELDS: Record<number, (keyof FormValues)[]> = {
  1: ['category_id', 'title'],
  2: ['description'],
  3: ['price_type', 'price'],
  4: ['city', 'state'],
  5: [],
}

// ─── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      {STEPS.map((step, index) => {
        const isCompleted = step.id < currentStep
        const isCurrent = step.id === currentStep
        return (
          <div key={step.id} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* Left connector line */}
              <div
                className={`h-0.5 flex-1 transition-colors ${index === 0 ? 'invisible' : isCompleted || isCurrent ? 'bg-primary' : 'bg-border'}`}
              />
              {/* Circle */}
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                  isCurrent
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className="size-4" /> : step.id}
              </div>
              {/* Right connector line */}
              <div
                className={`h-0.5 flex-1 transition-colors ${index === STEPS.length - 1 ? 'invisible' : isCompleted ? 'bg-primary' : 'bg-border'}`}
              />
            </div>
            <span
              className={`mt-1.5 text-center text-[11px] font-medium leading-tight ${
                isCurrent ? 'text-primary' : isCompleted ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {step.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Tags Input ────────────────────────────────────────────────────────────────
function TagsInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')

  const addTags = (raw: string) => {
    const newTags = raw
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
    const merged = [...new Set([...value, ...newTags])].slice(0, 8)
    onChange(merged)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTags(input)
    }
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 rounded-full hover:bg-muted"
              aria-label={`Remover tag ${tag}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input.trim() && addTags(input)}
        placeholder="Ex: faxina, residencial, limpeza (Enter ou vírgula para adicionar)"
        disabled={value.length >= 8}
      />
      <p className="text-xs text-muted-foreground">{value.length}/8 tags</p>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export function ServiceFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { categories } = useCategories()
  const { lat: browserLat, lng: browserLng } = useGeolocation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })
  const [service, setService] = useState<ServiceWithRelations | null>(null)
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [selectedState, setSelectedState] = useState<string | null>(null)

  const { cities, loading: citiesLoading } = useCities(selectedState)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      price_type: 'fixed',
      tags: [],
    },
  })

  const priceType = watch('price_type')
  const cityValue = watch('city') ?? ''

  useEffect(() => {
    if (!id) return
    getServiceWithRelations(id).then((data) => {
      if (!data) return
      setService(data)
      setValue('title', data.title)
      setValue('description', data.description)
      setValue('category_id', data.category_id)
      setValue('price_type', data.price_type)
      setValue('price', data.price?.toString() ?? '')
      setValue('address', data.address ?? '')
      setValue('city', data.city ?? '')
      setValue('state', data.state ?? '')
      setValue('tags', data.tags ?? [])
      setCoords({ lat: data.lat, lng: data.lng })
      if (data.state) setSelectedState(data.state)
      setLoading(false)
    })
  }, [id, setValue])

  const handleUseCurrentLocation = () => {
    if (browserLat === null || browserLng === null) {
      toast.error('Não conseguimos obter sua localização.')
      return
    }
    setCoords({ lat: browserLat, lng: browserLng })
    toast.success('Localização atual aplicada ao anúncio.')
  }

  const handleNext = async () => {
    const fields = STEP_FIELDS[currentStep]
    const valid = await trigger(fields)
    if (valid) setCurrentStep((s) => Math.min(s + 1, STEPS.length))
  }

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 1))
  }

  const onSubmit = async (values: FormValues) => {
    if (!user) return
    setSubmitting(true)
    try {
      const input = {
        title: values.title,
        description: values.description,
        category_id: values.category_id,
        price: values.price ? Number(values.price) : null,
        price_type: values.price_type,
        address: values.address || null,
        city: values.city,
        state: values.state,
        lat: coords.lat,
        lng: coords.lng,
        tags: values.tags ?? [],
      }

      if (isEditing && id) {
        await updateService(id, input)
        toast.success('Anúncio atualizado!')
        navigate('/painel')
      } else {
        const created = await createService(user.id, input)
        toast.success('Anúncio criado! Adicione fotos do seu portfólio.')
        navigate(`/painel/anuncios/${created.id}/editar`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o anúncio.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !service) return
    setUploadingPhoto(true)
    try {
      const photo = await uploadServicePhoto(service.id, file, service.photos.length)
      setService({ ...service, photos: [...service.photos, photo] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao enviar foto.')
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handlePhotoDelete = async (photoId: string) => {
    if (!service) return
    await deleteServicePhoto(photoId)
    setService({ ...service, photos: service.photos.filter((photo) => photo.id !== photoId) })
  }

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Carregando…</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{isEditing ? 'Editar anúncio' : 'Novo anúncio'}</h1>

      <StepIndicator currentStep={currentStep} />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ── Step 1: Categoria ── */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">O que você oferece?</h2>
              <p className="text-sm text-muted-foreground">Escolha a categoria e dê um título ao seu anúncio.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Título do anúncio</Label>
              <Input id="title" placeholder="Ex: Faxina residencial completa" {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
          </div>
        )}

        {/* ── Step 2: Descrição ── */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Conte mais sobre o serviço</h2>
              <p className="text-sm text-muted-foreground">Uma boa descrição aumenta as chances de contato.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                rows={6}
                placeholder="Descreva o que você oferece, sua experiência, diferenciais..."
                {...register('description')}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Tags</Label>
              <p className="mb-1 text-xs text-muted-foreground">Palavras-chave que ajudam clientes a te encontrar.</p>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => <TagsInput value={field.value ?? []} onChange={field.onChange} />}
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Precificação ── */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Quanto você cobra?</h2>
              <p className="text-sm text-muted-foreground">Defina o tipo de cobrança e o valor do serviço.</p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de preço</Label>
              <Controller
                name="price_type"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-col gap-3 sm:flex-row"
                  >
                    {[
                      { value: 'fixed', label: 'Valor fixo' },
                      { value: 'hourly', label: 'Por hora' },
                      { value: 'quote', label: 'A combinar' },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex flex-1 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                          field.value === opt.value
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <RadioGroupItem value={opt.value} />
                        {opt.label}
                      </label>
                    ))}
                  </RadioGroup>
                )}
              />
              {errors.price_type && <p className="text-xs text-destructive">{errors.price_type.message}</p>}
            </div>

            {priceType !== 'quote' && (
              <div className="space-y-1.5">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input id="price" type="number" min="0" step="0.01" placeholder="0,00" {...register('price')} />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Localização ── */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Onde você atende?</h2>
              <p className="text-sm text-muted-foreground">Informe sua localização para aparecer nas buscas.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="state">Estado</Label>
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v)
                      setSelectedState(v)
                      setValue('city', '')
                    }}
                    value={field.value}
                  >
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Selecione o estado…" />
                    </SelectTrigger>
                    <SelectContent>
                      {BR_STATES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
              <Label htmlFor="address">Endereço (opcional)</Label>
              <Input id="address" placeholder="Ex: Rua das Flores, 123" {...register('address')} />
            </div>

            <div className="space-y-1.5">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleUseCurrentLocation}
              >
                <MapPin className="mr-2 size-4" />
                Usar minha localização atual
              </Button>
              {coords.lat !== null && (
                <p className="text-xs text-muted-foreground">
                  Localização definida: {coords.lat.toFixed(4)}, {coords.lng?.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 5: Fotos ── */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Fotos do portfólio</h2>
              <p className="text-sm text-muted-foreground">Imagens aumentam a credibilidade do seu anúncio.</p>
            </div>

            {service ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fotos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {service.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
                      >
                        <img src={photo.url} alt="" className="size-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handlePhotoDelete(photo.id)}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:bg-muted"
                    >
                      {uploadingPhoto ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
                <Upload className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Você poderá adicionar fotos após salvar o anúncio.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  As fotos serão habilitadas assim que o anúncio for publicado.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="mt-8 flex items-center justify-between gap-4 border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className={currentStep === 1 ? 'invisible' : ''}
          >
            Voltar
          </Button>

          {currentStep < STEPS.length ? (
            <Button type="button" onClick={handleNext}>
              Próximo
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? 'Salvar alterações' : 'Publicar anúncio'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
