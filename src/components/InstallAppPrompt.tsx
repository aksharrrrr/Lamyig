import { useEffect, useState } from 'react'

const DISMISSED_KEY = 'lamyig:installPromptDismissed'

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
  const [visible, setVisible] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [installing, setInstalling] = useState(false)
  const ios = isIos()

  useEffect(() => {
    if (isStandalone()) return

    try {
      if (localStorage.getItem(DISMISSED_KEY)) return
    } catch {
      // Storage may be unavailable; the prompt can still work for this visit.
    }

    setVisible(true)

    const installAvailable = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    const installed = () => {
      setVisible(false)
      setInstallEvent(null)
    }

    window.addEventListener('beforeinstallprompt', installAvailable)
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('beforeinstallprompt', installAvailable)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // Dismiss for this page load even when storage is unavailable.
    }
    setVisible(false)
  }

  async function install() {
    if (!installEvent) {
      setShowInstructions(true)
      return
    }

    setInstalling(true)
    try {
      await installEvent.prompt()
      const choice = await installEvent.userChoice
      if (choice.outcome === 'accepted') setVisible(false)
      setInstallEvent(null)
    } finally {
      setInstalling(false)
    }
  }

  if (!visible) return null

  return (
    <aside
      aria-labelledby="install-lamyig-title"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-[430px] rounded-2xl border border-ink/[0.10] bg-surface p-3 shadow-xl sm:bottom-5 sm:left-5 sm:right-auto sm:mx-0 sm:p-3.5"
    >
      <div className="flex items-start gap-3">
        <img src="/pwa-192x192.png" alt="" className="h-10 w-10 flex-none rounded-xl" />
        <div className="min-w-0 flex-1">
          <h2 id="install-lamyig-title" className="text-[14px] font-bold text-ink">Install Lamyig</h2>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
            Open the road-book like an app, with quick access to maps saved for offline use.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install suggestion"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-muted hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {showInstructions && (
        <p role="status" className="mt-2 rounded-xl bg-accent-light/60 px-3 py-2 text-[12.5px] leading-snug text-accent-text">
          {ios
            ? <>In Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</>
            : <>Open your browser menu and choose <strong>Install Lamyig</strong> or <strong>Add to Home screen</strong>.</>}
        </p>
      )}

      <button
        type="button"
        onClick={install}
        disabled={installing}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-70"
      >
        <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" />
        </svg>
        {installing ? 'Opening installer…' : 'Install app'}
      </button>
    </aside>
  )
}
