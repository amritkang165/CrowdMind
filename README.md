# CrowdMind

CrowdMind is a collective intelligence platform where users create prediction questions, submit forecasts with confidence, and build credibility over time based on accuracy.

## Product Focus

- Prediction questions across binary, multiple choice, and probability formats
- Weighted consensus driven by user credibility
- Outcome resolution that recalculates trust and ranking
- Real-time question activity, leaderboards, and discussion

## Proposed Stack

- Frontend: React + Vite + Tailwind CSS + Zustand
- Backend: Node.js + Express
- Database: PostgreSQL
- Real-time: WebSockets or Socket.io

## Current Repository Structure

- `apps/web`: React frontend with routing, Zustand state, Tailwind styling, and Vitest tests
- `apps/api`: Express API with typed environment config, JWT auth skeleton, question endpoints, and Vitest/Supertest coverage
- `Docs`: source PRD and planning material

## Phase 1 Status

Phase 1 foundation is now implemented:

- Workspace scripts for local development, linting, testing, and production builds
- Frontend application shell with API health check wiring
- Backend health endpoint plus register, login, and protected `me` endpoint
- Environment examples for both apps

## Phase 2 Status

Phase 2 question flows are now implemented:

- Question feed with seeded examples, category filters, and type filters
- Question detail route for inspecting prompt structure and status
- Authenticated question creation with a lightweight demo-author session
- API endpoints for question list, detail, and create flows

## Commands

- `npm install`
- `npm run dev`
- `npm run lint`
- `npm test`
- `npm run build`

## Delivery Outline

1. Foundation and architecture setup
2. Question and prediction workflows
3. Consensus, resolution, and credibility logic
4. Real-time feed, graphs, and leaderboard
5. Discussion, discovery, and polish

## Documentation

- Source PRD: [Docs/PRD.md](Docs/PRD.md)
- Internal planning notes live under `Docs/_internal/` and are intentionally git-ignored
