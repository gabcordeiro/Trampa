import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { useCheckout } from '@/hooks/useCheckout'

const PRO_FEATURES = [
  'Anúncios ilimitados',
  'Aparece em destaque no feed',
  'Badge "Pro" no perfil',
  'Prioridade nos resultados de busca',
  'Suporte prioritário',
]

const FREE_FEATURES = [
  'Até 2 anúncios ativos',
  'Aparece na busca',
  'Chat com clientes',
  'Avaliações e contratações',
]

const BOOST_FEATURES = [
  'Anúncio no topo do feed por 30 dias',
  'Badge "Destaque" no card',
  'Sem necessidade de assinatura',
  'Compra pontual por anúncio',
]

export function PricingPage() {
  const { user, profile } = useAuth()
  const { startCheckout, loading } = useCheckout()
  const [boostLoading, setBoostLoading] = useState(false)

  const isPro = profile?.plan === 'pro'

  const handlePro = async () => {
    if (!user) { window.location.href = '/cadastro'; return }
    try {
      await startCheckout('pro')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar pagamento.')
    }
  }

  const handleBoostDemo = async () => {
    if (!user) { window.location.href = '/cadastro'; return }
    setBoostLoading(true)
    try {
      toast.info('Selecione um anúncio no painel para impulsionar.')
      window.location.href = '/painel'
    } finally {
      setBoostLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Planos e preços</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Comece grátis. Escale quando estiver pronto.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Free */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4">
            <p className="text-sm font-medium text-muted-foreground">Para começar</p>
            <h2 className="text-2xl font-bold">Grátis</h2>
            <p className="text-3xl font-bold">R$ 0<span className="text-base font-normal text-muted-foreground">/mês</span></p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <ul className="flex-1 space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" asChild className="w-full">
              <Link to={user ? '/painel' : '/cadastro'}>
                {user ? 'Meu painel' : 'Criar conta grátis'}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="relative flex flex-col border-primary shadow-lg">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="gap-1 bg-primary text-primary-foreground">
              <Sparkles className="size-3" /> Mais popular
            </Badge>
          </span>
          <CardHeader className="pb-4">
            <p className="text-sm font-medium text-primary">Para prestadores sérios</p>
            <h2 className="text-2xl font-bold">Plano Pro</h2>
            <p className="text-3xl font-bold">R$ 49<span className="text-base font-normal text-muted-foreground">/mês</span></p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <ul className="flex-1 space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <Button disabled className="w-full">Plano atual ✓</Button>
            ) : (
              <Button className="w-full" onClick={handlePro} disabled={loading}>
                {loading ? 'Redirecionando…' : 'Assinar Pro'}
              </Button>
            )}
            <p className="text-center text-xs text-muted-foreground">Cancele a qualquer momento</p>
          </CardContent>
        </Card>

        {/* Boost */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4">
            <p className="text-sm font-medium text-muted-foreground">Sem assinatura</p>
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              Boost <Zap className="size-5 text-amber-500" />
            </h2>
            <p className="text-3xl font-bold">R$ 19<span className="text-base font-normal text-muted-foreground">/anúncio</span></p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <ul className="flex-1 space-y-3">
              {BOOST_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" onClick={handleBoostDemo} disabled={boostLoading}>
              {boostLoading ? 'Redirecionando…' : 'Impulsionar anúncio'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">30 dias por compra</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 rounded-xl border border-border bg-muted/40 p-8 text-center">
        <h3 className="mb-2 text-lg font-semibold">Perguntas frequentes</h3>
        <div className="mx-auto mt-6 grid max-w-2xl gap-4 text-left text-sm">
          {[
            ['Como funciona o pagamento?', 'Processamos via Stripe. Aceita cartão de crédito. O débito automático ocorre mensalmente para o Plano Pro.'],
            ['Posso cancelar a qualquer hora?', 'Sim. Cancele pelo painel do Stripe. Seu plano fica ativo até o fim do período pago.'],
            ['O Boost e o Pro se acumulam?', 'Sim. Você pode ser Pro e ainda impulsionar anúncios específicos por 30 dias cada.'],
            ['Existe reembolso?', 'Sim, em até 7 dias corridos após a cobrança, conforme o Código de Defesa do Consumidor.'],
          ].map(([q, a]) => (
            <div key={q} className="space-y-1">
              <p className="font-medium">{q}</p>
              <p className="text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
