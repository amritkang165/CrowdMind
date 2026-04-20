import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'

import { createApp } from './app.js'
import { predictionStore } from './domain/predictions/prediction-store.js'
import { questionStore } from './domain/questions/question-store.js'
import { userStore } from './domain/users/user-store.js'

describe('CrowdMind API foundation', () => {
  const app = createApp()

  beforeEach(() => {
    userStore.clear()
    questionStore.reset()
    predictionStore.clear()
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

  it('resolves a closed question (MVP)', async () => {
    // Create author
    const authorResp = await request(app).post('/auth/register').send({
      username: 'author',
      email: 'author@example.com',
      password: 'password123'
    })
    const authorToken = authorResp.body.token as string

    // Create predictor
    const predictorResp = await request(app).post('/auth/register').send({
      username: 'predictor2',
      email: 'predictor2@example.com',
      password: 'password123'
    })
    const predictorToken = predictorResp.body.token as string

    // Create a question with a past closeAt (already closed)
    const closeAt = new Date(Date.now() - 1000).toISOString() // 1 second ago
    const createResp = await request(app)
      .post('/questions')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        title: 'Will the test suite pass on the first run?',
        description: 'A synthetic question used to validate the resolution flow end-to-end.',
        type: 'binary',
        category: 'Product',
        options: [],
        closeAt: new Date(Date.now() + 100).toISOString() // create with tiny window
      })

    expect(createResp.status).toBe(201)
    const questionId = createResp.body.question.id as string

    const q = questionStore.findById(questionId)!

    // Submit a correct prediction (Yes) while still open
    const predResp = await request(app)
      .post(`/questions/${questionId}/predictions`)
      .set('Authorization', `Bearer ${predictorToken}`)
      .send({ selectedOption: 'Yes', probability: null, confidence: 80 })

    expect(predResp.status).toBe(201)

    // Directly close the question by manipulating closeAt via the store
    q.closeAt = closeAt // backdate to make it closed

    // Resolve with correct outcome = 'Yes'
    const resolveResp = await request(app)
      .post(`/questions/${questionId}/resolve`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ outcome: 'Yes' })

    expect(resolveResp.status).toBe(200)
    expect(resolveResp.body.question.status).toBe('resolved')
    expect(resolveResp.body.question.resolvedOutcome).toBe('Yes')

    // Author cannot resolve an already-resolved question
    const secondResolveResp = await request(app)
      .post(`/questions/${questionId}/resolve`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ outcome: 'No' })

    expect(secondResolveResp.status).toBe(409)

    // Non-author cannot resolve
    const unauthorizedResp = await request(app)
      .post(`/questions/${questionId}/resolve`)
      .set('Authorization', `Bearer ${predictorToken}`)
      .send({ outcome: 'Yes' })

    expect(unauthorizedResp.status).toBe(403)
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

  it('submits and updates a prediction with aggregate consensus', async () => {
    const registerResponse = await request(app).post('/auth/register').send({
      username: 'predictor',
      email: 'predictor@example.com',
      password: 'password123'
    })

    const createResponse = await request(app)
      .post('/questions')
      .set('Authorization', `Bearer ${registerResponse.body.token}`)
      .send({
        title: 'Will CrowdMind ship phase 3 by July 2026?',
        description:
          'This asks whether the team completes phase 3 and ships prediction submission by July 31, 2026.',
        type: 'binary',
        category: 'Product',
        options: [],
        closeAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })

    const predictionResponse = await request(app)
      .post(`/questions/${createResponse.body.question.id}/predictions`)
      .set('Authorization', `Bearer ${registerResponse.body.token}`)
      .send({
        selectedOption: 'Yes',
        probability: null,
        confidence: 72
      })

    expect(predictionResponse.status).toBe(201)
    expect(predictionResponse.body.aggregate.totalPredictions).toBe(1)
    expect(predictionResponse.body.aggregate.weightedConsensus).toBe(72)

    const updateResponse = await request(app)
      .post(`/questions/${createResponse.body.question.id}/predictions`)
      .set('Authorization', `Bearer ${registerResponse.body.token}`)
      .send({
        selectedOption: 'No',
        probability: null,
        confidence: 60
      })

    expect(updateResponse.status).toBe(201)
    expect(updateResponse.body.aggregate.totalPredictions).toBe(1)
    expect(updateResponse.body.aggregate.weightedConsensus).toBe(40)

    const detailResponse = await request(app).get(
      `/questions/${createResponse.body.question.id}`
    )

    expect(detailResponse.body.aggregate.leadingOption).toBe('No')

    const myPredictionResponse = await request(app)
      .get(`/questions/${createResponse.body.question.id}/predictions/me`)
      .set('Authorization', `Bearer ${registerResponse.body.token}`)

    expect(myPredictionResponse.body.prediction.selectedOption).toBe('No')
    expect(myPredictionResponse.body.prediction.confidence).toBe(60)
  })
})
