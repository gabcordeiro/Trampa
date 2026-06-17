import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="hidden border-t border-border bg-muted/30 md:block">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-lg">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Briefcase className="size-4" />
              </span>
              Trampa
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Conectamos clientes a prestadores de serviço de confiança em todo o Brasil.
            </p>
          </div>

          {/* Para clientes */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Para clientes</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/explorar" className="hover:text-foreground transition-colors">Explorar serviços</Link></li>
              <li><Link to="/orcamentos" className="hover:text-foreground transition-colors">Ver orçamentos</Link></li>
              <li><Link to="/pedir-orcamento" className="hover:text-foreground transition-colors">Pedir orçamento</Link></li>
              <li><Link to="/contratos" className="hover:text-foreground transition-colors">Meus contratos</Link></li>
            </ul>
          </div>

          {/* Para prestadores */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Para prestadores</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/cadastro" className="hover:text-foreground transition-colors">Criar conta grátis</Link></li>
              <li><Link to="/painel" className="hover:text-foreground transition-colors">Meu painel</Link></li>
              <li><Link to="/precos" className="hover:text-foreground transition-colors">Planos e preços</Link></li>
              <li><Link to="/orcamentos" className="hover:text-foreground transition-colors">Pedidos de orçamento</Link></li>
            </ul>
          </div>

          {/* Empresa */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Empresa</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="cursor-default">Sobre nós</span></li>
              <li><span className="cursor-default">Termos de uso</span></li>
              <li><span className="cursor-default">Política de privacidade</span></li>
              <li><span className="cursor-default">LGPD</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">© {year} Trampa. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>🔒</span> Pagamentos seguros via Stripe
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>🇧🇷</span> Feito no Brasil
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
