import { Link, useLocation } from 'react-router'

const sectionClass = 'space-y-2'

function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-full bg-bg px-5 py-8 text-ink">
      <article className="mx-auto max-w-2xl rounded-2xl border border-ink/10 bg-surface p-6 shadow-lg sm:p-8">
        <Link to="/" className="text-sm font-semibold text-accent-text underline underline-offset-2">← Back to map</Link>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-xs text-muted">Effective 17 August 2026</p>
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted">{children}</div>
      </article>
    </main>
  )
}

function Privacy() {
  return (
    <PageShell title="Privacy notice">
      <section className={sectionClass}>
        <h2 className="text-base font-bold text-ink">The short version</h2>
        <p>Lamyig collects only what it needs to run an open community travel guide. Browsing does not require an account. Contributions are public. We do not sell personal data or use advertising trackers.</p>
      </section>
      <section className={sectionClass}>
        <h2 className="text-base font-bold text-ink">What we process and why</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Email address and authentication data, to create and secure your account.</li>
          <li>Display name and contributor identifiers, to attribute and moderate contributions.</li>
          <li>Places, coordinates, descriptions, photos, contact details, notes, edits, reports, and feedback you submit, to operate the community knowledge base.</li>
          <li>Your device location only when you grant browser permission, to center the map or mark a place. Lamyig does not continuously track your location.</li>
          <li>Essential technical logs handled by hosting and infrastructure providers for reliability and security.</li>
        </ul>
      </section>
      <section className={sectionClass}>
        <h2 className="text-base font-bold text-ink">Public contributions</h2>
        <p>Place information, coordinates, photos, contact details, and Community Notes are intended to be public. Do not contribute private information, and only share a person’s contact details or photographs when you have their permission.</p>
      </section>
      <section className={sectionClass}>
        <h2 className="text-base font-bold text-ink">Service providers</h2>
        <p>Supabase provides authentication, database, and photo storage. Vercel hosts the web app. OpenFreeMap/Protomaps and OpenStreetMap provide map data, and LocationIQ, Photon, or Nominatim may receive a search query when map search is used. Their own privacy terms apply to those requests.</p>
      </section>
      <section className={sectionClass}>
        <h2 className="text-base font-bold text-ink">Retention and account deletion</h2>
        <p>Account data is kept while your account is active. Feedback and reports are kept until reviewed. You can permanently delete your account from Profile. This removes your authentication record, profile, notes, verifications, and reports. Factual places and place photos remain available to the community, with your attribution removed.</p>
      </section>
      <section className={sectionClass}>
        <h2 className="text-base font-bold text-ink">Your choices and rights</h2>
        <p>You may access or update your account, correct public place information, withdraw optional browser location permission, delete your account, or ask about access, correction, erasure, consent, or a grievance. Use the <Link to="/feedback" className="font-semibold text-accent-text underline">feedback form</Link> and include an email if you need a response.</p>
      </section>
      <section className={sectionClass}>
        <h2 className="text-base font-bold text-ink">Age and security</h2>
        <p>Accounts are for people aged 18 or older. Lamyig uses Supabase row-level security, restricted storage uploads, and encrypted HTTPS connections, but no internet service can promise absolute security.</p>
      </section>
      <p>This notice is designed around India’s Digital Personal Data Protection framework. It is operational product information, not legal advice.</p>
    </PageShell>
  )
}

function Terms() {
  return (
    <PageShell title="Contribution terms">
      <section className={sectionClass}>
        <h2 className="text-base font-bold text-ink">Keep it factual</h2>
        <p>Lamyig is a community knowledge base, not an advertising or booking platform. Contributions must be honest, useful to travellers, and free from spam, impersonation, unlawful content, and undisclosed promotion.</p>
      </section>
      <section className={sectionClass}>
        <h2 className="text-base font-bold text-ink">Permission and privacy</h2>
        <p>You must have the right to submit your text and photos. Only publish a host’s or service provider’s phone number, WhatsApp number, image, or other personal information with their permission. Never post sensitive personal data.</p>
      </section>
      <section className={sectionClass}>
        <h2 className="text-base font-bold text-ink">Open data licence</h2>
        <p>You agree that factual database contributions may be used and redistributed as part of Lamyig under the Open Database License 1.0. You license original text and photographs you submit under Creative Commons Attribution 4.0 so the open project can display, preserve, adapt, and redistribute them. You keep ownership of your original work.</p>
      </section>
      <section className={sectionClass}>
        <h2 className="text-base font-bold text-ink">Community editing and moderation</h2>
        <p>Signed-in contributors may edit place facts. Content may be corrected or removed when inaccurate, unsafe, infringing, promotional, or unlawful. Lamyig cannot guarantee that community information is complete or current; travellers should verify critical safety information locally.</p>
      </section>
      <section className={sectionClass}>
        <h2 className="text-base font-bold text-ink">Accounts</h2>
        <p>You must be at least 18, keep your account secure, and use one truthful account. You may delete your account from Profile. Public factual contributions can remain after deletion with attribution anonymized, as described in the <Link to="/privacy" className="font-semibold text-accent-text underline">privacy notice</Link>.</p>
      </section>
    </PageShell>
  )
}

export default function Legal() {
  return useLocation().pathname === '/terms' ? <Terms /> : <Privacy />
}
