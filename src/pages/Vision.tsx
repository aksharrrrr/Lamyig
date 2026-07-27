import { useNavigate } from 'react-router-dom'

export default function Vision({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate()
  const close = onClose ?? (() => navigate(-1))

  return (
    <div className="flex flex-col gap-4 text-[14.5px] leading-relaxed text-ink">
      <p>
        So much local knowledge — the homestay with no signboard, the nearest mechanic, where to
        get water — exists only in word of mouth, invisible to anyone passing through without a
        local to ask. Lamyig exists to give that knowledge a place to live.
      </p>
      <p>
        This isn't a booking platform, and it isn't built to make money off anyone's hospitality.
        It's here to help travellers who need real information, and to help the homestay families
        and small businesses behind it get found — not to sit in between them as a company.
      </p>
      <p>
        Lamyig is open source, and it's staying that way. The data, the code, and the decisions
        belong to the community that uses and grows it — built for everyone who relies on it, not
        for anyone's benefit alone.
      </p>
      <a
        href="https://github.com/aksharrrrr/Lamyig"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-accent underline underline-offset-2"
      >
        See the project on GitHub →
      </a>
      <button
        type="button"
        onClick={close}
        className="mt-1 self-start rounded-[11px] bg-accent px-4 py-2.5 text-sm font-semibold text-surface"
      >
        Close
      </button>
    </div>
  )
}
