import { create } from 'zustand'

import type { ApiUser } from '../lib/api'

type HealthStatus = 'idle' | 'loading' | 'ready' | 'error'

const SESSION_STORAGE_KEY = 'crowdmind-session'

type StoredSession = {
  authToken: string
  currentUser: ApiUser
}

function loadStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY)

  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(rawSession) as StoredSession
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

function persistSession(session: StoredSession | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

const initialSession = loadStoredSession()

type AppState = {
  healthStatus: HealthStatus
  apiMessage: string
  authToken: string | null
  currentUser: ApiUser | null
  setHealthStatus: (status: HealthStatus) => void
  setApiMessage: (message: string) => void
  setSession: (authToken: string, currentUser: ApiUser) => void
  clearSession: () => void
}

export const useAppStore = create<AppState>((set) => ({
  healthStatus: 'idle',
  apiMessage: 'Waiting for API handshake',
  authToken: initialSession?.authToken ?? null,
  currentUser: initialSession?.currentUser ?? null,
  setHealthStatus: (healthStatus) => set({ healthStatus }),
  setApiMessage: (apiMessage) => set({ apiMessage }),
  setSession: (authToken, currentUser) => {
    persistSession({ authToken, currentUser })
    set({ authToken, currentUser })
  },
  clearSession: () => {
    persistSession(null)
    set({ authToken: null, currentUser: null })
  }
}))
