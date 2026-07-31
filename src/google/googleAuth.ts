const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

let tokenClient: any = null
let accessToken: string | null = null
let tokenExpiresAt = 0

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('google-identity-script')) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.id = 'google-identity-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'))
    document.head.appendChild(script)
  })
}

export async function getAccessToken(): Promise<string> {
  // Reuse the existing token if it's still valid (with a 60s safety margin)
  if (accessToken && Date.now() < tokenExpiresAt - 60_000) {
    return accessToken
  }

  await loadGoogleScript()

  return new Promise((resolve, reject) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(response.error))
          return
        }
        accessToken = response.access_token
        tokenExpiresAt = Date.now() + response.expires_in * 1000
        resolve(accessToken!)
      },
    })
    tokenClient.requestAccessToken()
  })
}