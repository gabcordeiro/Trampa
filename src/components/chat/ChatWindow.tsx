import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMessages, sendMessage, markMessagesRead } from '@/hooks/useMessages'
import { cn } from '@/lib/utils'

interface ChatWindowProps {
  contractId: string
  currentUserId: string
}

export function ChatWindow({ contractId, currentUserId }: ChatWindowProps) {
  const { messages, loading } = useMessages(contractId)
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

  return (
    <div className="flex h-[480px] flex-col rounded-xl border border-border bg-card">
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
