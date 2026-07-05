// Exact icon paths ported from the approved Claude Design mockup
// ("Lamyig Map Home") icon() method — kept 1:1 so the app matches the
// approved design, not a reinterpretation of it.

interface IconProps {
  color?: string
  size?: number
}

function Icon({ color = 'currentColor', size = 20, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

export function HomestayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.2V19h11v-8.8" />
    </Icon>
  )
}

export function MechanicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4l6.9 4v8L12 20l-6.9-4V8z" />
      <circle cx="12" cy="12" r="2.6" />
    </Icon>
  )
}

export function FuelIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5.5" y="4.5" width="8.5" height="15" rx="1.5" />
      <path d="M8 8h3.5" />
      <path d="M14 10.5h1.6a1.6 1.6 0 0 1 1.6 1.6v3.4a1.3 1.3 0 0 0 2.6 0V9l-1.7-2" />
      <path d="M4 19.5h11.5" />
    </Icon>
  )
}

export function ToiletIcon({ color = 'currentColor', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4.5" width="16" height="15" rx="3.5" />
      <text x="12" y="15.3" textAnchor="middle" fontSize="8.5" fontWeight={700} fill={color} stroke="none" fontFamily="inherit">WC</text>
    </svg>
  )
}

export function CampingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5 4.5 19h15z" />
      <path d="M9.5 19 12 14l2.5 5" />
    </Icon>
  )
}

export const CATEGORY_ICONS: Record<string, (props: IconProps) => React.ReactElement> = {
  homestay: HomestayIcon,
  mechanic: MechanicIcon,
  fuel: FuelIcon,
  toilet: ToiletIcon,
  camping: CampingIcon,
}
