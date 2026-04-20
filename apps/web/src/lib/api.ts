const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:4000'

export type ApiHealth = {
  status: string
  service: string
  timestamp: string
}

export type ApiUser = {
  id: string
  username: string
  email: string
  credibilityScore: number
  createdAt: string
}

export type QuestionType = 'binary' | 'multiple_choice' | 'probability'
export type QuestionStatus = 'open' | 'closed' | 'resolved'

export type Question = {
  id: string
  title: string
  description: string
  type: QuestionType
  options: string[]
  category: string
  closeAt: string
  resolvedAt: string | null
  createdAt: string
  author: {
    id: string
    name: string
  }
  status: QuestionStatus
}

export type QuestionFilters = {
  category?: string
  type?: QuestionType
}

export type CreateQuestionInput = {
  title: string
  description: string
  type: QuestionType
  options: string[]
  category: string
  closeAt: string
}

type SessionResponse = {
  token: string
  user: ApiUser
}

const demoCredentials = {
  username: 'demoauthor',
  email: 'demoauthor@crowdmind.dev',
  password: 'password123'
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { message?: string }
      | null

    throw new Error(errorBody?.message || 'Request failed')
  }

  return response.json() as Promise<T>
}

export async function fetchHealth(): Promise<ApiHealth> {
  const response = await fetch(`${API_BASE_URL}/health`)

  if (!response.ok) {
    throw new Error('Unable to reach the CrowdMind API')
  }

  return response.json() as Promise<ApiHealth>
}

export async function fetchQuestions(
  filters: QuestionFilters = {}
): Promise<Question[]> {
  const params = new URLSearchParams()

  if (filters.category) {
    params.set('category', filters.category)
  }

  if (filters.type) {
    params.set('type', filters.type)
  }

  const queryString = params.toString()
  const response = await fetch(
    `${API_BASE_URL}/questions${queryString ? `?${queryString}` : ''}`
  )
  const data = await parseResponse<{ questions: Question[] }>(response)

  return data.questions
}

export async function fetchQuestion(questionId: string): Promise<Question> {
  const response = await fetch(`${API_BASE_URL}/questions/${questionId}`)
  const data = await parseResponse<{ question: Question }>(response)

  return data.question
}

export async function startDemoSession(): Promise<SessionResponse> {
  const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: demoCredentials.email,
      password: demoCredentials.password
    })
  })

  if (loginResponse.ok) {
    return parseResponse<SessionResponse>(loginResponse)
  }

  const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(demoCredentials)
  })

  if (registerResponse.ok) {
    return parseResponse<SessionResponse>(registerResponse)
  }

  const retryLoginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: demoCredentials.email,
      password: demoCredentials.password
    })
  })

  return parseResponse<SessionResponse>(retryLoginResponse)
}

export async function createQuestion(
  input: CreateQuestionInput,
  token: string
): Promise<Question> {
  const response = await fetch(`${API_BASE_URL}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  })

  const data = await parseResponse<{ question: Question }>(response)

  return data.question
}
