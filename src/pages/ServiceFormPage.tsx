import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, MapPin, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCategories } from '@/hooks/useCategories'
import { useGeolocation } from '@/hooks/useGeolocation'
import {
  createService,
  deleteServicePhoto,
  getServiceWithRelations,
  updateService,
  uploadServicePhoto,
} from '@/hooks/useServices'
import { useAuth } from '@/context/AuthContext'
import type { ServiceWithRelations } from '@/types/database'

const schema = z.object({
  title: z.string().min(5, 'Mínimo de 5 caracteres'),
  description: z.string().min(20, 'Descreva melhor o seu serviço (mín. 20 caracteres)'),
  category_id: z.string().uuid('Selecione uma categoria'),
  price_type: z.enum(['fixed', 'hourly', 'quote']),
  price: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(2, 'Informe a cidade'),
  state: z.string().min(2, 'Informe o estado'),
})

type FormValues = z.infer<typeof schema>

export function ServiceFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { categories } = useCategories()
  const { lat: browserLat, lng: browserLng } = useGeolocation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })
  const [service, setService] = useState<ServiceWithRelations | null>(null)
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { price_type: 'fixed' },
  })

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
      setCoords({ lat: data.lat, lng: data.lng })
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Título</Label>
          <Input id="title" placeholder="Ex: Faxina residencial completa" {...register('title')} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" rows={5} {...register('description')} />
          {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select onValueChange={(value) => setValue('category_id', value)} defaultValue={service?.category_id}>
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
          {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Tipo de preço</Label>
          <RadioGroup
            defaultValue={service?.price_type ?? 'fixed'}
            onValueChange={(value) => setValue('price_type', value as FormValues['price_type'])}
            className="flex gap-4"
          >
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="fixed" /> Valor fixo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="hourly" /> Por hora
            </label>
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="quote" /> A combinar
            </label>
          </RadioGroup>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input id="price" type="number" min="0" step="0.01" placeholder="0,00" {...register('price')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" {...register('city')} />
            {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">Estado</Label>
            <Input id="state" {...register('state')} />
            {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Endereço (opcional)</Label>
          <Input id="address" {...register('address')} />
        </div>

        <Button type="button" variant="outline" onClick={handleUseCurrentLocation}>
          <MapPin /> Usar minha localização atual
        </Button>
        {coords.lat !== null && (
          <p className="text-xs text-muted-foreground">
            Localização definida: {coords.lat.toFixed(4)}, {coords.lng?.toFixed(4)}
          </p>
        )}

        {service && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fotos do portfólio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {service.photos.map((photo) => (
                  <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
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
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {isEditing ? 'Salvar alterações' : 'Publicar anúncio'}
        </Button>
      </form>
    </div>
  )
}
