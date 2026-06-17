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

const FAQS = [
  { q: 'Como funciona o pagamento?', a: 'Processamos via Stripe com cartão de crédito. O débito automático ocorre mensalmente para o Plano Pro. Seus dados de pagamento são criptografados e nunca armazenados em nossos servidores.' },
  { q: 'Posso cancelar a qualquer hora?', a: 'Sim, sem multa ou aviso prévio. Cancele pelo painel do Stripe. Seu plano fica ativo até o fim do período já pago.' },
  { q: 'O Boost e o Pro se acumulam?', a: 'Sim! Você pode ser assinante Pro e ainda impulsionar anúncios específicos com Boost por 30 dias cada. São produtos complementares.' },
  { q: 'Existe reembolso?', a: 'Sim, em até 7 dias corridos após a cobrança, conforme o Código de Defesa do Consumidor. Entre em contato pelo chat.' },
  { q: 'Como funciona o limite de anúncios no plano Grátis?', a: 'No plano Grátis você pode ter até 2 anúncios ativos ao mesmo tempo. Ao atingir o limite, é necessário excluir um anúncio ou fazer upgrade para o Pro para criar novos.' },
]

export function PricingPage() {
  const { user, profile } = useAuth()
  const { startCheckout, loading } = useCheckout()
  const [boostLoading, setBoostLoading] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
          Simples e transparente
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight">Planos e preços</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Comece grátis. Escale quando estiver pronto. Sem surpresas.
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
        <Card className="relative flex flex-col border-primary shadow-[0_0_40px_rgba(124,58,237,0.15)]">
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

      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
        {[
          { icon: '🔒', text: 'Pagamento seguro' },
          { icon: '↩️', text: 'Reembolso em 7 dias' },
          { icon: '❌', text: 'Cancele quando quiser' },
          { icon: '🇧🇷', text: 'Suporte em português' },
        ].map((item) => (
          <span key={item.text} className="flex items-center gap-1.5">
            <span>{item.icon}</span> {item.text}
          </span>
        ))}
      </div>

      <div className="mt-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold">Perguntas frequentes</h2>
          <p className="mt-1 text-muted-foreground">Tudo que você precisa saber antes de começar.</p>
        </div>
        <div className="mx-auto max-w-2xl divide-y divide-border rounded-xl border border-border overflow-hidden">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-muted/40 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-medium text-sm">{faq.q}</span>
                <span className={`shrink-0 transition-transform duration-200 text-muted-foreground ${openFaq === i ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
