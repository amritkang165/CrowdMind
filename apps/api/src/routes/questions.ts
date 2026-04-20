import { Router } from 'express'
import { z } from 'zod'

import {
  deriveQuestionStatus,
  questionStore,
  type QuestionRecord
} from '../domain/questions/question-store.js'
import { predictionStore } from '../domain/predictions/prediction-store.js'
import { userStore } from '../domain/users/user-store.js'
import { authenticate } from '../middleware/authenticate.js'

const questionTypeSchema = z.enum(['binary', 'multiple_choice', 'probability'])

const listQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  type: questionTypeSchema.optional()
})

const createQuestionSchema = z
  .object({
    title: z.string().trim().min(8).max(140),
    description: z.string().trim().min(20).max(1000),
    type: questionTypeSchema,
    options: z.array(z.string().trim().min(1).max(80)).max(6).default([]),
    category: z.string().trim().min(2).max(32),
    closeAt: z.iso.datetime()
  })
  .superRefine((value, context) => {
    const closeAtMs = new Date(value.closeAt).getTime()

    if (closeAtMs <= Date.now()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['closeAt'],
        message: 'closeAt must be in the future'
      })
    }

    if (value.type === 'multiple_choice' && value.options.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Multiple choice questions need at least two options'
      })
    }

    if (value.type === 'binary' && value.options.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Binary questions use built-in yes/no options'
      })
    }

    if (value.type === 'probability' && value.options.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Probability questions should not include answer options'
      })
    }
  })

const submitPredictionSchema = z
  .object({
    selectedOption: z.string().trim().min(1).max(80).nullable(),
    probability: z.number().min(0).max(100).nullable(),
    confidence: z.number().min(0).max(100)
  })

type OptionBreakdown = {
  option: string
  percentage: number
}

type QuestionAggregate = {
  totalPredictions: number
  weightedConsensus: number | null
  optionBreakdown: OptionBreakdown[]
  leadingOption: string | null
  averageConfidence: number | null
  latestPredictionAt: string | null
}

function normalizeQuestionOptions(question: {
  type: QuestionRecord['type']
  options: string[]
}): string[] {
  if (question.type === 'binary') {
    return ['Yes', 'No']
  }

  if (question.type === 'probability') {
    return ['0-100% probability']
  }

  return question.options
}

function serializeQuestion(question: QuestionRecord) {
  return {
    id: question.id,
    title: question.title,
    description: question.description,
    type: question.type,
    options: question.options,
    category: question.category,
    closeAt: question.closeAt,
    resolvedAt: question.resolvedAt,
    resolvedOutcome: question.resolvedOutcome,
    createdAt: question.createdAt,
    author: {
      id: question.authorId,
      name: question.authorName
    },
    status: deriveQuestionStatus(question)
  }
}

function getPredictionWeight(userId: string, confidence: number) {
  const credibilityScore = userStore.findById(userId)?.credibilityScore ?? 0.5

  return credibilityScore * (0.5 + confidence / 200)
}

function normalizeOptionDistribution(
  question: QuestionRecord,
  selectedOption: string | null,
  confidence: number
) {
  const optionCount = question.options.length
  const selectedShare = confidence / 100

  if (question.type === 'binary') {
    const yesShare = selectedOption === 'Yes' ? selectedShare : 1 - selectedShare

    return [
      { option: 'Yes', share: yesShare },
      { option: 'No', share: 1 - yesShare }
    ]
  }

  if (question.type === 'multiple_choice') {
    const fallbackShare =
      optionCount > 1 ? (1 - selectedShare) / (optionCount - 1) : 0

    return question.options.map((option) => ({
      option,
      share: option === selectedOption ? selectedShare : fallbackShare
    }))
  }

  return question.options.map((option) => ({
    option,
    share: option === '0-100% probability' ? selectedShare : 0
  }))
}

