import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

interface PhotoLightboxProps {
  photos: string[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function PhotoLightbox({ photos, index, onClose, onPrev, onNext }: PhotoLightboxProps) {
  const hasMultiple = photos.length > 1

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev()
      else if (e.key === 'ArrowRight') onNext()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onPrev, onNext, onClose])

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex items-center justify-center outline-none"
          onPointerDownOutside={onClose}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>

          {/* Prev */}
          {hasMultiple && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev() }}
              className="absolute left-4 z-10 flex size-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              aria-label="Anterior"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}

          {/* Image */}
          <img
            key={photos[index]}
            src={photos[index]}
            alt=""
            className="max-h-[90dvh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {hasMultiple && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext() }}
              className="absolute right-4 z-10 flex size-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              aria-label="Próxima"
            >
              <ChevronRight className="size-6" />
            </button>
          )}

          {/* Counter */}
          {hasMultiple && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
              {index + 1} / {photos.length}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
