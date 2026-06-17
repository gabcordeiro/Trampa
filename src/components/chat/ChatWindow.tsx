import { useEffect, useRef, useState } from 'react'
import { Check, Send } from 'lucide-react'
import { formatDistanceToNow, isToday, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMessages, sendMessage, markMessagesRead } from '@/hooks/useMessages'
import { isOnline } from '@/lib/badges'
import { cn, initialsFromName } from '@/lib/utils'

interface ChatWindowProps {
  contractId: string
  currentUserId: string
  otherUser: { full_name: string; avatar_url: string | null; last_seen_at: string | null }
}

function LastSeenLabel({ lastSeenAt }: { lastSeenAt: string | null }) {
  if (isOnline(lastSeenAt)) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-500">
        <span className="text-base leading-none">●</span>
        Online agora
      </span>
    )
  }

  if (!lastSeenAt) {
    return <span className="text-xs text-muted-foreground">Offline</span>
  }

  const date = new Date(lastSeenAt)
  const label = isToday(date)
    ? `Hoje às ${format(date, 'HH:mm')}`
    : formatDistanceToNow(date, { addSuffix: true, locale: ptBR })

  return <span className="text-xs text-muted-foreground">Visto {label}</span>
}

export function ChatWindow({ contractId, currentUserId, otherUser }: ChatWindowProps) {
  const { messages, loading, error } = useMessages(contractId)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    markMessagesRead(contractId, currentUserId)
  }, [contractId, currentUserId, messages.length])

  const handleSend = async () => {
    const content = draft.trim()
    if (!content) return
    setSending(true)
    setDraft('')
    try {
      await sendMessage(contractId, currentUserId, content)
    } finally {
      setSending(false)
    }
  }

  if (error) {
    return (
      <Card className="flex h-[480px] items-center justify-center rounded-xl border border-border bg-card">
        <CardContent className="text-center text-sm text-muted-foreground">
          Não foi possível carregar o chat. Tente recarregar a página.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex h-[480px] flex-col rounded-xl border border-border bg-card">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={otherUser.avatar_url ?? undefined} alt={otherUser.full_name} />
          <AvatarFallback>{initialsFromName(otherUser.full_name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">{otherUser.full_name}</span>
          <LastSeenLabel lastSeenAt={otherUser.last_seen_at} />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading && <p className="text-sm text-muted-foreground">Carregando mensagens…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Diga olá!</p>
        )}
        {messages.map((message) => {
          const isMine = message.sender_id === currentUserId
          return (
            <div key={message.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                  isMine ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
                )}
              >
                {message.content}
                {isMine && (
                  <span className="ml-2 inline-flex items-center">
                    {message.read_at ? (
                      <>
                        <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                        <Check className="-ml-1.5 h-3 w-3 text-primary-foreground" strokeWidth={3} />
                      </>
                    ) : (
                      <Check className="h-3 w-3 text-primary-foreground/50" strokeWidth={3} />
                    )}
                  </span>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          handleSend()
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Escreva uma mensagem…"
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={sending || !draft.trim()}>
          <Send />
        </Button>
      </form>
    </div>
  )
}
