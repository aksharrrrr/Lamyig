import { Routes, Route, useLocation, useNavigate, type Location } from 'react-router'
import Home from './pages/Home'
import Region from './pages/Region'
import Village from './pages/Village'
import Place from './pages/Place'
import AddEditPlace from './pages/AddEditPlace'
import Auth from './pages/Auth'
import Profile from './pages/Profile'
import Feedback from './pages/Feedback'
import Vision from './pages/Vision'
import Overlay from './components/Overlay'
import { ToastProvider } from './lib/useToast'
import { PlacesProvider } from './lib/usePlacesStore'

// Home (the map) stays mounted underneath at all times. Add Place, Profile
// and Place detail render as an overlay on top of whatever page was showing
// when they were opened, via React Router's "background location" pattern - 
// navigate(path, { state: { background: location } }) opens them as an
// overlay; a direct link/refresh to the same path (no background state)
// falls back to a plain full page for those, since they have real content
// worth a standalone/shareable URL.
//
// Auth and Feedback are different - pure UI chrome, nothing to bookmark or
// share - so they always render as an overlay over the map, even on a cold
// direct visit (e.g. clicking a password-reset link from an email, which
// has no prior in-app navigation to carry a background location).
export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const background = (location.state as { background?: Location } | null)?.background
  const authTitle = location.search.includes('mode=sign-up')
    ? 'Sign up'
    : location.search.includes('mode=forgot')
      ? 'Reset password'
      : 'Sign in'
  // A cold direct visit (email link) has no in-app history to go back to -
  // navigate(-1) there could leave the app entirely, so close explicitly to
  // Home instead. When there IS a background (opened from within the app),
  // the default navigate(-1) behavior is correct and preserved.
  const closeToHome = background ? undefined : () => navigate('/')

  return (
    <ToastProvider>
      <PlacesProvider>
        <Routes location={background || location}>
          <Route path="/" element={<Home />} />
          <Route path="/region/:regionSlug" element={<Region />} />
          <Route path="/village/:villageSlug" element={<Village />} />
          <Route path="/auth" element={<Home />} />
          <Route path="/feedback" element={<Home />} />
          <Route path="/vision" element={<Home />} />
          {/* Fallback full-page versions when there's no background to overlay onto */}
          <Route path="/place/:placeId" element={<div className="mx-auto max-w-lg p-6"><Place /></div>} />
          <Route path="/add" element={<div className="mx-auto max-w-lg p-6"><h1 className="mb-4 text-2xl font-bold">Add a place</h1><AddEditPlace /></div>} />
          <Route path="/place/:placeId/edit" element={<div className="mx-auto max-w-lg p-6"><h1 className="mb-4 text-2xl font-bold">Edit place</h1><AddEditPlace /></div>} />
          <Route path="/profile" element={<div className="mx-auto max-w-lg p-6"><h1 className="mb-4 text-2xl font-bold">Profile</h1><Profile /></div>} />
        </Routes>

        <Routes>
          <Route path="/auth" element={<Overlay title={authTitle} onClose={closeToHome}><Auth /></Overlay>} />
          <Route path="/feedback" element={<Overlay title="Feedback" onClose={closeToHome}><Feedback /></Overlay>} />
          <Route path="/vision" element={<Overlay title="Welcome to Lamyig" onClose={closeToHome}><Vision onClose={closeToHome} /></Overlay>} />
          {/* Every other path lands here otherwise - without it react-router
              logs a "No routes matched" console warning on every load/nav
              (this Routes block uses the real location, not the background
              one, so most paths legitimately don't match it). */}
          <Route path="*" element={null} />
        </Routes>

        {background && (
          <Routes>
            <Route path="/place/:placeId" element={<Overlay title="Place details"><Place /></Overlay>} />
            <Route path="/add" element={<Overlay title="Add a place"><AddEditPlace /></Overlay>} />
            <Route path="/place/:placeId/edit" element={<Overlay title="Edit place"><AddEditPlace /></Overlay>} />
            <Route path="/profile" element={<Overlay title="Profile"><Profile /></Overlay>} />
            <Route path="*" element={null} />
          </Routes>
        )}
      </PlacesProvider>
    </ToastProvider>
  )
}
