export type QuestionType = 'binary' | 'multiple_choice' | 'probability'
export type QuestionStatus = 'open' | 'closed' | 'resolved'

export type QuestionRecord = {
  id: string
  title: string
  description: string
  type: QuestionType
  options: string[]
  category: string
  closeAt: string
  resolvedAt: string | null
  createdAt: string
  authorId: string
  authorName: string
}

type CreateQuestionInput = {
  title: string
  description: string
  type: QuestionType
  options: string[]
  category: string
  closeAt: string
  authorId: string
  authorName: string
}

type ListFilters = {
  category?: string
  type?: QuestionType
}

const HOUR_MS = 60 * 60 * 1000

function createSeedQuestion(
  input: Omit<QuestionRecord, 'id' | 'createdAt' | 'resolvedAt' | 'closeAt'> & {
    closeOffsetHours: number
    createdOffsetHours: number
  }
): QuestionRecord {
  const now = Date.now()

  return {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    type: input.type,
    options: input.options,
    category: input.category,
    closeAt: new Date(now + input.closeOffsetHours * HOUR_MS).toISOString(),
    resolvedAt: null,
    createdAt: new Date(now - input.createdOffsetHours * HOUR_MS).toISOString(),
    authorId: input.authorId,
    authorName: input.authorName
  }
}

function buildSeedQuestions(): QuestionRecord[] {
  return [
    createSeedQuestion({
      title: 'Will Bitcoin close above $110,000 by December 31, 2026?',
      description:
        'Forecast whether Bitcoin ends calendar year 2026 above the $110,000 threshold using the daily closing price.',
      type: 'binary',
      options: ['Yes', 'No'],
      category: 'Crypto',
      closeOffsetHours: 72,
      createdOffsetHours: 5,
      authorId: 'seed-1',
      authorName: 'MarketPulse'
    }),
    createSeedQuestion({
      title: 'Which AI feature should CrowdMind prioritize after launch?',
      description:
        'Pick the most valuable next feature for helping users reason about forecasts and trends.',
      type: 'multiple_choice',
      options: ['AI summaries', 'Trend explanations', 'Debate moderation'],
      category: 'Product',
      closeOffsetHours: 48,
      createdOffsetHours: 12,
      authorId: 'seed-2',
      authorName: 'ProductOps'
    }),
    createSeedQuestion({
      title: 'What is the probability that India reaches the 2026 T20 final?',
      description:
        'Submit a probability estimate based on current form, tournament bracket, and squad strength.',
      type: 'probability',
      options: ['0-100% probability'],
      category: 'Sports',
      closeOffsetHours: 96,
      createdOffsetHours: 20,
      authorId: 'seed-3',
      authorName: 'CricketThinker'
    })
  ]
}

export function deriveQuestionStatus(question: QuestionRecord): QuestionStatus {
  if (question.resolvedAt) {
    return 'resolved'
  }

  return new Date(question.closeAt).getTime() > Date.now() ? 'open' : 'closed'
}

export class InMemoryQuestionStore {
  private questions = buildSeedQuestions()

  listQuestions(filters: ListFilters = {}): QuestionRecord[] {
    return this.questions
      .filter((question) => {
        if (filters.category) {
          return (
            question.category.toLowerCase() === filters.category.toLowerCase()
          )
        }

        return true
      })
      .filter((question) => {
        if (filters.type) {
          return question.type === filters.type
        }

        return true
      })
      .sort((left, right) => {
        return (
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        )
      })
  }

  createQuestion(input: CreateQuestionInput): QuestionRecord {
    const question: QuestionRecord = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      options: input.options,
      category: input.category.trim(),
      closeAt: input.closeAt,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      authorId: input.authorId,
      authorName: input.authorName
    }

    this.questions.unshift(question)

    return question
  }

  findById(id: string): QuestionRecord | undefined {
    return this.questions.find((question) => question.id === id)
  }

  reset(): void {
    this.questions = buildSeedQuestions()
  }
}

export const questionStore = new InMemoryQuestionStore()
