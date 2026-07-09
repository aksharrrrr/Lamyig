import { useParams } from 'react-router-dom'

export default function Region() {
  const { regionSlug } = useParams()
  return (
    <div className="p-6">
      <h1 className="text-2xl font-medium capitalize">{regionSlug}</h1>
      <p className="mt-2 text-neutral-500">
        Region description, offline download, popular villages, community stats, Open Map. See docs/08-mvp.md.
      </p>
    </div>
  )
}
