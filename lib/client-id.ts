/**
 * Client-side visitor ID for rate limiting.
 * Generates a UUID v4 on first visit and persists in localStorage.
 */

export function getVisitorId(): string {
  if (typeof window === 'undefined') return ''

  try {
    let id = localStorage.getItem('visitorId')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('visitorId', id)
    }
    return id
  } catch {
    return ''
  }
}
