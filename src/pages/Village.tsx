import { useParams } from 'react-router-dom'

export default function Village() {
  const { villageSlug } = useParams()
  return (
    <div className="p-6">
      <h1 className="text-2xl font-medium capitalize">{villageSlug}</h1>
      <p className="mt-2 text-neutral-500">
        Village info, available categories, community updates, Open Map — see docs/08-mvp.md.
      </p>
    </div>
  )
}
