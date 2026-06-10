import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/Layout/AppLayout'
import { LoginPage } from './pages/Login/LoginPage'
import { RegisterPage } from './pages/Register/RegisterPage'
import { DashboardPage } from './pages/Dashboard/DashboardPage'
import { TopicsPage } from './pages/Topics/TopicsPage'
import { QuestionBankPage } from './pages/QuestionBank/QuestionBankPage'
import { ExamBuilderPage } from './pages/ExamBuilder/ExamBuilderPage'
import { VersionGeneratorPage } from './pages/VersionGenerator/VersionGeneratorPage'
import { ExamPreviewPage } from './pages/ExamPreview/ExamPreviewPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/topics" element={<TopicsPage />} />
        <Route path="/questions" element={<QuestionBankPage />} />
        <Route path="/exams/new" element={<ExamBuilderPage />} />
        <Route path="/exams/:examId/edit" element={<ExamBuilderPage />} />
        <Route path="/exams/:examId/versions" element={<VersionGeneratorPage />} />
        <Route path="/versions/:versionId/preview" element={<ExamPreviewPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
