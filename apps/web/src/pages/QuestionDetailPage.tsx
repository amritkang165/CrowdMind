import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Clock, HelpCircle, CheckCircle2, UserCircle, PieChart, Info, ChevronRight, List } from 'lucide-react'

import {
  fetchQuestionDetail,
  fetchMyPrediction,
  startDemoSession,
  submitPrediction,
  resolveQuestion,
  type Question,
  type QuestionAggregate,
  type Prediction
} from '../lib/api'
import { useAppStore } from '../store/app-store'
import { SiteHeader } from '../components/layout/SiteHeader'

function formatDateLabel(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

function formatPercent(value: number | null) {
  if (value === null) return 'No consensus yet'
  return `${value.toFixed(1)}%`
}

export function QuestionDetailPage() {
  const { questionId = '' } = useParams()
  const { authToken, currentUser, setSession } = useAppStore()
  const [question, setQuestion] = useState<Question | null>(null)
  const [aggregate, setAggregate] = useState<QuestionAggregate | null>(null)
  const [myPrediction, setMyPrediction] = useState<Prediction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [predictionError, setPredictionError] = useState('')
  const [submitState, setSubmitState] = useState<'idle' | 'loading'>('idle')
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [probability, setProbability] = useState(50)
  const [confidence, setConfidence] = useState(70)
  const [resolveOutcome, setResolveOutcome] = useState('')
  const [resolveState, setResolveState] = useState<'idle' | 'loading'>('idle')
  const [resolveError, setResolveError] = useState('')

  async function ensureSession() {
    if (authToken) return authToken
    const session = await startDemoSession()
    setSession(session.token, session.user)
    return session.token
  }

  useEffect(() => {
    let isActive = true
    async function loadQuestion() {
      setIsLoading(true)
      try {
        const detail = await fetchQuestionDetail(questionId)
        if (!isActive) return
        setQuestion(detail.question)
        setAggregate(detail.aggregate)
        setConfidence(70)
        if (detail.question.type === 'probability') {
          setProbability(50)
          setSelectedOption(detail.question.options[0] ?? '')
        } else {
          setSelectedOption(detail.question.options[0] ?? '')
        }
        setErrorMessage('')
      } catch (error) {
        if (!isActive) return
        setQuestion(null)
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load question')
      } finally {
        if (isActive) setIsLoading(false)
      }
    }
    void loadQuestion()
    return () => { isActive = false }
  }, [questionId])

  useEffect(() => {
    if (!question || !authToken) return
    const activeQuestion = question
    const activeToken = authToken
    let isActive = true
    async function loadMyPrediction() {
      try {
        const prediction = await fetchMyPrediction(activeQuestion.id, activeToken)
        if (!isActive) return
        setMyPrediction(prediction)
        if (prediction) {
          setConfidence(prediction.confidence)
          if (activeQuestion.type === 'probability') {
            setProbability(prediction.probability ?? 50)
          } else {
            setSelectedOption(prediction.selectedOption ?? activeQuestion.options[0] ?? '')
          }
        }
      } catch {
        if (!isActive) setMyPrediction(null)
      }
    }
    void loadMyPrediction()
    return () => { isActive = false }
  }, [authToken, question])

  const activePrediction = authToken ? myPrediction : null
  const isAuthor = !!(currentUser && question && question.author.id === currentUser.id)
  const canResolve = isAuthor && question?.status === 'closed'

  async function handleSubmitPrediction() {
    if (!question) return
    setSubmitState('loading')
    try {
      const token = await ensureSession()
      const response = await submitPrediction(
        question.id,
        {
          selectedOption: question.type === 'probability' ? null : selectedOption,
          probability: question.type === 'probability' ? probability : null,
          confidence
        },
        token
      )
      setMyPrediction(response.prediction)
      setAggregate(response.aggregate)
      setPredictionError('')
    } catch (error) {
      setPredictionError(error instanceof Error ? error.message : 'Unable to submit prediction')
    } finally {
      setSubmitState('idle')
    }
  }

  async function handleResolve() {
    if (!question || !authToken || !resolveOutcome) return
    setResolveState('loading')
    try {
      const result = await resolveQuestion(question.id, resolveOutcome, authToken)
      setQuestion(result.question)
      setResolveError('')
    } catch (error) {
      setResolveError(error instanceof Error ? error.message : 'Unable to resolve question')
    } finally {
      setResolveState('idle')
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 lg:px-10">
      <SiteHeader />

      {isLoading && (
        <div className="flex h-64 items-center justify-center rounded-[2.5rem] border border-white/5 bg-slate-900/40 backdrop-blur-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-500 border-t-cyan-400" />
        </div>
      )}

      {!isLoading && errorMessage && (
        <div className="rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-8 text-center backdrop-blur-xl">
          <Info className="mx-auto h-8 w-8 text-rose-400 mb-4" />
          <p className="text-lg font-medium text-rose-200">{errorMessage}</p>
        </div>
      )}

      {!isLoading && question && (
        <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="rounded-[2.5rem] border border-white/5 bg-slate-900/40 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                {question.category}
              </span>
              <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                <HelpCircle className="h-3 w-3" />
                {question.type.replace('_', ' ')}
              </span>
              <span
                className={`flex items-center gap-1 rounded-full border px-3 py-1 ${
                  question.status === 'open'
                    ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                    : 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300'
                }`}
              >
                {question.status === 'open' ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                {question.status}
              </span>
            </div>

            <h1 className="mt-6 font-heading text-3xl font-bold leading-tight text-white md:text-4xl">
              {question.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-400">
              {question.description}
            </p>

            <section className="mt-10 rounded-[1.75rem] border border-white/5 bg-slate-950/50 p-6">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <List className="h-4 w-4" /> Expected Answer Format
              </p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {question.options.map((option) => (
                  <li
                    key={option}
                    className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-sm font-medium text-slate-200"
                  >
                    <div className="h-2 w-2 rounded-full bg-cyan-400/50" />
                    {option}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10 overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-cyan-400/5 p-8 relative">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="flex items-center gap-2 font-heading text-2xl font-bold text-white">
                    Submit Prediction
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                    <UserCircle className="h-5 w-5" />
                    {currentUser
                      ? currentUser.username
                      : 'Demo session will be created'}
                  </div>
                </div>

                {question.status !== 'open' ? (
                  <div className="mt-6 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-4 text-center">
                    <p className="text-sm font-medium text-fuchsia-200">
                      This market is closed. No new predictions can be submitted.
                    </p>
                  </div>
                ) : (
                  <div className="mt-8 space-y-8">
                    {question.type !== 'probability' ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {question.options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setSelectedOption(option)}
                            className={`group flex items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all ${
                              selectedOption === option
                                ? 'border-cyan-400 bg-cyan-400/10 text-cyan-50 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/50 hover:bg-white/10'
                            }`}
                          >
                            <span className="font-semibold">{option}</span>
                            {selectedOption === option && <CheckCircle2 className="h-5 w-5 text-cyan-400" />}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold uppercase tracking-widest text-slate-300">
                            Probability
                          </label>
                          <span className="font-heading text-2xl font-bold text-cyan-400">
                            {probability}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={probability}
                          onChange={(e) => setProbability(Number(e.target.value))}
                          className="h-2 w-full appearance-none rounded-full bg-slate-800 outline-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold uppercase tracking-widest text-slate-300">
                          Confidence Level
                        </label>
                        <span className="font-heading text-xl font-bold text-fuchsia-400">
                          {confidence}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={confidence}
                        onChange={(e) => setConfidence(Number(e.target.value))}
                        className="h-2 w-full appearance-none rounded-full bg-slate-800 outline-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-fuchsia-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(217,70,239,0.5)]"
                      />
                    </div>

                    {predictionError && (
                      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-300">
                        {predictionError}
                      </div>
                    )}

                    <div className="flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => void handleSubmitPrediction()}
                        disabled={submitState === 'loading'}
                        className="flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-slate-900 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {submitState === 'loading'
                          ? 'Saving...'
                          : activePrediction
                            ? 'Update Prediction'
                            : 'Submit Prediction'}
                      </button>
                      {activePrediction && (
                        <p className="text-sm font-medium text-slate-500">
                          Last updated {formatDateLabel(activePrediction.updatedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </article>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-white/5 bg-slate-900/40 p-8 backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Metadata
              </p>
              <div className="mt-6 space-y-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <span className="text-sm font-medium text-slate-500">Author</span>
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <UserCircle className="h-5 w-5 text-slate-400" />
                    {question.author.name}
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <span className="text-sm font-medium text-slate-500">Created</span>
                  <span className="text-sm font-bold text-white">{formatDateLabel(question.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Closes</span>
                  <span className="text-sm font-bold text-white">{formatDateLabel(question.closeAt)}</span>
                </div>
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[2rem] border border-fuchsia-500/20 bg-fuchsia-500/5 p-8 backdrop-blur-xl">
              <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-3xl" />
              <div className="relative z-10">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-fuchsia-400">
                  <PieChart className="h-4 w-4" /> Consensus Snapshot
                </p>
                
                <div className="mt-6">
                  <p className="text-sm font-medium text-fuchsia-200/70">Weighted Consensus</p>
                  <p className="mt-1 font-heading text-4xl font-bold text-white">
                    {formatPercent(aggregate?.weightedConsensus ?? null)}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs font-medium text-slate-400">Predictions</p>
                    <p className="mt-1 font-heading text-2xl font-bold text-white">
                      {aggregate?.totalPredictions ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs font-medium text-slate-400">Avg Confidence</p>
                    <p className="mt-1 font-heading text-2xl font-bold text-white">
                      {aggregate?.averageConfidence ? `${aggregate.averageConfidence}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                {aggregate?.optionBreakdown && aggregate.optionBreakdown.length > 0 && (
                  <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Breakdown
                    </p>
                    {aggregate.optionBreakdown.map((entry) => (
                      <div key={entry.option}>
                        <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-200">
                          <span>{entry.option}</span>
                          <span className="text-fuchsia-300">{entry.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400"
                            style={{ width: `${entry.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {question.resolvedOutcome ? (
              <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/5 p-8 backdrop-blur-xl">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Resolved Outcome
                </p>
                <p className="mt-4 font-heading text-3xl font-bold text-white">
                  {question.resolvedOutcome}
                </p>
                <p className="mt-2 text-sm font-medium text-emerald-200/70">
                  This market has officially concluded.
                </p>
              </section>
            ) : canResolve ? (
              <section className="rounded-[2rem] border border-amber-400/20 bg-amber-400/5 p-8 backdrop-blur-xl">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Resolve Question
                </p>
                <p className="mt-3 text-sm font-medium leading-relaxed text-amber-200/70">
                  As the author, you can now close this loop by selecting the correct outcome.
                </p>
                <div className="mt-6 space-y-3">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setResolveOutcome(option)}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                        resolveOutcome === option
                          ? 'border-amber-400 bg-amber-400/20 text-amber-50 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-amber-400/50 hover:bg-white/10'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {resolveError && (
                  <p className="mt-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">{resolveError}</p>
                )}
                <button
                  type="button"
                  onClick={() => void handleResolve()}
                  disabled={!resolveOutcome || resolveState === 'loading'}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-4 py-3 text-sm font-bold text-amber-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resolveState === 'loading' ? 'Resolving...' : 'Confirm Resolution'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </section>
            ) : null}
          </aside>
        </section>
      )}
    </div>
  )
}
