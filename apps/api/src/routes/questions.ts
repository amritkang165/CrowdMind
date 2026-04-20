import { Router } from 'express'
import { z } from 'zod'

import {
  deriveQuestionStatus,
  questionStore,
  type QuestionRecord
} from '../domain/questions/question-store.js'
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
    createdAt: question.createdAt,
    author: {
      id: question.authorId,
      name: question.authorName
    },
    status: deriveQuestionStatus(question)
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
  const question = questionStore.findById(request.params.questionId)

  if (!question) {
    response.status(404).json({ message: 'Question not found' })
    return
  }

  response.json({
    question: serializeQuestion(question)
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
