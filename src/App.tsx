import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Region from './pages/Region'
import Village from './pages/Village'
import Place from './pages/Place'
import AddEditPlace from './pages/AddEditPlace'
import Auth from './pages/Auth'
import Profile from './pages/Profile'

export default function App() {
  return (
    <div className="flex h-svh flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
        <Link to="/" className="font-medium">Lamyig</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/add">+ Add place</Link>
          <Link to="/profile">Profile</Link>
        </nav>
      </header>
      <main className="min-h-0 flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/region/:regionSlug" element={<Region />} />
          <Route path="/village/:villageSlug" element={<Village />} />
          <Route path="/place/:placeId" element={<Place />} />
          <Route path="/place/:placeId/edit" element={<AddEditPlace />} />
          <Route path="/add" element={<AddEditPlace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  )
}
