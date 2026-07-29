import { useState } from 'react'

const inputClass = 'rounded-[10px] border border-ink/[0.14] bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent-light'
const toggleButtonClass = 'flex-1 rounded-full border px-3 py-2 text-xs font-medium'

function toggleStyle(selected: boolean) {
  return {
    background: selected ? 'var(--color-ink)' : 'var(--color-surface)',
    color: selected ? 'var(--color-surface)' : 'var(--color-ink)',
    borderColor: selected ? 'var(--color-ink)' : 'rgba(32,31,35,0.14)',
  }
}

// Stored value is a plain string (attributes is untyped jsonb, same as
// every other field) - either "24x7" or "8:00 AM–8:00 PM", built from two
// native <input type="time"> values so entry is a couple of taps on mobile
// instead of typing a free-form, easy-to-mistype string.
function to12h(time24: string): string {
  const [hStr, m] = time24.split(':')
  const h = Number(hStr)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${m} ${period}`
}

function to24h(time12: string): string | null {
  const match = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i.exec(time12.trim())
  if (!match) return null
  let h = Number(match[1])
  const period = match[3].toUpperCase()
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${match[2]}`
}

function parseStoredValue(value: string): { open: string; close: string } | null {
  const [openPart, closePart] = value.split('–').map((s) => s.trim())
  if (!openPart || !closePart) return null
  const open = to24h(openPart)
  const close = to24h(closePart)
  return open && close ? { open, close } : null
}

interface HoursInputProps {
  value: string
  onChange: (value: string) => void
}

export default function HoursInput({ value, onChange }: HoursInputProps) {
  const is24x7 = value === '24x7'
  const parsed = is24x7 ? null : parseStoredValue(value)
  const [open, setOpen] = useState(parsed?.open ?? '')
  const [close, setClose] = useState(parsed?.close ?? '')

  function emit(nextOpen: string, nextClose: string) {
    onChange(nextOpen && nextClose ? `${to12h(nextOpen)}–${to12h(nextClose)}` : '')
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button type="button" onClick={() => onChange('24x7')} className={toggleButtonClass} style={toggleStyle(is24x7)}>
          Open 24x7
        </button>
        <button type="button" onClick={() => emit(open, close)} className={toggleButtonClass} style={toggleStyle(!is24x7)}>
          Specific hours
        </button>
      </div>
      {!is24x7 && (
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={open}
            onChange={(e) => { setOpen(e.target.value); emit(e.target.value, close) }}
            className={`${inputClass} flex-1`}
          />
          <span className="text-sm text-muted">to</span>
          <input
            type="time"
            value={close}
            onChange={(e) => { setClose(e.target.value); emit(open, e.target.value) }}
            className={`${inputClass} flex-1`}
          />
        </div>
      )}
    </div>
  )
}