function calculateQuestionAggregate(question: QuestionRecord): QuestionAggregate {
  const predictions = predictionStore.listByQuestion(question.id)

  if (predictions.length === 0) {
    return {
      totalPredictions: 0,
      weightedConsensus: null,
      optionBreakdown: question.options.map((option) => ({
        option,
        percentage: 0
      })),
      leadingOption: null,
      averageConfidence: null,
      latestPredictionAt: null
    }
  }

  const optionWeights = new Map<string, number>(
    question.options.map((option) => [option, 0])
  )
  let weightedProbabilityTotal = 0
  let weightTotal = 0
  let confidenceTotal = 0
  let latestPredictionAt = predictions[0].updatedAt

  for (const prediction of predictions) {
    const weight = getPredictionWeight(prediction.userId, prediction.confidence)

    confidenceTotal += prediction.confidence
    weightTotal += weight

    if (prediction.updatedAt > latestPredictionAt) {
      latestPredictionAt = prediction.updatedAt
    }

    if (question.type === 'probability') {
      weightedProbabilityTotal += (prediction.probability ?? 0) * weight
    }

    for (const entry of normalizeOptionDistribution(
      question,
      prediction.selectedOption,
      prediction.confidence
    )) {
      optionWeights.set(
        entry.option,
        (optionWeights.get(entry.option) ?? 0) + entry.share * weight
      )
    }
  }

  const optionBreakdown = question.options.map((option) => {
    const value = optionWeights.get(option) ?? 0

    return {
      option,
      percentage:
        weightTotal > 0 ? Number(((value / weightTotal) * 100).toFixed(1)) : 0
    }
  })

  const leadingOption =
    optionBreakdown.sort((left, right) => right.percentage - left.percentage)[0]
      ?.option ?? null

  const weightedConsensus =
    question.type === 'probability'
      ? Number((weightedProbabilityTotal / weightTotal).toFixed(1))
      : Number(
          (
            optionBreakdown.find((entry) => entry.option === 'Yes')?.percentage ??
            optionBreakdown[0]?.percentage ??
            0
          ).toFixed(1)
        )

  return {
    totalPredictions: predictions.length,
    weightedConsensus: weightTotal > 0 ? weightedConsensus : null,
    optionBreakdown,
    leadingOption,
    averageConfidence: Number(
      (confidenceTotal / predictions.length).toFixed(1)
    ),
    latestPredictionAt
  }
}

function serializePrediction(question: QuestionRecord, userId: string) {
  const prediction = predictionStore.findByQuestionAndUser(question.id, userId)

  if (!prediction) {
    return null
  }

  return {
    selectedOption: prediction.selectedOption,
    probability: prediction.probability,
    confidence: prediction.confidence,
    createdAt: prediction.createdAt,
    updatedAt: prediction.updatedAt
  }
}

export const questionsRouter = Router()

questionsRouter.get('/', (request, response) => {
  const parsed = listQuerySchema.safeParse(request.query)

  if (!parsed.success) {
    response.status(400).json({
      message: 'Invalid question filters',
      issues: parsed.error.flatten()
    })
    return
  }

  const questions = questionStore.listQuestions(parsed.data)

  response.json({
    questions: questions.map(serializeQuestion)
  })
})

questionsRouter.get('/:questionId', (request, response) => {
  const questionId = String(request.params.questionId)
  const question = questionStore.findById(questionId)

  if (!question) {
    response.status(404).json({ message: 'Question not found' })
    return
  }

  response.json({
    question: serializeQuestion(question),
    aggregate: calculateQuestionAggregate(question)
  })
})

questionsRouter.get(
  '/:questionId/predictions/me',
  authenticate,
  (request, response) => {
    const questionId = String(request.params.questionId)
    const question = questionStore.findById(questionId)

    if (!question) {
      response.status(404).json({ message: 'Question not found' })
      return
    }

    response.json({
      prediction: serializePrediction(question, request.auth!.userId)
    })
  }
)

