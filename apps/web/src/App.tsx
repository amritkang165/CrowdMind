import { Route, Routes } from 'react-router-dom'

import { HomePage } from './pages/HomePage'
import { CreateQuestionPage } from './pages/CreateQuestionPage'
import { QuestionDetailPage } from './pages/QuestionDetailPage'
import { RoadmapPage } from './pages/RoadmapPage'

export default function App() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-cyan-500/30">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.1),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(217,70,239,0.05),_transparent_40%)]" />
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/questions/new" element={<CreateQuestionPage />} />
          <Route path="/questions/:questionId" element={<QuestionDetailPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
        </Routes>
      </div>
    </div>
  )
}
