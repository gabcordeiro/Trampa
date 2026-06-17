import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, LogOut, Megaphone, MessageSquare, Plus, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { initialsFromName } from '@/lib/utils'

export function Header() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Briefcase className="size-4" />
          </span>
          Trampa
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" asChild>
            <Link to="/explorar">Explorar</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/orcamentos">Orçamentos</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/precos">Planos</Link>
          </Button>
          {user && (
            <Button variant="ghost" asChild>
              <Link to="/contratos">Meus contratos</Link>
            </Button>
          )}
          {profile?.is_provider && (
            <Button variant="ghost" asChild>
              <Link to="/painel">Painel</Link>
            </Button>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button size="sm" variant="outline" className="hidden sm:inline-flex" asChild>
                <Link to="/pedir-orcamento">
                  <Megaphone /> Pedir orçamento
                </Link>
              </Button>
              <Button size="sm" className="hidden sm:inline-flex" asChild>
                <Link to="/painel/anuncios/novo">
                  <Plus /> Anunciar
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar>
                      <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name} />
                      <AvatarFallback>{initialsFromName(profile?.full_name ?? 'U')}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/perfil">
                      <UserIcon /> Meu perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/contratos">
                      <MessageSquare /> Contratos e chat
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleSignOut}>
                    <LogOut /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link to="/cadastro">Criar conta</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
