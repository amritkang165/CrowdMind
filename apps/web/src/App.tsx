import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type FormEvent
} from 'react'
import {
  Link,
  Route,
  Routes,
  useNavigate,
  useParams
} from 'react-router-dom'

import {
  createQuestion,
  fetchHealth,
  fetchMyPrediction,
  fetchQuestionDetail,
  fetchQuestions,
  resolveQuestion,
  startDemoSession,
  submitPrediction,
  type Prediction,
  type Question,
  type QuestionAggregate,
  type QuestionType
} from './lib/api'
import { useAppStore } from './store/app-store'

function formatHealthMessage(timestamp: string) {
  return `API healthy as of ${new Date(timestamp).toLocaleTimeString()}`
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

function formatPercent(value: number | null) {
  if (value === null) {
    return 'No consensus yet'
  }

  return `${value.toFixed(1)}%`
}

function toDateTimeLocalValue(date = new Date(Date.now() + 24 * 60 * 60 * 1000)) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)

  return offsetDate.toISOString().slice(0, 16)
}

function SiteHeader() {
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
    <header className="mb-12 flex flex-col gap-4 rounded-[2rem] border border-white/12 bg-white/7 px-5 py-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-300">
          CrowdMind
        </p>
        <p className="mt-2 text-sm text-slate-300">
          Phase 2 question system: browse, create, and inspect forecast prompts
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:items-end">
        <nav className="flex flex-wrap gap-4 text-sm text-slate-200">
          <Link to="/" className="transition hover:text-amber-300">
            Feed
          </Link>
          <Link to="/questions/new" className="transition hover:text-amber-300">
            Create
          </Link>
          <Link to="/roadmap" className="transition hover:text-amber-300">
            Roadmap
          </Link>
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          {currentUser ? (
            <>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100">
                Demo author: {currentUser.username}
              </span>
              <button
                type="button"
                onClick={clearSession}
                className="rounded-full border border-white/12 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/8"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void handleStartDemoSession()}
              disabled={sessionState === 'loading'}
              className="rounded-full border border-amber-300/30 bg-amber-300/12 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {sessionState === 'loading' ? 'Starting demo session...' : 'Use demo author'}
            </button>
          )}
        </div>

        {sessionError ? (
          <p className="text-sm text-rose-200">{sessionError}</p>
        ) : null}
      </div>
    </header>
  )
}

function QuestionCard({ question }: { question: Question }) {
  return (
    <Link
      to={`/questions/${question.id}`}
      className="block rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-6 transition hover:-translate-y-0.5 hover:border-sky-300/35 hover:bg-slate-900/75"
    >
      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-400">
        <span>{question.category}</span>
        <span>{question.type.replace('_', ' ')}</span>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] tracking-[0.2em] text-slate-300">
          {question.status}
        </span>
      </div>
      <h2 className="mt-4 text-2xl font-semibold text-white">{question.title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        {question.description}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <span>By {question.author.name}</span>
        <span>Closes {formatDateLabel(question.closeAt)}</span>
      </div>
    </Link>
  )
}

