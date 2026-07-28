import { useParams } from 'react-router'

export default function Village() {
  const { villageSlug } = useParams()
  return (
    <div className="p-6">
      <h1 className="text-2xl font-medium capitalize">{villageSlug}</h1>
      {/* Village info, available categories, community updates, Open Map. See docs/08-mvp.md. */}
      <p className="mt-2 text-neutral-500">
        We're still mapping this part of the journey. Village info and community updates are on
        the roadmap as Lamyig grows.
      </p>
    </div>
  )
}
