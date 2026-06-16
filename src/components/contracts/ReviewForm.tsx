import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from './StarRating'
import { createReview } from '@/hooks/useReviews'

interface ReviewFormProps {
  contractId: string
  serviceId: string
  clientId: string
  providerId: string
  onSubmitted?: () => void
}

export function ReviewForm({ contractId, serviceId, clientId, providerId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Selecione uma nota de 1 a 5 estrelas.')
      return
    }
    setSubmitting(true)
    try {
      await createReview({
        contract_id: contractId,
        service_id: serviceId,
        client_id: clientId,
        provider_id: providerId,
        rating,
        comment: comment.trim() || undefined,
      })
      toast.success('Avaliação enviada. Obrigado!')
      onSubmitted?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar a avaliação.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="font-medium">Como foi o serviço?</p>
      <StarRating value={rating} onChange={setRating} size={28} />
      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Conte como foi sua experiência (opcional)"
      />
      <Button onClick={handleSubmit} disabled={submitting}>
        Enviar avaliação
      </Button>
    </div>
  )
}
