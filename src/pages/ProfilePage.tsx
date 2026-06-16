import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { updateProfile, uploadAvatar } from '@/hooks/useProfile'
import { initialsFromName } from '@/lib/utils'

const schema = z.object({
  full_name: z.string().min(2, 'Informe seu nome'),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isProvider, setIsProvider] = useState(profile?.is_provider ?? false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      bio: profile?.bio ?? '',
      phone: profile?.phone ?? '',
      city: profile?.city ?? '',
      state: profile?.state ?? '',
    },
  })

  if (!profile) return null

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const url = await uploadAvatar(profile.id, file)
      await updateProfile(profile.id, { avatar_url: url })
      await refreshProfile()
      toast.success('Foto atualizada!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao enviar foto.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleProviderToggle = async (checked: boolean) => {
    setIsProvider(checked)
    try {
      await updateProfile(profile.id, { is_provider: checked })
      await refreshProfile()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar.')
    }
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      await updateProfile(profile.id, values)
      await refreshProfile()
      toast.success('Perfil atualizado!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Meu perfil</h1>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <Avatar className="size-20">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-xl">{initialsFromName(profile.full_name)}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
          >
            {uploadingAvatar ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-2">
          <div>
            <p className="text-sm font-medium">Modo prestador</p>
            <p className="text-xs text-muted-foreground">Permite publicar anúncios de serviço</p>
          </div>
          <Switch checked={isProvider} onCheckedChange={handleProviderToggle} />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Nome completo</Label>
          <Input id="full_name" {...register('full_name')} />
          {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Biografia</Label>
          <Textarea id="bio" rows={4} placeholder="Conte um pouco sobre você ou seu trabalho" {...register('bio')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" placeholder="(11) 99999-9999" {...register('phone')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" {...register('city')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">Estado</Label>
            <Input id="state" {...register('state')} />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          Salvar alterações
        </Button>
      </form>
    </div>
  )
}
