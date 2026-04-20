import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { env } from '../config/env.js'
import type { UserRecord } from '../domain/users/user-store.js'

const TOKEN_EXPIRY = '7d'

export type AuthTokenPayload = {
  sub: string
  email: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash)
}

export function signAccessToken(user: UserRecord): string {
  return jwt.sign({ email: user.email }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: TOKEN_EXPIRY
  })
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET)

  if (typeof decoded === 'string' || !decoded.sub || !decoded.email) {
    throw new Error('INVALID_TOKEN')
  }

  return {
    sub: decoded.sub,
    email: decoded.email as string
  }
}
