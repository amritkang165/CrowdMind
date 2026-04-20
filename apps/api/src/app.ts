import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { env } from './config/env.js'
import { authRouter } from './routes/auth.js'
import { healthRouter } from './routes/health.js'
import { questionsRouter } from './routes/questions.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN
    })
  )
  app.use(helmet())
  app.use(express.json())

  app.get('/', (_request, response) => {
    response.json({
      name: 'CrowdMind API',
      version: '0.1.0',
      phase: 'question-system'
    })
  })

  app.use('/health', healthRouter)
  app.use('/auth', authRouter)
  app.use('/questions', questionsRouter)

  return app
}
