import { useEffect, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'

import { fetchHealth } from './lib/api'
import { useAppStore } from './store/app-store'

function formatHealthMessage(timestamp: string) {
  return `API healthy as of ${new Date(timestamp).toLocaleTimeString()}`
}

function HomePage() {
  const { healthStatus, apiMessage, setApiMessage, setHealthStatus } =
    useAppStore()
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadHealth() {
      setHealthStatus('loading')

      try {
        const health = await fetchHealth()

        if (!isActive) {
          return
        }

        setHealthStatus('ready')
        setApiMessage(formatHealthMessage(health.timestamp))
        setErrorMessage('')
      } catch (error) {
        if (!isActive) {
          return
        }

        setHealthStatus('error')
        setApiMessage('API connection failed')
        setErrorMessage(
          error instanceof Error ? error.message : 'Unexpected API error'
        )
      }
    }

    void loadHealth()

    return () => {
      isActive = false
    }
  }, [setApiMessage, setHealthStatus])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.28),_transparent_28%),linear-gradient(180deg,_#08111f_0%,_#0f172a_52%,_#162033_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 lg:px-10">
        <header className="mb-12 flex items-center justify-between rounded-full border border-white/12 bg-white/7 px-5 py-3 backdrop-blur">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-300">
              CrowdMind
            </p>
            <p className="text-sm text-slate-300">
              Phase 1 foundation environment
            </p>
          </div>
          <nav className="flex gap-4 text-sm text-slate-200">
            <Link to="/" className="transition hover:text-amber-300">
              Home
            </Link>
            <Link to="/roadmap" className="transition hover:text-amber-300">
              Roadmap
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 gap-8 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/12 bg-slate-950/40 p-8 shadow-2xl shadow-slate-950/35 backdrop-blur">
            <p className="mb-4 font-mono text-sm uppercase tracking-[0.32em] text-sky-300">
              Collective intelligence platform
            </p>
            <h1 className="max-w-3xl font-serif text-5xl leading-tight text-white md:text-6xl">
              Forecasts, credibility, and live consensus in one product loop.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              The foundation phase gives us a stable React frontend, an Express
              API, auth scaffolding, environment validation, and a testable path
              from browser to backend.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <article className="rounded-3xl border border-white/10 bg-white/6 p-5">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
                  Questions
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">3</p>
                <p className="mt-2 text-sm text-slate-300">
                  Planned formats: binary, multiple choice, probability
                </p>
              </article>
              <article className="rounded-3xl border border-white/10 bg-white/6 p-5">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
                  Auth
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">Ready</p>
                <p className="mt-2 text-sm text-slate-300">
                  Register, login, and protected profile route
                </p>
              </article>
              <article className="rounded-3xl border border-white/10 bg-white/6 p-5">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
                  Consensus
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">Next</p>
                <p className="mt-2 text-sm text-slate-300">
                  Weighted aggregation begins in Phase 2 and 3
                </p>
              </article>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-emerald-400/25 bg-emerald-400/10 p-6 backdrop-blur">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-emerald-200">
                API Handshake
              </p>
              <p className="mt-4 text-2xl font-semibold text-white">
                {healthStatus === 'ready' ? 'Connected' : 'Checking'}
              </p>
              <p className="mt-3 text-sm leading-7 text-emerald-50/90">
                {apiMessage}
              </p>
              {errorMessage ? (
                <p className="mt-3 text-sm text-rose-200">{errorMessage}</p>
              ) : null}
            </section>

            <section className="rounded-[2rem] border border-white/12 bg-slate-900/60 p-6 backdrop-blur">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
                Foundation checklist
              </p>
              <ul className="mt-4 space-y-4 text-sm leading-7 text-slate-200">
                <li>React + Vite app shell with shared state via Zustand</li>
                <li>Express API with typed config and secured headers</li>
                <li>JWT auth skeleton for register, login, and me</li>
                <li>Workspace scripts for `dev`, `build`, `test`, and `lint`</li>
              </ul>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}

function RoadmapPage() {
  const steps = [
    'Phase 1: foundation, auth, validation, testing',
    'Phase 2: question creation and browse flows',
    'Phase 3: prediction submission and consensus',
    'Phase 4: resolution, credibility, and leaderboard'
  ]

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 backdrop-blur">
        <p className="font-mono text-xs uppercase tracking-[0.32em] text-sky-300">
          Delivery roadmap
        </p>
        <h1 className="mt-4 font-serif text-4xl text-white">
          We now have a buildable base to grow the product phase by phase.
        </h1>
        <ol className="mt-8 space-y-4 text-lg text-slate-200">
          {steps.map((step) => (
            <li
              key={step}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
            >
              {step}
            </li>
          ))}
        </ol>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-full border border-amber-300/40 px-4 py-2 text-sm text-amber-200 transition hover:bg-amber-300/10"
        >
          Back home
        </Link>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/roadmap" element={<RoadmapPage />} />
    </Routes>
  )
}
