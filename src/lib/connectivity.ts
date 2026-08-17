export const OFFLINE_CONTRIBUTION_MESSAGE = "You're offline. Your saved guide is still here—connect to contribute."
export const OFFLINE_ACCOUNT_MESSAGE = "You're offline. Connect to manage your account."

export function connectionAwareError(error: unknown, fallback: string): string {
  const message = error instanceof Error
    ? error.message
    : (typeof error === 'object' && error && 'message' in error ? String(error.message) : '')

  if (!navigator.onLine || /failed to fetch|network|offline|load failed/i.test(message)) {
    return OFFLINE_CONTRIBUTION_MESSAGE
  }
  return message || fallback
}
