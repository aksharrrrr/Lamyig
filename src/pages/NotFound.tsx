import { useNavigate } from 'react-router'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Lost the trail</h1>
      <p className="text-sm text-muted">This path doesn't exist on Lamyig - might be an old link, or a typo.</p>
      <button
        onClick={() => navigate('/', { replace: true })}
        className="mt-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-surface"
      >
        Back to the map
      </button>
    </div>
  )
}
