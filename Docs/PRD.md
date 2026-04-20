# 📘 Product Requirements Document (PRD)

## 🧠 Product Name

**CrowdMind – Collective Intelligence Platform**

---

## 🎯 Objective

To build a system that:

* Aggregates user opinions and predictions
* Tracks accuracy over time
* Produces a dynamic “collective intelligence score”

---

## 👥 Target Users

* Students
* Analysts
* Curious internet users
* Debate communities

---

## 🧩 Core Features

---

### 1. ❓ Question Engine

Users can create questions:

#### Types:

* Binary (Yes/No)
* Multiple choice
* Probability (0–100%)

#### Examples:

* “Will Bitcoin go above $100k this year?”
* “Which team will win?”

---

### 2. 🧑‍🤝‍🧑 Prediction Input

Users submit:

* Answer
* Confidence level

#### Example:

* YES, 70% confident

---

### 3. 🧠 Dynamic Truth Score

Each question has:

* Aggregated probability
* Weighted by user credibility

---

### 4. 🏆 User Credibility System

Users gain score based on:

* Past prediction accuracy
* Consistency

---

### 5. 📈 Real-Time Opinion Graph

* Shows how answers change over time
* Line charts / distribution curves

---

### 6. 🔁 Outcome Resolution

When result is known:

* System evaluates predictions
* Updates user credibility

---

### 7. 📊 Leaderboard

* Top predictors
* Most accurate users

---

### 8. 💬 Discussion Layer

* Comment section per question
* Debate + reasoning

---

### 9. 🔍 Explore Feed

* Trending questions
* Categories

---

## 🏗 Architecture

### Frontend

* React + Vite
* Zustand (state)
* Tailwind CSS

### Backend

* Node.js (Express)

### Database

* PostgreSQL

### Real-time

* WebSockets / Socket.io

---

## 🧠 Core Algorithms

---

### 1. Weighted Consensus

P = \frac{\sum (w_i \cdot p_i)}{\sum w_i}

Where:

* (p_i) = user prediction
* (w_i) = user credibility

---

### 2. Credibility Update

w_{new} = w_{old} + k \cdot (accuracy - expected)

---

### 3. Accuracy Score

accuracy = 1 - |prediction - outcome|

---

## 🔄 Data Flow

1. User creates question
2. Others submit predictions
3. Backend aggregates scores
4. UI updates in real-time
5. Outcome resolves
6. Credibility recalculated

---

## 🎨 UI/UX Requirements

### Pages:

* Home feed
* Question detail
* Submit prediction
* Leaderboard
* Profile

---

### Design:

* Dark mode
* Glassy UI (yes yes your obsession)
* Graph-heavy visuals

---

## ⚙️ Functional Requirements

* Create questions
* Submit predictions
* Real-time updates
* Resolve outcomes
* Update credibility

---

## 🚫 Non-Functional Requirements

* Low latency (real-time)
* Scalable
* Secure auth

---

## 📦 MVP Scope

### Must Have:

* Question system
* Prediction system
* Weighted aggregation
* Basic leaderboard

### Nice to Have:

* Real-time graphs
* Comments
* Categories

---

## 🧪 Future Enhancements

* AI-generated insights
* Market simulation
* Betting system (virtual currency)
* API access

---

## 📊 Success Metrics

* Active users
* Predictions per question
* Accuracy improvement over time

---

## 🔐 Security

* JWT auth
* Rate limiting
* Input validation

---

## 🧠 Key Differentiator

Unlike polls:

* Tracks correctness over time
* Weighs users differently
* Evolves dynamically

---

## 📌 Conclusion

CrowdMind transforms opinions into measurable intelligence using:

* Prediction modeling
* Weighted consensus
* Real-time updates

---
