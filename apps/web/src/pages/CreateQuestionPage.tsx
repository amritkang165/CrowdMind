import { useState, startTransition, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PenTool, Calendar, List, Tag, Save } from 'lucide-react'

import { createQuestion, startDemoSession, type QuestionType } from '../lib/api'
import { useAppStore } from '../store/app-store'
import { SiteHeader } from '../components/layout/SiteHeader'

function toDateTimeLocalValue(date = new Date(Date.now() + 24 * 60 * 60 * 1000)) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

export function CreateQuestionPage() {
  const navigate = useNavigate()
  const { authToken, currentUser, setSession } = useAppStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Product')
  const [type, setType] = useState<QuestionType>('binary')
  const [optionsText, setOptionsText] = useState('Option A\nOption B')
  const [closeAt, setCloseAt] = useState(toDateTimeLocalValue())
  const [formError, setFormError] = useState('')
  const [submitState, setSubmitState] = useState<'idle' | 'loading'>('idle')

  async function ensureSession() {
    if (authToken) return authToken
    const session = await startDemoSession()
    setSession(session.token, session.user)
    return session.token
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitState('loading')

    try {
      const token = await ensureSession()
      const options = optionsText
        .split('\n')
        .map((opt) => opt.trim())
        .filter(Boolean)
        
      const question = await createQuestion(
        {
          title,
          description,
          type,
          category,
          options: type === 'multiple_choice' ? options : [],
          closeAt: new Date(closeAt).toISOString()
        },
        token
      )

      setFormError('')
      startTransition(() => {
        navigate(`/questions/${question.id}`)
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create question')
    } finally {
      setSubmitState('idle')
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
      <SiteHeader />

      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="rounded-[2.5rem] border border-white/5 bg-slate-900/40 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300">
            <PenTool className="h-4 w-4" />
            Create Prompt
          </div>
          
          <h1 className="mt-6 font-heading text-4xl font-bold leading-tight text-white">
            Publish a new <br />
            <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">
              forecast market.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">
            Keep the wording specific and unambiguously resolvable. Provide clear criteria in the description.
          </p>

          <div className="mt-10 space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Will CrowdMind reach 1,000 active users in its first month?"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-5 py-4 text-base font-medium text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Resolution Criteria (Description)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe exactly how this question will be judged and what outcome counts as resolved..."
                className="min-h-36 w-full resize-y rounded-2xl border border-white/10 bg-slate-950/50 px-5 py-4 text-base font-medium leading-relaxed text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                required
                minLength={20}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
                  <Tag className="h-4 w-4" /> Category
                </label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-5 py-4 text-base font-medium text-white outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
                  <List className="h-4 w-4" /> Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as QuestionType)}
                  className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/50 px-5 py-4 text-base font-medium text-white outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                >
                  <option value="binary" className="bg-slate-900">Binary (Yes/No)</option>
                  <option value="multiple_choice" className="bg-slate-900">Multiple Choice</option>
                  <option value="probability" className="bg-slate-900">Probability</option>
                </select>
              </div>

              <div className="space-y-3 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
                  <Calendar className="h-4 w-4" /> Close Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={closeAt}
                  onChange={(e) => setCloseAt(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-5 py-4 text-base font-medium text-white outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 [color-scheme:dark]"
                  required
                />
              </div>
            </div>

            {type === 'multiple_choice' && (
              <div className="space-y-3 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-6">
                <label className="text-sm font-semibold uppercase tracking-wider text-fuchsia-300">
                  Answer Options
                </label>
                <p className="text-xs text-fuchsia-200/60 mb-2">Provide one option per line.</p>
                <textarea
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  className="min-h-28 w-full resize-y rounded-xl border border-fuchsia-500/30 bg-slate-950/50 px-5 py-4 text-base font-medium text-white outline-none transition focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400"
                  placeholder="Option A&#10;Option B&#10;Option C"
                />
              </div>
            )}

            {formError && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm font-medium text-rose-300">
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center">
              <button
                type="submit"
                disabled={submitState === 'loading'}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-bold text-slate-900 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto md:min-w-48"
              >
                <Save className="h-5 w-5" />
                {submitState === 'loading' ? 'Publishing...' : 'Publish Market'}
              </button>
              <p className="text-sm font-medium text-slate-500 text-center md:text-left">
                {currentUser
                  ? `Publishing as author: ${currentUser.username}`
                  : 'A demo author session will be created automatically.'}
              </p>
            </div>
          </div>
        </form>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-white/5 bg-slate-900/40 p-8 backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Authoring Best Practices
            </p>
            <ul className="mt-6 space-y-4 text-sm font-medium leading-relaxed text-slate-300">
              <li className="flex gap-3">
                <span className="text-cyan-400">1.</span>
                Use a title that is completely unambiguous. The user should not have to read the description to understand the core question.
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400">2.</span>
                Include edge cases in your resolution criteria. What happens if an event is delayed? What sources will be used?
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400">3.</span>
                Close times must be in the future. Once the close time is reached, no more predictions can be submitted.
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  )
}
