const DEFAULT_NEXT_PATH = '/dashboard'

export function getSafeNextPath(nextPath?: string | null) {
  if (!nextPath) return DEFAULT_NEXT_PATH
  if (!nextPath.startsWith('/') || nextPath.startsWith('//')) return DEFAULT_NEXT_PATH
  return nextPath
}

export function buildAuthRedirectQuery(nextPath?: string | null, email?: string | null) {
  const params = new URLSearchParams()
  const safeNextPath = getSafeNextPath(nextPath)
  const normalizedEmail = email?.trim()

  if (safeNextPath !== DEFAULT_NEXT_PATH) {
    params.set('next', safeNextPath)
  }

  if (normalizedEmail) {
    params.set('email', normalizedEmail)
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}
