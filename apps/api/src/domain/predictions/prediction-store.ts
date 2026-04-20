export type PredictionRecord = {
  id: string
  questionId: string
  userId: string
  userName: string
  selectedOption: string | null
  probability: number | null
  confidence: number
  createdAt: string
  updatedAt: string
}

type UpsertPredictionInput = {
  questionId: string
  userId: string
  userName: string
  selectedOption: string | null
  probability: number | null
  confidence: number
}

export class InMemoryPredictionStore {
  private readonly predictions = new Map<string, PredictionRecord>()

  private makeKey(questionId: string, userId: string) {
    return `${questionId}:${userId}`
  }

  upsertPrediction(input: UpsertPredictionInput): PredictionRecord {
    const key = this.makeKey(input.questionId, input.userId)
    const existing = this.predictions.get(key)
    const now = new Date().toISOString()

    const prediction: PredictionRecord = {
      id: existing?.id ?? crypto.randomUUID(),
      questionId: input.questionId,
      userId: input.userId,
      userName: input.userName,
      selectedOption: input.selectedOption,
      probability: input.probability,
      confidence: input.confidence,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    }

    this.predictions.set(key, prediction)

    return prediction
  }

  listByQuestion(questionId: string): PredictionRecord[] {
    return [...this.predictions.values()].filter(
      (prediction) => prediction.questionId === questionId
    )
  }

  findByQuestionAndUser(
    questionId: string,
    userId: string
  ): PredictionRecord | undefined {
    return this.predictions.get(this.makeKey(questionId, userId))
  }

  clear(): void {
    this.predictions.clear()
  }
}

export const predictionStore = new InMemoryPredictionStore()