questionsRouter.post(
  '/:questionId/predictions',
  authenticate,
  (request, response) => {
    const questionId = String(request.params.questionId)
    const question = questionStore.findById(questionId)

    if (!question) {
      response.status(404).json({ message: 'Question not found' })
      return
    }

    if (deriveQuestionStatus(question) !== 'open') {
      response
        .status(409)
        .json({ message: 'Predictions can only be submitted while open' })
      return
    }

    const parsed = submitPredictionSchema.safeParse(request.body)

    if (!parsed.success) {
      response.status(400).json({
        message: 'Invalid prediction payload',
        issues: parsed.error.flatten()
      })
      return
    }

    if (question.type === 'probability') {
      if (parsed.data.probability === null) {
        response
          .status(400)
          .json({ message: 'Probability questions require a probability value' })
        return
      }
    } else {
      if (!parsed.data.selectedOption) {
        response
          .status(400)
          .json({ message: 'An answer option must be selected' })
        return
      }

      if (!question.options.includes(parsed.data.selectedOption)) {
        response.status(400).json({ message: 'Selected option is invalid' })
        return
      }
    }

    const user = userStore.findById(request.auth!.userId)

    if (!user) {
      response.status(404).json({ message: 'User not found' })
      return
    }

    const prediction = predictionStore.upsertPrediction({
      questionId: question.id,
      userId: user.id,
      userName: user.username,
      selectedOption:
        question.type === 'probability' ? '0-100% probability' : parsed.data.selectedOption,
      probability: question.type === 'probability' ? parsed.data.probability : null,
      confidence: parsed.data.confidence
    })

    response.status(201).json({
      prediction: {
        selectedOption: prediction.selectedOption,
        probability: prediction.probability,
        confidence: prediction.confidence,
        createdAt: prediction.createdAt,
        updatedAt: prediction.updatedAt
      },
      aggregate: calculateQuestionAggregate(question)
    })
  }
)

const resolveQuestionSchema = z.object({
  outcome: z.string().trim().min(1).max(80)
})

questionsRouter.post('/:questionId/resolve', authenticate, (request, response) => {
  const questionId = String(request.params.questionId)
  const question = questionStore.findById(questionId)

  if (!question) {
    response.status(404).json({ message: 'Question not found' })
    return
  }

  if (question.authorId !== request.auth!.userId) {
    response.status(403).json({ message: 'Only the question author can resolve it' })
    return
  }

  if (deriveQuestionStatus(question) === 'resolved') {
    response.status(409).json({ message: 'Question is already resolved' })
    return
  }

  if (deriveQuestionStatus(question) === 'open') {
    response.status(409).json({ message: 'Question must be closed before resolving' })
    return
  }

  const parsed = resolveQuestionSchema.safeParse(request.body)

  if (!parsed.success) {
    response.status(400).json({
      message: 'Invalid resolution payload',
      issues: parsed.error.flatten()
    })
    return
  }

  const { outcome } = parsed.data

  const validOptions = question.type === 'probability' ? null : question.options

  if (validOptions && !validOptions.includes(outcome)) {
    response.status(400).json({
      message: `Outcome must be one of: ${validOptions.join(', ')}`
    })
    return
  }

  if (question.type === 'probability') {
    const numericOutcome = Number(outcome)

    if (isNaN(numericOutcome) || numericOutcome < 0 || numericOutcome > 100) {
      response.status(400).json({
        message: 'Probability outcome must be a number between 0 and 100'
      })
      return
    }
  }

  const resolvedQuestion = questionStore.resolveQuestion(questionId, outcome)!

  response.json({
    question: serializeQuestion(resolvedQuestion)
  })
})

questionsRouter.post('/', authenticate, (request, response) => {
  const parsed = createQuestionSchema.safeParse(request.body)

  if (!parsed.success) {
    response.status(400).json({
      message: 'Invalid question payload',
      issues: parsed.error.flatten()
    })
    return
  }

  const author = userStore.findById(request.auth!.userId)

  if (!author) {
    response.status(404).json({ message: 'Author not found' })
    return
  }

  const question = questionStore.createQuestion({
    ...parsed.data,
    options: normalizeQuestionOptions(parsed.data),
    authorId: author.id,
    authorName: author.username
  })

  response.status(201).json({
    question: serializeQuestion(question)
  })
})
