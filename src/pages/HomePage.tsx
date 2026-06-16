import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Star, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCategories } from '@/hooks/useCategories'

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

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Encontre os melhores prestadores de serviço perto de você
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Limpeza, reformas, beleza, aulas e muito mais. Tudo num só lugar, com avaliações reais e chat direto.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/explorar">
                Explorar serviços <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/cadastro">Quero anunciar meus serviços</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-semibold">Categorias populares</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} to={`/explorar?categoria=${category.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    {category.name[0]}
                  </span>
                  <span className="text-sm font-medium">{category.name}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
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
      </section>
    </div>
  )
}
