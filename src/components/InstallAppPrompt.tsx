import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Overlay from './Overlay'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export default function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  // Chromium only emits `beforeinstallprompt` when this browser considers the
  // app installable. In particular, it normally withholds the event once the
  // PWA is installed, so waiting for it prevents an installed user from seeing
  // a dead install control in an ordinary browser tab. iOS has no equivalent
  // event, so Safari keeps the manual Add to Home Screen path available.
  const [available, setAvailable] = useState(() => isIos() && !isStandalone())
  const [open, setOpen] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [installing, setInstalling] = useState(false)
  const ios = isIos()

  useEffect(() => {
    const installAvailable = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      setAvailable(true)
    }
    const installed = () => {
      setAvailable(false)
      setOpen(false)
      setInstallEvent(null)
    }

    window.addEventListener('beforeinstallprompt', installAvailable)
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('beforeinstallprompt', installAvailable)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  async function install() {
    if (!installEvent) {
      setShowInstructions(true)
      return
    }

    setInstalling(true)
    try {
      await installEvent.prompt()
      const choice = await installEvent.userChoice
      if (choice.outcome === 'accepted') {
        setAvailable(false)
        setOpen(false)
      }
      setInstallEvent(null)
    } finally {
      setInstalling(false)
    }
  }

  if (!available) return null

  return (
    <>
      <button
        type="button"
        onClick={() => { setShowInstructions(false); setOpen(true) }}
        title="Install Lamyig"
        aria-label="Install Lamyig"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/[0.08] bg-surface shadow-lg hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55525c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" />
        </svg>
      </button>

      {open && createPortal(
        <Overlay title="Install Lamyig" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <img src="/pwa-192x192.png" alt="" className="h-12 w-12 flex-none rounded-xl" />
              <div>
                <p className="text-sm leading-relaxed text-muted">
                  Open the road-book like an app, with quick access to maps saved for offline use.
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-light">
                  Regional maps remain separate downloads, so you stay in control of device storage.
                </p>
              </div>
            </div>

            {showInstructions && (
              <p role="status" className="rounded-xl bg-accent-light/60 px-3 py-2.5 text-sm leading-relaxed text-accent-text">
                {ios
                  ? <>In Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</>
                  : <>Open your browser menu and choose <strong>Install Lamyig</strong> or <strong>Add to Home screen</strong>.</>}
              </p>
            )}

            <button
              type="button"
              onClick={install}
              disabled={installing}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[11px] bg-accent px-4 py-2.5 text-sm font-semibold text-surface transition hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-70"
            >
              <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" />
              </svg>
              {installing ? 'Opening installer…' : 'Install app'}
            </button>
          </div>
        </Overlay>,
        document.body,
      )}
    </>
  )
}
