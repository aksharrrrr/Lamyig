import { useParams } from 'react-router'

export default function Region() {
  const { regionSlug } = useParams()
  return (
    <div className="p-6">
      <h1 className="text-2xl font-medium capitalize">{regionSlug}</h1>
      {/* Region description, offline download, popular villages, community stats, Open Map. See docs/08-mvp.md. */}
      <p className="mt-2 text-neutral-500">
        We're still mapping this part of the journey. Region details, offline downloads, and
        popular villages are on the roadmap as Lamyig grows.
      </p>
    </div>
  )
}
