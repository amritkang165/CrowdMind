const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:4000'

export type ApiHealth = {
  status: string
  service: string
  timestamp: string
}

export async function fetchHealth(): Promise<ApiHealth> {
  const response = await fetch(`${API_BASE_URL}/health`)

  if (!response.ok) {
    throw new Error('Unable to reach the CrowdMind API')
  }

  return response.json() as Promise<ApiHealth>
}
