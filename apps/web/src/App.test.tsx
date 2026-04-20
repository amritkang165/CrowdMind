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
  }),
  fetchQuestions: vi.fn().mockResolvedValue([
    {
      id: 'question-1',
      title: 'Will CrowdMind onboard 100 beta testers this quarter?',
      description:
        'This asks whether the platform reaches 100 beta testers before the current quarter ends.',
      type: 'binary',
      options: ['Yes', 'No'],
      category: 'Product',
      closeAt: '2026-04-28T10:00:00.000Z',
      resolvedAt: null,
      createdAt: '2026-04-20T10:00:00.000Z',
      author: {
        id: 'user-1',
        name: 'demoauthor'
      },
      status: 'open'
    }
  ]),
  fetchQuestionDetail: vi.fn().mockResolvedValue({
    question: {
      id: 'question-1',
      title: 'Will CrowdMind onboard 100 beta testers this quarter?',
      description:
        'This asks whether the platform reaches 100 beta testers before the current quarter ends.',
      type: 'binary',
      options: ['Yes', 'No'],
      category: 'Product',
      closeAt: '2026-04-28T10:00:00.000Z',
      resolvedAt: null,
      createdAt: '2026-04-20T10:00:00.000Z',
      author: {
        id: 'user-1',
        name: 'demoauthor'
      },
      status: 'open'
    },
    aggregate: {
      totalPredictions: 1,
      weightedConsensus: 72,
      optionBreakdown: [
        { option: 'Yes', percentage: 72 },
        { option: 'No', percentage: 28 }
      ],
      leadingOption: 'Yes',
      averageConfidence: 72,
      latestPredictionAt: '2026-04-20T11:00:00.000Z'
    }
  }),
  fetchMyPrediction: vi.fn().mockResolvedValue(null),
  startDemoSession: vi.fn(),
  createQuestion: vi.fn(),
  submitPrediction: vi.fn()
}))

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useAppStore.setState({
      healthStatus: 'idle',
      apiMessage: 'Waiting for API handshake',
      authToken: null,
      currentUser: null
    })
  })

  it('renders the question feed shell', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    expect(
      screen.getByText(/Create prompts, browse active markets of opinion/i)
    ).toBeInTheDocument()
    expect(await screen.findByText(/API healthy as of/i)).toBeInTheDocument()
    expect(
      await screen.findByText(/Will CrowdMind onboard 100 beta testers/i)
    ).toBeInTheDocument()
  })

  it('renders the create page', () => {
    render(
      <MemoryRouter initialEntries={['/questions/new']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText(/Publish the next forecasting prompt/i)).toBeInTheDocument()
  })
})
