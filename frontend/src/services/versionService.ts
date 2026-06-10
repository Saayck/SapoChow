import api from './api'
import type {
  ExamVersion,
  VersionPreview,
  AnswerKey,
  GenerateVersionsRequest,
  GenerateVersionsResponse,
} from '../types/version'

export const versionService = {
  generate: async (examId: number, data: GenerateVersionsRequest = {}): Promise<GenerateVersionsResponse> => {
    const res = await api.post<GenerateVersionsResponse>(`/exams/${examId}/versions`, data)
    return res.data
  },

  list: async (examId: number): Promise<ExamVersion[]> => {
    const res = await api.get<ExamVersion[]>(`/exams/${examId}/versions`)
    return res.data
  },

  preview: async (versionId: number): Promise<VersionPreview> => {
    const res = await api.get<VersionPreview>(`/versions/${versionId}/preview`)
    return res.data
  },

  answerKey: async (versionId: number): Promise<AnswerKey> => {
    const res = await api.get<AnswerKey>(`/versions/${versionId}/answer-key`)
    return res.data
  },

  downloadPdf: async (versionId: number): Promise<Blob> => {
    const res = await api.get(`/versions/${versionId}/pdf`, { responseType: 'blob' })
    return res.data
  },

  downloadZip: async (examId: number): Promise<Blob> => {
    const res = await api.get(`/exams/${examId}/export-all`, { responseType: 'blob' })
    return res.data
  },
}
