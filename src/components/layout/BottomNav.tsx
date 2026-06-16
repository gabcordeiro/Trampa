import { NavLink } from 'react-router-dom'
import { Compass, MessageSquare, PlusCircle, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
    isActive ? 'text-primary' : 'text-muted-foreground',
  )

export function BottomNav() {
  const { user } = useAuth()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <div className="flex items-stretch">
        <NavLink to="/explorar" className={linkClass}>
          <Compass className="size-5" />
          Explorar
        </NavLink>
        <NavLink to={user ? '/painel/anuncios/novo' : '/login'} className={linkClass}>
          <PlusCircle className="size-5" />
          Anunciar
        </NavLink>
        <NavLink to={user ? '/contratos' : '/login'} className={linkClass}>
          <MessageSquare className="size-5" />
          Contratos
        </NavLink>
        <NavLink to={user ? '/perfil' : '/login'} className={linkClass}>
          <UserIcon className="size-5" />
          Perfil
        </NavLink>
      </div>
    </nav>
  )
}
