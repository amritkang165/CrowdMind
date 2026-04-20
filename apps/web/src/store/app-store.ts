import { create } from 'zustand'

type HealthStatus = 'idle' | 'loading' | 'ready' | 'error'

type AppState = {
  healthStatus: HealthStatus
  apiMessage: string
  setHealthStatus: (status: HealthStatus) => void
  setApiMessage: (message: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  healthStatus: 'idle',
  apiMessage: 'Waiting for API handshake',
  setHealthStatus: (healthStatus) => set({ healthStatus }),
  setApiMessage: (apiMessage) => set({ apiMessage })
}))
