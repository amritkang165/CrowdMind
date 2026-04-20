import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'

import { createApp } from './app.js'
import { questionStore } from './domain/questions/question-store.js'
import { userStore } from './domain/users/user-store.js'

describe('CrowdMind API foundation', () => {
  const app = createApp()

  beforeEach(() => {
    userStore.clear()
    questionStore.reset()
  })

  it('returns health status', async () => {
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
  })

  it('registers a user, logs in, and returns the profile', async () => {
    const registerResponse = await request(app).post('/auth/register').send({
      username: 'forecastfan',
      email: 'forecastfan@example.com',
      password: 'password123'
    })

    expect(registerResponse.status).toBe(201)
    expect(registerResponse.body.user.email).toBe('forecastfan@example.com')
    expect(registerResponse.body.token).toBeTypeOf('string')

    const loginResponse = await request(app).post('/auth/login').send({
      email: 'forecastfan@example.com',
      password: 'password123'
    })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.user.username).toBe('forecastfan')

    const meResponse = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)

    expect(meResponse.status).toBe(200)
    expect(meResponse.body.user.credibilityScore).toBe(0.5)
  })

  it('rejects duplicate registrations', async () => {
    await request(app).post('/auth/register').send({
      username: 'duplicate',
      email: 'duplicate@example.com',
      password: 'password123'
    })

    const duplicateResponse = await request(app).post('/auth/register').send({
      username: 'duplicate-two',
      email: 'duplicate@example.com',
      password: 'password123'
    })

    expect(duplicateResponse.status).toBe(409)
  })

  it('lists seeded questions and filters by category', async () => {
    const response = await request(app).get('/questions').query({
      category: 'Crypto'
    })

    expect(response.status).toBe(200)
    expect(response.body.questions).toHaveLength(1)
    expect(response.body.questions[0].category).toBe('Crypto')
  })

  it('creates a question and returns it in the feed', async () => {
    const registerResponse = await request(app).post('/auth/register').send({
      username: 'questionmaker',
      email: 'questionmaker@example.com',
      password: 'password123'
    })

    const createResponse = await request(app)
      .post('/questions')
      .set('Authorization', `Bearer ${registerResponse.body.token}`)
      .send({
        title: 'Will CrowdMind launch public beta before October 2026?',
        description:
          'This question tracks whether the team ships a public beta before the end of September 2026.',
        type: 'binary',
        category: 'Product',
        options: [],
        closeAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.question.author.name).toBe('questionmaker')
    expect(createResponse.body.question.options).toEqual(['Yes', 'No'])

    const feedResponse = await request(app).get('/questions')

    expect(feedResponse.body.questions[0].title).toBe(
      'Will CrowdMind launch public beta before October 2026?'
    )
  })
})
