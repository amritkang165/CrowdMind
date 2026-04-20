export type UserRecord = {
  id: string
  username: string
  email: string
  passwordHash: string
  credibilityScore: number
  createdAt: string
}

type CreateUserInput = {
  username: string
  email: string
  passwordHash: string
}

export class InMemoryUserStore {
  private readonly usersById = new Map<string, UserRecord>()
  private readonly emailIndex = new Map<string, string>()

  createUser(input: CreateUserInput): UserRecord {
    const normalizedEmail = input.email.trim().toLowerCase()

    if (this.emailIndex.has(normalizedEmail)) {
      throw new Error('EMAIL_ALREADY_EXISTS')
    }

    const user: UserRecord = {
      id: crypto.randomUUID(),
      username: input.username.trim(),
      email: normalizedEmail,
      passwordHash: input.passwordHash,
      credibilityScore: 0.5,
      createdAt: new Date().toISOString()
    }

    this.usersById.set(user.id, user)
    this.emailIndex.set(user.email, user.id)

    return user
  }

  findByEmail(email: string): UserRecord | undefined {
    const normalizedEmail = email.trim().toLowerCase()
    const userId = this.emailIndex.get(normalizedEmail)

    return userId ? this.usersById.get(userId) : undefined
  }

  findById(id: string): UserRecord | undefined {
    return this.usersById.get(id)
  }

  clear(): void {
    this.usersById.clear()
    this.emailIndex.clear()
  }
}

export const userStore = new InMemoryUserStore()