function HomePage() {
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

        if (!isActive) {
          return
        }

        setCategoryOptions(
          [...new Set(allQuestions.map((question) => question.category))].sort()
        )
      } catch {
        if (!isActive) {
          return
        }

        setCategoryOptions([])
      }
    }

    void loadFilterOptions()

    return () => {
      isActive = false
    }
  }, [])

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
        setHealthError('')
      } catch (error) {
        if (!isActive) {
          return
        }

        setHealthStatus('error')
        setApiMessage('API connection failed')
        setHealthError(
          error instanceof Error ? error.message : 'Unexpected API error'
        )
      }
    }

    void loadHealth()

    return () => {
      isActive = false
    }
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

        if (!isActive) {
          return
        }

        setQuestions(nextQuestions)
        setQuestionsError('')
      } catch (error) {
        if (!isActive) {
          return
        }

        setQuestions([])
        setQuestionsError(
          error instanceof Error
            ? error.message
            : 'Unable to load CrowdMind questions'
        )
      } finally {
        if (isActive) {
          setIsLoadingQuestions(false)
        }
      }
    }

    void loadQuestions()

    return () => {
      isActive = false
    }
  }, [selectedCategory, selectedType])

  const questionStats = useMemo(() => {
    return {
      total: questions.length,
      open: questions.filter((question) => question.status === 'open').length,
      categories: new Set(questions.map((question) => question.category)).size
    }
  }, [questions])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.28),_transparent_28%),linear-gradient(180deg,_#08111f_0%,_#0f172a_52%,_#162033_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 lg:px-10">
        <SiteHeader />

        <section className="grid flex-1 gap-8 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/12 bg-slate-950/40 p-8 shadow-2xl shadow-slate-950/35 backdrop-blur">
            <p className="mb-4 font-mono text-sm uppercase tracking-[0.32em] text-sky-300">
              Forecast question feed
            </p>
            <h1 className="max-w-3xl font-serif text-5xl leading-tight text-white md:text-6xl">
              Create prompts, browse active markets of opinion, and inspect each forecast setup.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Phase 2 turns the PRD into a usable question engine. We now have a
              browsable feed, category and type filters, question detail pages,
              and authenticated question creation through a demo author session.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <article className="rounded-3xl border border-white/10 bg-white/6 p-5">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
                  Feed size
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {questionStats.total}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Questions visible with the active filters
                </p>
              </article>
              <article className="rounded-3xl border border-white/10 bg-white/6 p-5">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
                  Open markets
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {questionStats.open}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Questions still accepting predictions
                </p>
              </article>
              <article className="rounded-3xl border border-white/10 bg-white/6 p-5">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
                  Categories
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {questionStats.categories}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Topic lanes available in the current feed
                </p>
              </article>
            </div>

            <section className="mt-10 rounded-[1.75rem] border border-white/10 bg-slate-900/65 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
                    Filters
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Narrow the feed by category or question type.
                  </p>
                </div>
                <Link
                  to="/questions/new"
                  className="inline-flex rounded-full border border-sky-300/30 bg-sky-300/10 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-300/18"
                >
                  {currentUser ? 'Create question' : 'Open creator'}
                </Link>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-300">
                  <span className="mb-2 block text-slate-400">Category</span>
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
                  >
                    <option value="">All categories</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-300">
                  <span className="mb-2 block text-slate-400">Question type</span>
                  <select
                    value={selectedType}
                    onChange={(event) =>
                      setSelectedType(event.target.value as QuestionType | '')
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
                  >
                    <option value="">All types</option>
                    <option value="binary">Binary</option>
                    <option value="multiple_choice">Multiple choice</option>
                    <option value="probability">Probability</option>
                  </select>
                </label>
              </div>
            </section>

            {questionsError ? (
              <div className="mt-6 rounded-[1.75rem] border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100">
                {questionsError}
              </div>
            ) : null}

            <section className="mt-8 grid gap-4">
              {isLoadingQuestions ? (
                <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/55 p-6 text-sm text-slate-300">
                  Loading question feed...
                </div>
              ) : null}

              {!isLoadingQuestions && questions.length === 0 ? (
                <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/55 p-6 text-sm leading-7 text-slate-300">
                  No questions match the current filters yet.
                </div>
              ) : null}

              {!isLoadingQuestions
                ? questions.map((question) => (
                    <QuestionCard key={question.id} question={question} />
                  ))
                : null}
            </section>
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
              {healthError ? (
                <p className="mt-3 text-sm text-rose-200">{healthError}</p>
              ) : null}
            </section>

            <section className="rounded-[2rem] border border-white/12 bg-slate-900/60 p-6 backdrop-blur">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
                Question system coverage
              </p>
              <ul className="mt-4 space-y-4 text-sm leading-7 text-slate-200">
                <li>List and filter questions across seeded topic categories</li>
                <li>Open detail pages for each question and review status</li>
                <li>Create new questions with a demo author session</li>
                <li>Carry forward the tested Phase 1 API and build pipeline</li>
              </ul>
            </section>

            <section className="rounded-[2rem] border border-white/12 bg-slate-900/60 p-6 backdrop-blur">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
                Question formats
              </p>
              <ul className="mt-4 space-y-4 text-sm leading-7 text-slate-200">
                <li>`binary`: uses built-in yes/no choices</li>
                <li>`multiple choice`: accepts 2 to 6 author-provided options</li>
                <li>`probability`: frames the answer as a 0-100% forecast</li>
              </ul>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}

function CreateQuestionPage() {
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
    if (authToken) {
      return authToken
    }

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
        .map((option) => option.trim())
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
      setFormError(
        error instanceof Error ? error.message : 'Unable to create question'
      )
    } finally {
      setSubmitState('idle')
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#04121f_0%,_#0f172a_58%,_#111827_100%)] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <SiteHeader />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.7fr]">
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-8 backdrop-blur"
          >
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-sky-300">
              Create question
            </p>
            <h1 className="mt-4 font-serif text-4xl text-white">
              Publish the next forecasting prompt.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Keep the wording specific and resolvable. This phase focuses on
              getting valid questions into the system with the right structure.
            </p>

            <div className="mt-8 grid gap-5">
              <label className="text-sm text-slate-300">
                <span className="mb-2 block text-slate-400">Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Will CrowdMind reach 1,000 active users in its first month?"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
                  required
                  minLength={8}
                />
              </label>

              <label className="text-sm text-slate-300">
                <span className="mb-2 block text-slate-400">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe how this question will be judged and what outcome counts as resolved."
                  className="min-h-36 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
                  required
                  minLength={20}
                />
              </label>

              <div className="grid gap-5 md:grid-cols-3">
                <label className="text-sm text-slate-300">
                  <span className="mb-2 block text-slate-400">Category</span>
                  <input
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
                    required
                  />
                </label>
                <label className="text-sm text-slate-300">
                  <span className="mb-2 block text-slate-400">Type</span>
                  <select
                    value={type}
                    onChange={(event) =>
                      setType(event.target.value as QuestionType)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
                  >
                    <option value="binary">Binary</option>
                    <option value="multiple_choice">Multiple choice</option>
                    <option value="probability">Probability</option>
                  </select>
                </label>
                <label className="text-sm text-slate-300">
                  <span className="mb-2 block text-slate-400">Close at</span>
                  <input
                    type="datetime-local"
                    value={closeAt}
                    onChange={(event) => setCloseAt(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
                    required
                  />
                </label>
              </div>

              {type === 'multiple_choice' ? (
                <label className="text-sm text-slate-300">
                  <span className="mb-2 block text-slate-400">
                    Answer options
                  </span>
                  <textarea
                    value={optionsText}
                    onChange={(event) => setOptionsText(event.target.value)}
                    className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
                    placeholder="One option per line"
                  />
                </label>
              ) : null}

              {formError ? (
                <p className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
                  {formError}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={submitState === 'loading'}
                  className="rounded-full border border-sky-300/30 bg-sky-300/12 px-5 py-3 text-sm text-sky-100 transition hover:bg-sky-300/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitState === 'loading' ? 'Creating question...' : 'Publish question'}
                </button>
                <p className="text-sm text-slate-400">
                  {currentUser
                    ? `Publishing as ${currentUser.username}`
                    : 'No active author session yet. A demo session will be created automatically.'}
                </p>
              </div>
            </div>
          </form>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
                Authoring notes
              </p>
              <ul className="mt-4 space-y-4 text-sm leading-7 text-slate-200">
                <li>Use a title that can be understood without opening the details.</li>
                <li>Descriptions should explain how resolution will be judged.</li>
                <li>Close times must be in the future so predictions remain fair.</li>
              </ul>
            </section>

            <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-6 backdrop-blur">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-amber-200">
                Current phase
              </p>
              <p className="mt-3 text-sm leading-7 text-amber-50/90">
                Question creation is now live. Prediction submission and
                consensus calculations follow in the next phase.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}

function QuestionDetailPage() {
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
    if (authToken) {
      return authToken
    }

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

        if (!isActive) {
          return
        }

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
        if (!isActive) {
          return
        }

        setQuestion(null)
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load question'
        )
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadQuestion()

    return () => {
      isActive = false
    }
  }, [questionId])

  useEffect(() => {
    if (!question || !authToken) {
      return
    }

    const activeQuestion = question
    const activeToken = authToken
    let isActive = true

    async function loadMyPrediction() {
      try {
        const prediction = await fetchMyPrediction(activeQuestion.id, activeToken)

        if (!isActive) {
          return
        }

        setMyPrediction(prediction)

        if (prediction) {
          setConfidence(prediction.confidence)

          if (activeQuestion.type === 'probability') {
            setProbability(prediction.probability ?? 50)
          } else {
            setSelectedOption(
              prediction.selectedOption ?? activeQuestion.options[0] ?? ''
            )
          }
        }
      } catch {
        if (!isActive) {
          return
        }

        setMyPrediction(null)
      }
    }

    void loadMyPrediction()

    return () => {
      isActive = false
    }
  }, [authToken, question])

  const activePrediction = authToken ? myPrediction : null
  const isAuthor = !!(currentUser && question && question.author.id === currentUser.id)
  const canResolve = isAuthor && question?.status === 'closed'

  async function handleSubmitPrediction() {
    if (!question) {
      return
    }

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
      setPredictionError(
        error instanceof Error ? error.message : 'Unable to submit prediction'
      )
    } finally {
      setSubmitState('idle')
    }
  }

  async function handleResolve() {
    if (!question || !authToken || !resolveOutcome) {
      return
    }

    setResolveState('loading')

    try {
      const result = await resolveQuestion(question.id, resolveOutcome, authToken)
      setQuestion(result.question)
      setResolveError('')
    } catch (error) {
      setResolveError(
        error instanceof Error ? error.message : 'Unable to resolve question'
      )
    } finally {
      setResolveState('idle')
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#060b16_0%,_#111827_55%,_#0f172a_100%)] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <SiteHeader />

        {isLoading ? (
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-8 text-sm text-slate-300 backdrop-blur">
            Loading question details...
          </section>
        ) : null}

        {!isLoading && errorMessage ? (
          <section className="rounded-[2rem] border border-rose-300/20 bg-rose-300/10 p-8 text-sm text-rose-100 backdrop-blur">
            {errorMessage}
          </section>
        ) : null}

        {!isLoading && question ? (
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.7fr]">
            <article className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-8 backdrop-blur">
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-400">
                <span>{question.category}</span>
                <span>{question.type.replace('_', ' ')}</span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] tracking-[0.2em] text-slate-300">
                  {question.status}
                </span>
              </div>
              <h1 className="mt-4 font-serif text-4xl text-white">
                {question.title}
              </h1>
              <p className="mt-5 text-base leading-8 text-slate-300">
                {question.description}
              </p>

              <section className="mt-8 rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-5">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
                  Expected answer format
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-200">
                  {question.options.map((option) => (
                    <li
                      key={option}
                      className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-8 rounded-[1.5rem] border border-sky-300/15 bg-sky-300/8 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-100">
                    Submit prediction
                  </p>
                  <span className="text-sm text-slate-300">
                    {currentUser
                      ? `Forecasting as ${currentUser.username}`
                      : 'A demo session will be created on first submit'}
                  </span>
                </div>

                {question.status !== 'open' ? (
                  <p className="mt-4 text-sm text-slate-300">
                    This question is no longer open for new predictions.
                  </p>
                ) : (
                  <>
                    {question.type !== 'probability' ? (
                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {question.options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setSelectedOption(option)}
                            className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                              selectedOption === option
                                ? 'border-sky-300/40 bg-sky-300/15 text-sky-50'
                                : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/8'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <label className="mt-5 block text-sm text-slate-300">
                        <span className="mb-2 block text-slate-400">
                          Probability estimate
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={probability}
                          onChange={(event) => setProbability(Number(event.target.value))}
                          className="w-full"
                        />
                        <span className="mt-2 block text-sky-100">
                          {probability}%
                        </span>
                      </label>
                    )}

                    <label className="mt-5 block text-sm text-slate-300">
                      <span className="mb-2 block text-slate-400">Confidence</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={confidence}
                        onChange={(event) => setConfidence(Number(event.target.value))}
                        className="w-full"
                      />
                      <span className="mt-2 block text-amber-100">
                        {confidence}%
                      </span>
                    </label>

                    {predictionError ? (
                      <p className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
                        {predictionError}
                      </p>
                    ) : null}

                    <div className="mt-5 flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={() => void handleSubmitPrediction()}
                        disabled={submitState === 'loading'}
                        className="rounded-full border border-sky-300/30 bg-sky-300/12 px-5 py-3 text-sm text-sky-100 transition hover:bg-sky-300/20 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {submitState === 'loading'
                          ? 'Saving prediction...'
                          : activePrediction
                            ? 'Update prediction'
                            : 'Submit prediction'}
                      </button>
                      {activePrediction ? (
                        <span className="text-sm text-slate-300">
                          Last saved {formatDateLabel(activePrediction.updatedAt)}
                        </span>
                      ) : null}
                    </div>
                  </>
                )}
              </section>
            </article>

            <aside className="space-y-6">
              <section className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
                  Metadata
                </p>
                <dl className="mt-4 space-y-4 text-sm text-slate-200">
                  <div>
                    <dt className="text-slate-400">Author</dt>
                    <dd className="mt-1">{question.author.name}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Created</dt>
                    <dd className="mt-1">{formatDateLabel(question.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Closes</dt>
                    <dd className="mt-1">{formatDateLabel(question.closeAt)}</dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6 backdrop-blur">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-emerald-100">
                  Consensus snapshot
                </p>
                <div className="mt-4 grid gap-4">
                  <div>
                    <p className="text-sm text-emerald-50/80">Weighted consensus</p>
                    <p className="mt-1 text-3xl font-semibold text-white">
                      {formatPercent(aggregate?.weightedConsensus ?? null)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                      <p className="text-slate-400">Predictions</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {aggregate?.totalPredictions ?? 0}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                      <p className="text-slate-400">Avg confidence</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {aggregate?.averageConfidence
                          ? `${aggregate.averageConfidence}%`
                          : 'n/a'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
                  Breakdown
                </p>
                <div className="mt-4 space-y-3">
                  {(aggregate?.optionBreakdown ?? []).map((entry) => (
                    <div key={entry.option}>
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
                        <span>{entry.option}</span>
                        <span>{entry.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-white/8">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-sky-400 to-emerald-300"
                          style={{ width: `${entry.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {question.resolvedOutcome ? (
                <section className="rounded-[2rem] border border-emerald-300/25 bg-emerald-300/10 p-6 backdrop-blur">
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-emerald-200">
                    Resolved outcome
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {question.resolvedOutcome}
                  </p>
                  <p className="mt-2 text-sm text-emerald-50/80">
                    This question has been officially resolved.
                  </p>
                </section>
              ) : canResolve ? (
                <section className="rounded-[2rem] border border-amber-300/25 bg-amber-300/10 p-6 backdrop-blur">
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-amber-200">
                    Resolve question
                  </p>
                  <p className="mt-3 text-sm text-amber-50/80">
                    You authored this question. Select the correct outcome to close the loop.
                  </p>
                  <div className="mt-4 grid gap-3">
                    {question.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setResolveOutcome(option)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          resolveOutcome === option
                            ? 'border-amber-300/50 bg-amber-300/20 text-amber-50'
                            : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {resolveError ? (
                    <p className="mt-3 text-sm text-rose-200">{resolveError}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleResolve()}
                    disabled={!resolveOutcome || resolveState === 'loading'}
                    className="mt-4 w-full rounded-full border border-amber-300/30 bg-amber-300/12 px-4 py-3 text-sm text-amber-100 transition hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resolveState === 'loading' ? 'Resolving...' : 'Confirm resolution'}
                  </button>
                </section>
              ) : null}
            </aside>
          </section>
        ) : null}
      </div>
    </main>
  )
}

function RoadmapPage() {
  const steps = [
    'Phase 1: foundation, auth, validation, testing',
    'Phase 2: question creation and browse flows',
    'Phase 3: prediction submission and consensus',
    'Phase 4: resolution mechanism (MVP)'
  ]

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 backdrop-blur">
        <SiteHeader />
        <p className="font-mono text-xs uppercase tracking-[0.32em] text-sky-300">
          Delivery roadmap
        </p>
        <h1 className="mt-8 font-serif text-4xl text-white">
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
          Back to feed
        </Link>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/questions/new" element={<CreateQuestionPage />} />
      <Route path="/questions/:questionId" element={<QuestionDetailPage />} />
      <Route path="/roadmap" element={<RoadmapPage />} />
    </Routes>
  )
}
