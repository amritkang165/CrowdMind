import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { useAppStore } from './store/app-store'

vi.mock('./lib/api', () => ({
  fetchHealth: vi.fn().mockResolvedValue({
    status: 'ok',
    service: 'crowdmind-api',
    timestamp: '2026-04-20T16:00:00.000Z'
  })
}))

describe('App', () => {
  beforeEach(() => {
    useAppStore.setState({
      healthStatus: 'idle',
      apiMessage: 'Waiting for API handshake'
    })
  })

  it('renders the foundation shell', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    expect(
      screen.getByText(/Forecasts, credibility, and live consensus/i)
    ).toBeInTheDocument()

    expect(await screen.findByText(/API healthy as of/i)).toBeInTheDocument()
  })
})
