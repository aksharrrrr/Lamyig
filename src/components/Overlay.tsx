import { useCallback, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../lib/useIsMobile'

interface OverlayProps {
  title: string
  children: ReactNode
  onClose?: () => void
}

// Home (the map) always stays mounted underneath — this only ever renders
// on top of it. Desktop: centered modal. Mobile: bottom sheet. Both close on
// backdrop click, Escape, or the browser back button (default onClose is
// navigate(-1), which is what makes back-button-closes work for free).
export default function Overlay({ title, children, onClose }: OverlayProps) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const close = useCallback(() => (onClose ? onClose() : navigate(-1)), [onClose, navigate])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  const closeButton = (
    <button
      onClick={close}
      title="Close"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/5 hover:bg-ink/10"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#55525c" strokeWidth="2" strokeLinecap="round">
        <path d="M6 6l12 12" /><path d="M18 6L6 18" />
      </svg>
    </button>
  )

  if (isMobile) {
    return (
      <div
        onClick={close}
        className="fixed inset-0 z-40 bg-[rgba(22,18,30,0.30)]"
        style={{ animation: 'fadeIn 0.18s ease' }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-[22px] bg-surface shadow-2xl"
          style={{ animation: 'sheetUp 0.28s cubic-bezier(.2,.8,.25,1)' }}
        >
          <div className="flex justify-center pt-2.5 pb-0.5">
            <div className="h-[5px] w-[42px] rounded-full bg-ink/15" />
          </div>
          <div className="flex items-center justify-between px-5 py-2">
            <h2 className="text-lg font-bold">{title}</h2>
            {closeButton}
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-5 pb-5">{children}</div>
        </div>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes sheetUp { from { transform: translateY(55%); opacity: .4; } to { transform: translateY(0); opacity: 1; } }
        `}</style>
      </div>
    )
  }

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(22,18,30,0.34)]"
      style={{ animation: 'fadeIn 0.18s ease' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-[min(78vw,720px)] flex-col rounded-[20px] bg-surface shadow-2xl"
        style={{ animation: 'popIn 0.22s ease' }}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-[19px] font-bold tracking-tight">{title}</h2>
          {closeButton}
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">{children}</div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(.96) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  )
}
