const TOKEN_KEY = 'timetracker-token'

type TokenListener = (token: string | null) => void
const listeners: Set<TokenListener> = new Set()

export function subscribeToken(listener: TokenListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notify(token: string | null): void {
  listeners.forEach((fn) => fn(token))
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  notify(token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  notify(null)
}