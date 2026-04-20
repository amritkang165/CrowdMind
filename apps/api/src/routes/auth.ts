import { Router } from 'express'
import { z } from 'zod'

import { userStore } from '../domain/users/user-store.js'
import { authenticate } from '../middleware/authenticate.js'
import {
  hashPassword,
  signAccessToken,
  verifyPassword
} from '../lib/auth.js'

const registerSchema = z.object({
  username: z.string().trim().min(3).max(32),
  email: z.email(),
  password: z.string().min(8).max(72)
})

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72)
})

function serializeUser(user: ReturnType<typeof userStore.createUser>) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    credibilityScore: user.credibilityScore,
    createdAt: user.createdAt
  }
}

export const authRouter = Router()

authRouter.post('/register', async (request, response) => {
  const parsed = registerSchema.safeParse(request.body)

  if (!parsed.success) {
    response.status(400).json({
      message: 'Invalid registration payload',
      issues: parsed.error.flatten()
    })
    return
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password)
    const user = userStore.createUser({
      username: parsed.data.username,
      email: parsed.data.email,
      passwordHash
    })

    response.status(201).json({
      token: signAccessToken(user),
      user: serializeUser(user)
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
      response.status(409).json({ message: 'Email already registered' })
      return
    }

    response.status(500).json({ message: 'Registration failed' })
  }
})

authRouter.post('/login', async (request, response) => {
  const parsed = loginSchema.safeParse(request.body)

  if (!parsed.success) {
    response.status(400).json({
      message: 'Invalid login payload',
      issues: parsed.error.flatten()
    })
    return
  }

  const user = userStore.findByEmail(parsed.data.email)

  if (!user) {
    response.status(401).json({ message: 'Invalid email or password' })
    return
  }

  const isValidPassword = await verifyPassword(
    parsed.data.password,
    user.passwordHash
  )

  if (!isValidPassword) {
    response.status(401).json({ message: 'Invalid email or password' })
    return
  }

  response.json({
    token: signAccessToken(user),
    user: serializeUser(user)
  })
})

authRouter.get('/me', authenticate, (request, response) => {
  const user = userStore.findById(request.auth!.userId)

  if (!user) {
    response.status(404).json({ message: 'User not found' })
    return
  }

  response.json({ user: serializeUser(user) })
})
