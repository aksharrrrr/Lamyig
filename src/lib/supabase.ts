import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null

// Shown across every page that needs supabase - kept in one place so it
// can't drift into slightly different wordings per file again. Only ever
// shown to a contributor running their own local copy without a
// configured backend (see CONTRIBUTING.md) - production always has these
// env vars set.
export const BACKEND_NOT_CONFIGURED_MESSAGE =
  "This copy of Lamyig isn't connected to a backend yet. Copy .env.example to .env, add your Supabase project's URL and anon key, and restart the dev server - full steps in CONTRIBUTING.md."
