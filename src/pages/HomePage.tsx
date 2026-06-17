import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Megaphone, Search, ShieldCheck, Star, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FeaturedServiceCard } from '@/components/services/FeaturedServiceCard'
import { useCategories } from '@/hooks/useCategories'
import { useFeaturedServices } from '@/hooks/useServices'
import { supabase } from '@/lib/supabase'

const STEPS = [
  {
    icon: Zap,
    title: 'Encontre o serviço ideal',
    description: 'Busque por categoria e veja prestadores avaliados perto de você no mapa.',
  },
  {
    icon: ShieldCheck,
    title: 'Combine e contrate com segurança',
    description: 'Converse em tempo real, acompanhe o status do pedido do início ao fim.',
  },
  {
    icon: Star,
    title: 'Avalie a experiência',
    description: 'Depois do serviço concluído, deixe sua avaliação e ajude a comunidade.',
  },
]

export function HomePage() {
  const { categories } = useCategories()
  const { services: featured, loading: featuredLoading } = useFeaturedServices(8)
  const [featuredPhotos, setFeaturedPhotos] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (featured.length === 0) return
    const ids = featured.map((s) => s.id)
    supabase
      .from('service_photos')
      .select('service_id, url, position')
      .in('service_id', ids)
      .order('position', { ascending: true })
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, string[]> = {}
        for (const row of data) {
          if (!map[row.service_id]) map[row.service_id] = []
          map[row.service_id].push(row.url)
        }
        setFeaturedPhotos(map)
      })
  }, [featured])

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center text-primary-foreground sm:py-28">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            ✦ Mais de 1.000 prestadores cadastrados
          </span>
          <h1 className="max-w-2xl bg-gradient-to-r from-white to-purple-200 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl">
            Encontre os melhores prestadores de serviço perto de você
          </h1>
          <p className="max-w-xl text-lg text-white/80">
            Limpeza, reformas, beleza, aulas e muito mais. Tudo num só lugar, com avaliações reais e chat direto.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/explorar">
                <Search /> Explorar serviços
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              className="bg-white/15 text-primary-foreground backdrop-blur hover:bg-white/25"
            >
              <Link to="/cadastro">
                Quero anunciar <ArrowRight />
              </Link>
            </Button>
          </div>
          {/* In-hero search bar */}
          <div className="mt-4 flex w-full max-w-lg overflow-hidden rounded-full border border-white/20 bg-white/10 backdrop-blur">
            <input
              placeholder="Buscar serviço (ex: faxineira, encanador…)"
              className="flex-1 bg-transparent px-5 py-3 text-sm text-white placeholder:text-white/60 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter')
                  window.location.href = `/explorar?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`
              }}
            />
            <Link
              to="/explorar"
              className="flex items-center gap-2 bg-white px-5 py-3 text-sm font-semibold text-primary hover:bg-white/90"
            >
              <Search className="size-4" /> Buscar
            </Link>
          </div>
        </div>
      </section>

      {/* ── Social proof stats bar ── */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border px-4 sm:grid-cols-4">
          {[
            { value: '1.000+', label: 'Prestadores ativos' },
            { value: '50+', label: 'Cidades atendidas' },
            { value: '4.8★', label: 'Nota média' },
            { value: 'Grátis', label: 'Para começar' },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-6 text-center">
              <p className="text-2xl font-extrabold text-primary">{stat.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Categorias populares</h2>
          <Button variant="ghost" asChild className="shrink-0">
            <Link to="/explorar">
              Ver todas <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} to={`/explorar?categoria=${category.slug}`} className="group">
              <Card className="h-full overflow-hidden p-0 transition-shadow hover:shadow-md">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  {category.cover_url && (
                    <img
                      src={category.cover_url}
                      alt={category.name}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-3 text-sm font-semibold text-white">
                    {category.name}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured services ── */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Em destaque</h2>
            <p className="text-sm text-muted-foreground">Os serviços mais bem avaliados da plataforma.</p>
          </div>
          <Button variant="ghost" asChild className="shrink-0">
            <Link to="/explorar">
              Ver todos <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featuredLoading
            ? Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="aspect-[3/4] w-full" />)
            : featured.map((service) => <FeaturedServiceCard key={service.id} service={service} photos={featuredPhotos[service.id]} />)}
        </div>
      </section>

      {/* ── Trust badges ── */}
      <section className="border-y border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="mb-6 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Pagamentos seguros via
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              { name: 'Stripe', icon: '💳' },
              { name: 'Pix', icon: '⚡' },
              { name: 'SSL Seguro', icon: '🔒' },
              { name: 'LGPD', icon: '🛡️' },
            ].map((b) => (
              <div key={b.name} className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-lg">{b.icon}</span>
                <span className="text-sm font-medium">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Provider CTA ── */}
      <section className="bg-primary">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center text-primary-foreground sm:flex-row sm:text-left">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium uppercase tracking-wider text-primary-foreground/70">
              Para prestadores
            </p>
            <h2 className="text-3xl font-bold">Ganhe mais clientes. Cresça com a Trampa.</h2>
            <p className="max-w-xl text-primary-foreground/80">
              Crie seu anúncio grátis em minutos e comece a receber contratações hoje mesmo. Sem taxa por serviço
              realizado.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              {[
                '✓ 2 anúncios grátis',
                '✓ Chat direto com clientes',
                '✓ Avaliações verificadas',
                '✓ Sem comissão',
              ].map((f) => (
                <span key={f} className="text-sm text-primary-foreground/80">
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <Button size="lg" variant="secondary" asChild className="font-semibold">
              <Link to="/cadastro">
                Anunciar grátis agora <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <p className="text-xs text-primary-foreground/60">Sem cartão de crédito. Comece hoje.</p>
          </div>
        </div>
      </section>

      {/* ── Quote request CTA ── */}
      <section className="bg-gradient-to-r from-primary/10 to-violet-100 dark:from-primary/20 dark:to-violet-900/20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-14 text-center sm:flex-row sm:text-left">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Megaphone className="size-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">💬 Precisa de um orçamento?</h2>
            <p className="mt-1 text-muted-foreground">
              Publique um pedido grátis e receba propostas de prestadores qualificados perto de você em minutos.
            </p>
          </div>
          <Button size="lg" asChild className="shrink-0">
            <Link to="/pedir-orcamento">
              Pedir orçamento grátis <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-gradient-to-br from-muted/60 to-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">Como funciona</h2>
            <p className="mt-2 text-muted-foreground">Em 3 passos simples, resolva tudo pelo app.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                {/* Connector line between steps (hidden on mobile) */}
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[calc(50%+3rem)] top-7 hidden h-0.5 w-[calc(100%-3rem)] bg-gradient-to-r from-primary/40 to-transparent sm:block" />
                )}
                <span className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-4 ring-primary/5">
                  <step.icon className="size-6" />
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
