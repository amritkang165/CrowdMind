import { Link } from 'react-router-dom'
import { Clock, HelpCircle, CheckCircle2 } from 'lucide-react'

import type { Question } from '../../lib/api'

function formatDateLabel(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

export function QuestionCard({ question }: { question: Question }) {
  const isOpen = question.status === 'open'

  return (
    <Link
      to={`/questions/${question.id}`}
      className="group relative block overflow-hidden rounded-[1.75rem] border border-white/5 bg-slate-900/30 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.2)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-slate-900/60 hover:shadow-[0_8px_32px_rgba(34,211,238,0.15)]"
    >
      <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-cyan-400/5 blur-3xl transition duration-500 group-hover:bg-cyan-400/10" />
      
      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-slate-400">
          <span className="rounded-full bg-white/5 px-3 py-1 font-medium text-slate-300">
            {question.category}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 font-medium text-slate-300">
            <HelpCircle className="h-3 w-3" />
            {question.type.replace('_', ' ')}
          </span>
          <span
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold tracking-[0.2em] ${
              isOpen
                ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                : 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300'
            }`}
          >
            {isOpen ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            {question.status}
          </span>
        </div>

        <h2 className="mt-5 font-heading text-2xl font-bold leading-tight text-white transition group-hover:text-cyan-50">
          {question.title}
        </h2>
        
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-400">
          {question.description}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-white/10">
              {question.author.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-slate-300">{question.author.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>Closes {formatDateLabel(question.closeAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
