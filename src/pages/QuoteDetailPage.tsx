import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatCurrency, initialsFromName } from '@/lib/utils'
import { getBadge } from '@/lib/badges'
import type { QuoteRequest } from '@/types/database'

const schema = z.object({
  price: z.string().optional(),
  message: z.string().min(10, 'Escreva pelo menos 10 caracteres na proposta'),
})
type FormValues = z.infer<typeof schema>

type QuoteWithProvider = {
  id: string
  provider_id: string
  price: number | null
  message: string
  status: string
  created_at: string
  provider: { full_name: string; avatar_url: string | null; rating_avg: number; rating_count: number }
}

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [request, setRequest] = useState<QuoteRequest | null>(null)
  const [quotes, setQuotes] = useState<QuoteWithProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [alreadyQuoted, setAlreadyQuoted] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('quote_requests').select('*').eq('id', id).single(),
      supabase.from('quotes').select('*, provider:profiles(full_name, avatar_url, rating_avg:reviews(rating), rating_count:reviews(count))').eq('request_id', id),
    ]).then(([reqRes, quotesRes]) => {
      if (reqRes.data) setRequest(reqRes.data as QuoteRequest)
      const raw = (quotesRes.data ?? []) as unknown as QuoteWithProvider[]
      setQuotes(raw)
      if (user) setAlreadyQuoted(raw.some((q) => q.provider_id === user.id))
      setLoading(false)
    })
  }, [id, user])

  const isOwner = user?.id === request?.client_id

  const handleSubmitQuote = async (values: FormValues) => {
    if (!user || !id) { navigate('/login'); return }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('quotes').insert({
        request_id: id,
        provider_id: user.id,
        price: values.price ? Number(values.price) : null,
        message: values.message,
      })
      if (error) throw error
      toast.success('Proposta enviada!')
      setAlreadyQuoted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar proposta.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAccept = async (quoteId: string) => {
    if (!request) return
    try {
      await supabase.from('quotes').update({ status: 'accepted' }).eq('id', quoteId)
      await supabase.from('quote_requests').update({ status: 'closed' }).eq('id', request.id)
      toast.success('Proposta aceita! Agora é só combinar os detalhes.')
      navigate('/orcamentos/meus')
    } catch {
      toast.error('Erro ao aceitar proposta.')
    }
  }

  if (loading) return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )

  if (!request) return <p className="py-20 text-center text-muted-foreground">Pedido não encontrado.</p>

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-xl">{request.title}</CardTitle>
            <Badge variant={request.status === 'open' ? 'success' : 'secondary'}>
              {request.status === 'open' ? 'Aberto' : 'Fechado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground">{request.description}</p>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {request.city && <span>📍 {request.city}</span>}
            {request.budget_max && <span>💰 Orçamento até {formatCurrency(request.budget_max)}</span>}
            <span>🕐 {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: ptBR })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Proposals received */}
      <div>
        <h2 className="mb-3 font-semibold">{quotes.length} {quotes.length === 1 ? 'proposta recebida' : 'propostas recebidas'}</h2>
        <div className="space-y-3">
          {quotes.map((q) => {
            const badge = getBadge(q.provider.rating_count ?? 0)
            return (
              <Card key={q.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={q.provider.avatar_url ?? undefined} />
                      <AvatarFallback>{initialsFromName(q.provider.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{q.provider.full_name}</span>
                        <Badge className={`text-[10px] ${badge.color}`}>{badge.label}</Badge>
                        {q.provider.rating_count > 0 && (
                          <span className="text-xs text-muted-foreground">⭐ {Number(q.provider.rating_avg).toFixed(1)} ({q.provider.rating_count})</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{q.message}</p>
                      {q.price && <p className="font-semibold text-primary">{formatCurrency(q.price)}</p>}
                    </div>
                    {isOwner && request.status === 'open' && (
                      <Button size="sm" onClick={() => handleAccept(q.id)}>
                        Aceitar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {quotes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma proposta ainda.</p>}
        </div>
      </div>

      {/* Send proposal form (for providers) */}
      {!isOwner && user && profile?.is_provider && request.status === 'open' && (
        <>
          <Separator />
          {alreadyQuoted ? (
            <p className="rounded-lg border border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
              Você já enviou uma proposta para este pedido.
            </p>
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-base">Enviar proposta</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(handleSubmitQuote)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="price">Seu preço (R$) <span className="text-muted-foreground">(opcional)</span></Label>
                    <Input id="price" type="number" placeholder="Ex: 350" {...register('price')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="message">Mensagem para o cliente</Label>
                    <Textarea id="message" rows={3} placeholder="Apresente-se e explique como vai resolver…" {...register('message')} />
                    {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Enviando…' : 'Enviar proposta'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
