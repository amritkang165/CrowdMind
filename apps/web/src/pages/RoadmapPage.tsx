import { Link } from 'react-router-dom'
import { ArrowLeft, Rocket, CheckCircle2, Circle } from 'lucide-react'

import { SiteHeader } from '../components/layout/SiteHeader'

export function RoadmapPage() {
  const steps = [
    { text: 'Phase 1: foundation, auth, validation, testing', done: true },
    { text: 'Phase 2: question creation and browse flows', done: true },
    { text: 'Phase 3: prediction submission and consensus', done: true },
    { text: 'Phase 4: resolution mechanism (MVP)', done: false }
  ]

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
      <SiteHeader />
      
      <div className="mx-auto mt-8 w-full max-w-3xl rounded-[2.5rem] border border-white/5 bg-slate-900/40 p-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-fuchsia-300">
          <Rocket className="h-4 w-4" />
          Delivery Roadmap
        </div>
        
        <h1 className="mt-6 font-heading text-4xl font-bold leading-tight text-white md:text-5xl">
          Building the future of <br />
          <span className="bg-gradient-to-r from-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
            collective forecasting.
          </span>
        </h1>
        
        <p className="mt-6 text-lg leading-relaxed text-slate-400">
          We now have a robust, buildable base to grow the product phase by phase.
          Track our progress below.
        </p>
        
        <div className="mt-12 space-y-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center gap-5 rounded-2xl border p-6 transition-all ${
                step.done
                  ? 'border-cyan-400/20 bg-cyan-400/5'
                  : 'border-white/5 bg-white/5'
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="h-8 w-8 shrink-0 text-cyan-400" />
              ) : (
                <Circle className="h-8 w-8 shrink-0 text-slate-600" />
              )}
              <span
                className={`text-lg font-medium ${
                  step.done ? 'text-white' : 'text-slate-400'
                }`}
              >
                {step.text}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-12 border-t border-white/10 pt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold tracking-wider text-slate-300 transition hover:text-cyan-400"
          >
            <ArrowLeft className="h-5 w-5" />
            BACK TO FEED
          </Link>
        </div>
      </div>
    </div>
  )
}
