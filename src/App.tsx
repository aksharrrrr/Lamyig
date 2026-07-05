import { Routes, Route, useLocation, type Location } from 'react-router-dom'
import Home from './pages/Home'
import Region from './pages/Region'
import Village from './pages/Village'
import Place from './pages/Place'
import AddEditPlace from './pages/AddEditPlace'
import Auth from './pages/Auth'
import Profile from './pages/Profile'
import Overlay from './components/Overlay'
import { ToastProvider } from './lib/useToast'
import { PlacesProvider } from './lib/usePlacesStore'

// Home (the map) stays mounted underneath at all times. Add Place and
// Profile render as an overlay on top of whatever page was showing when
// they were opened, via React Router's "background location" pattern —
// navigate(path, { state: { background: location } }) opens them as an
// overlay; a direct link/refresh to the same path (no background state)
// falls back to a plain full page.
export default function App() {
  const location = useLocation()
  const background = (location.state as { background?: Location } | null)?.background

  return (
    <ToastProvider>
      <PlacesProvider>
        <Routes location={background || location}>
          <Route path="/" element={<Home />} />
          <Route path="/region/:regionSlug" element={<Region />} />
          <Route path="/village/:villageSlug" element={<Village />} />
          <Route path="/place/:placeId" element={<Place />} />
          <Route path="/auth" element={<Auth />} />
          {/* Fallback full-page versions when there's no background to overlay onto */}
          <Route path="/add" element={<div className="mx-auto max-w-lg p-6"><h1 className="mb-4 text-2xl font-bold">Add a place</h1><AddEditPlace /></div>} />
          <Route path="/place/:placeId/edit" element={<div className="mx-auto max-w-lg p-6"><h1 className="mb-4 text-2xl font-bold">Edit place</h1><AddEditPlace /></div>} />
          <Route path="/profile" element={<div className="mx-auto max-w-lg p-6"><h1 className="mb-4 text-2xl font-bold">Profile</h1><Profile /></div>} />
        </Routes>

        {background && (
          <Routes>
            <Route path="/add" element={<Overlay title="Add a place"><AddEditPlace /></Overlay>} />
            <Route path="/place/:placeId/edit" element={<Overlay title="Edit place"><AddEditPlace /></Overlay>} />
            <Route path="/profile" element={<Overlay title="Profile"><Profile /></Overlay>} />
          </Routes>
        )}
      </PlacesProvider>
    </ToastProvider>
  )
}
