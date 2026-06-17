import { Link } from 'react-router-dom'
import { ArrowRight, Megaphone, Search, ShieldCheck, Star, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FeaturedServiceCard } from '@/components/services/FeaturedServiceCard'
import { useCategories } from '@/hooks/useCategories'
import { useFeaturedServices } from '@/hooks/useServices'

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

const HERO_IMAGE = 'https://loremflickr.com/1280/720/handyman,service?lock=4242'

export function HomePage() {
  const { categories } = useCategories()
  const { services: featured, loading: featuredLoading } = useFeaturedServices(8)

  return (
    <div>
      <section className="relative overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 size-full object-cover"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/75 to-primary/55" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center text-primary-foreground sm:py-28">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            Profissionais avaliados perto de você
          </span>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight drop-shadow-sm sm:text-5xl">
            Encontre os melhores prestadores de serviço perto de você
          </h1>
          <p className="max-w-xl text-lg text-primary-foreground/90">
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
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-semibold">Categorias populares</h2>
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
            : featured.map((service) => <FeaturedServiceCard key={service.id} service={service} />)}
        </div>
      </section>

      <section className="bg-primary/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-14 text-center sm:flex-row sm:text-left">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Megaphone className="size-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Precisa de um serviço específico?</h2>
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

      <section className="bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="mb-6 text-2xl font-semibold">Como funciona</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step) => (
              <Card key={step.title}>
                <CardContent className="space-y-3 p-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="size-5" />
                  </span>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
