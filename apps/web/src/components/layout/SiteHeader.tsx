import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BrainCircuit, Compass, LayoutDashboard, PlusCircle, LogOut, User } from 'lucide-react'

import { useAppStore } from '../../store/app-store'
import { startDemoSession } from '../../lib/api'

export function SiteHeader() {
  const { currentUser, clearSession, setSession } = useAppStore()
  const [sessionState, setSessionState] = useState<'idle' | 'loading'>('idle')
  const [sessionError, setSessionError] = useState('')

  async function handleStartDemoSession() {
    setSessionState('loading')

    try {
      const session = await startDemoSession()
      setSession(session.token, session.user)
      setSessionError('')
    } catch (error) {
      setSessionError(
        error instanceof Error ? error.message : 'Unable to start demo session'
      )
    } finally {
      setSessionState('idle')
    }
  }

  return (
    <header className="mb-12 flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-slate-900/40 px-6 py-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between transition-all">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 shadow-lg shadow-cyan-500/20">
          <BrainCircuit className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-white">
            CrowdMind
          </h1>
          <p className="text-sm text-slate-400">
            Phase 2: Question System
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:items-end">
        <nav className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-300">
          <Link to="/" className="flex items-center gap-2 transition hover:text-cyan-400">
            <LayoutDashboard className="h-4 w-4" />
            Feed
          </Link>
          <Link to="/questions/new" className="flex items-center gap-2 transition hover:text-cyan-400">
            <PlusCircle className="h-4 w-4" />
            Create
          </Link>
          <Link to="/roadmap" className="flex items-center gap-2 transition hover:text-fuchsia-400">
            <Compass className="h-4 w-4" />
            Roadmap
          </Link>
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          {currentUser ? (
            <>
              <div className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 shadow-[inset_0_0_12px_rgba(34,211,238,0.1)]">
                <User className="h-4 w-4" />
                <span>{currentUser.username}</span>
              </div>
              <button
                type="button"
                onClick={clearSession}
                className="group flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4 transition group-hover:scale-110" />
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void handleStartDemoSession()}
              disabled={sessionState === 'loading'}
              className="group flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 text-sm font-medium text-cyan-50 shadow-[0_0_20px_rgba(34,211,238,0.15)] transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <User className="h-4 w-4 transition group-hover:scale-110" />
              {sessionState === 'loading' ? 'Starting...' : 'Use Demo Author'}
            </button>
          )}
        </div>

        {sessionError ? (
          <p className="text-sm text-rose-400">{sessionError}</p>
        ) : null}
      </div>
    </header>
  )
}
