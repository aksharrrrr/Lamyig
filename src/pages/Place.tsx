import { useParams } from 'react-router-dom'

export default function Place() {
  const { placeId } = useParams()
  return (
    <div className="p-6">
      <h1 className="text-2xl font-medium">Place {placeId}</h1>
      <p className="mt-2 text-neutral-500">
        Full Place record, photos, Community Notes, "Still accurate," Report, Edit — see docs/08-mvp.md.
      </p>
    </div>
  )
}
