import { useCallback } from 'react'
import { useLocation, useNavigate, type Location } from 'react-router'

export interface OverlayLocationState {
  background?: Location
  mapReturnSteps?: number
}

export function overlayLinkState(location: Location): OverlayLocationState {
  const current = location.state as OverlayLocationState | null
  return { ...current, background: current?.background ?? location }
}

/** Close an in-app overlay through history; close a cold direct URL to Home. */
export function useOverlayClose(): () => void {
  const location = useLocation()
  const navigate = useNavigate()

  return useCallback(() => {
    const state = location.state as OverlayLocationState | null
    if (state?.background) navigate(-1)
    else navigate('/', { replace: true })
  }, [location.state, navigate])
}
