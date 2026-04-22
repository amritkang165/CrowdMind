import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Layers, Target, Filter, Plus } from 'lucide-react'

import { fetchHealth, fetchQuestions, type Question, type QuestionType } from '../lib/api'
import { useAppStore } from '../store/app-store'
import { SiteHeader } from '../components/layout/SiteHeader'
import { QuestionCard } from '../components/questions/QuestionCard'

function formatHealthMessage(timestamp: string) {
  return `Connected as of ${new Date(timestamp).toLocaleTimeString()}`
}

export function HomePage() {
  const {
    healthStatus,
    apiMessage,
    setApiMessage,
    setHealthStatus,
    currentUser
  } = useAppStore()
  
  const [healthError, setHealthError] = useState('')
  const [questionsError, setQuestionsError] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedType, setSelectedType] = useState<QuestionType | ''>('')
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)

  useEffect(() => {
    let isActive = true
    async function loadFilterOptions() {
      try {
        const allQuestions = await fetchQuestions()
        if (!isActive) return
        setCategoryOptions([...new Set(allQuestions.map((q) => q.category))].sort())
      } catch {
        if (!isActive) return
        setCategoryOptions([])
      }
    }
    void loadFilterOptions()
    return () => { isActive = false }
  }, [])

  useEffect(() => {
    let isActive = true
    async function loadHealth() {
      setHealthStatus('loading')
      try {
        const health = await fetchHealth()
        if (!isActive) return
        setHealthStatus('ready')
        setApiMessage(formatHealthMessage(health.timestamp))
        setHealthError('')
      } catch (error) {
        if (!isActive) return
        setHealthStatus('error')
        setApiMessage('API connection failed')
        setHealthError(error instanceof Error ? error.message : 'Unexpected API error')
      }
    }
    void loadHealth()
    return () => { isActive = false }
  }, [setApiMessage, setHealthStatus])

  useEffect(() => {
    let isActive = true
    async function loadQuestions() {
      setIsLoadingQuestions(true)
      try {
        const nextQuestions = await fetchQuestions({
          category: selectedCategory || undefined,
          type: selectedType || undefined
        })
        if (!isActive) return
        setQuestions(nextQuestions)
        setQuestionsError('')
      } catch (error) {
        if (!isActive) return
        setQuestions([])
        setQuestionsError(error instanceof Error ? error.message : 'Unable to load CrowdMind questions')
      } finally {
        if (isActive) setIsLoadingQuestions(false)
      }
    }
    void loadQuestions()
    return () => { isActive = false }
  }, [selectedCategory, selectedType])

  const questionStats = useMemo(() => {
    return {
      total: questions.length,
      open: questions.filter((q) => q.status === 'open').length,
      categories: new Set(questions.map((q) => q.category)).size
    }
  }, [questions])

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 lg:px-10">
      <SiteHeader />

      <section className="grid flex-1 gap-8 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-[2.5rem] border border-white/5 bg-slate-900/40 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300">
            <Activity className="h-4 w-4" />
            Forecast Feed
          </div>
          
          <h2 className="mt-6 font-heading text-4xl font-bold leading-tight text-white md:text-5xl">
            Explore the active <br />
            <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">
              markets of opinion.
            </span>
          </h2>
          
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            Browse forecast prompts, inspect prediction data, and create new questions. 
            Join the collective intelligence to predict the future accurately.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <article className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-6 transition hover:border-white/10 hover:bg-white/10">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl group-hover:bg-cyan-400/20 transition duration-500" />
              <Layers className="h-6 w-6 text-cyan-400" />
              <p className="mt-4 text-3xl font-bold text-white">{questionStats.total}</p>
              <p className="mt-1 text-sm font-medium text-slate-400">Questions in feed</p>
            </article>
            
            <article className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-6 transition hover:border-white/10 hover:bg-white/10">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl group-hover:bg-emerald-400/20 transition duration-500" />
              <Target className="h-6 w-6 text-emerald-400" />
              <p className="mt-4 text-3xl font-bold text-white">{questionStats.open}</p>
              <p className="mt-1 text-sm font-medium text-slate-400">Open markets</p>
            </article>
            
            <article className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-6 transition hover:border-white/10 hover:bg-white/10">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-fuchsia-500/10 blur-2xl group-hover:bg-fuchsia-500/20 transition duration-500" />
              <Filter className="h-6 w-6 text-fuchsia-400" />
              <p className="mt-4 text-3xl font-bold text-white">{questionStats.categories}</p>
              <p className="mt-1 text-sm font-medium text-slate-400">Categories</p>
            </article>
          </div>

          <section className="mt-10 flex flex-col gap-4 rounded-[2rem] border border-white/5 bg-slate-950/50 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none rounded-full border border-white/10 bg-white/5 py-2.5 pl-5 pr-10 text-sm font-medium text-slate-200 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50"
                >
                  <option value="" className="bg-slate-900">All categories</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <Filter className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as QuestionType | '')}
                  className="appearance-none rounded-full border border-white/10 bg-white/5 py-2.5 pl-5 pr-10 text-sm font-medium text-slate-200 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50"
                >
                  <option value="" className="bg-slate-900">All types</option>
                  <option value="binary" className="bg-slate-900">Binary</option>
                  <option value="multiple_choice" className="bg-slate-900">Multiple choice</option>
                  <option value="probability" className="bg-slate-900">Probability</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <Filter className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <Link
              to="/questions/new"
              className="group flex items-center gap-2 rounded-full bg-white text-slate-900 px-5 py-2.5 text-sm font-semibold transition hover:bg-cyan-50"
            >
              <Plus className="h-4 w-4 transition group-hover:rotate-90" />
              {currentUser ? 'Create Question' : 'Open Creator'}
            </Link>
          </section>

          {questionsError && (
            <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-200">
              {questionsError}
            </div>
          )}

          <section className="mt-8 grid gap-5">
            {isLoadingQuestions && (
              <div className="flex h-32 items-center justify-center rounded-[1.75rem] border border-white/5 bg-white/5">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-500 border-t-cyan-400" />
              </div>
            )}

            {!isLoadingQuestions && questions.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-white/5 bg-white/5 py-12 text-center">
                <Target className="h-12 w-12 text-slate-500" />
                <p className="mt-4 text-base font-medium text-slate-300">No questions found</p>
                <p className="mt-1 text-sm text-slate-500">Try adjusting your filters to see more results.</p>
              </div>
            )}

            {!isLoadingQuestions && questions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-cyan-400/5 p-8 backdrop-blur-xl">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              API Status
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                {healthStatus === 'ready' && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex h-3 w-3 rounded-full ${healthStatus === 'ready' ? 'bg-cyan-500' : healthStatus === 'error' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
              </div>
              <p className="font-heading text-2xl font-bold text-white">
                {healthStatus === 'ready' ? 'Connected' : healthStatus === 'error' ? 'Disconnected' : 'Checking'}
              </p>
            </div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-cyan-100/70">
              {apiMessage}
            </p>
            {healthError && (
              <p className="mt-3 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">{healthError}</p>
            )}
          </section>

          <section className="rounded-[2rem] border border-white/5 bg-slate-900/40 p-8 backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              System Overview
            </p>
            <ul className="mt-6 space-y-4 text-sm font-medium leading-relaxed text-slate-300">
              <li className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-500" />
                List and filter questions across seeded topic categories.
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-500" />
                Open detail pages for each question and review current consensus.
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-500" />
                Create new forecast prompts using the demo author session.
              </li>
            </ul>
          </section>
        </aside>
      </section>
    </div>
  )
}
