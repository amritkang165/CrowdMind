import type { NextFunction, Request, Response } from 'express'

import { verifyAccessToken } from '../lib/auth.js'

declare module 'express-serve-static-core' {
  interface Request {
    auth?: {
      userId: string
      email: string
    }
  }
}

export function authenticate(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  const authHeader = request.header('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Missing bearer token' })
    return
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const payload = verifyAccessToken(token)

    request.auth = {
      userId: payload.sub,
      email: payload.email
    }

    next()
  } catch {
    response.status(401).json({ message: 'Invalid or expired token' })
  }
}
