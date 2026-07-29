import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Nobody using Lamyig should ever have to know a service worker exists, let
// alone hard-refresh or clear site data to get a fix - a shipped bug fix
// (see the "my location" zoom fix, which needed exactly that workaround
// before this) should just reach every open tab on its own. `updateSW(true)`
// activates the new service worker and reloads immediately, no prompt.
// Checking again every 30 minutes covers a tab left open for a long
// session, which otherwise wouldn't notice an update until its next full
// reload/reopen.
const updateSW = registerSW({
  onNeedRefresh() {
    updateSW(true)
  },
  onRegisteredSW(_url, registration) {
    if (!registration) return
    setInterval(() => registration.update(), 30 * 60 * 1000)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
