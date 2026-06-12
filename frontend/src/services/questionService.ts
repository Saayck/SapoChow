import api from './api'
import type { Question, QuestionCreate, QuestionUpdate, QuestionImportPreview, QuestionImportConfirm } from '../types/question'

export const questionService = {
  list: async (params?: { topic_id?: number; search?: string }): Promise<Question[]> => {
    const res = await api.get<Question[]>('/questions', { params })
    return res.data
  },

  get: async (id: number): Promise<Question> => {
    const res = await api.get<Question>(`/questions/${id}`)
    return res.data
  },

  create: async (data: QuestionCreate): Promise<Question> => {
    const res = await api.post<Question>('/questions', data)
    return res.data
  },

  update: async (id: number, data: QuestionUpdate): Promise<Question> => {
    const res = await api.put<Question>(`/questions/${id}`, data)
    return res.data
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/questions/${id}`)
  },

  importFile: async (file: File): Promise<QuestionImportPreview> => {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post<QuestionImportPreview>('/questions/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  confirmImport: async (data: QuestionImportConfirm): Promise<Question[]> => {
    const res = await api.post<Question[]>('/questions/import/confirm', data)
    return res.data
  },

  uploadImage: async (questionId: number, file: File): Promise<Question> => {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post<Question>(`/questions/${questionId}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  uploadAlternativeImage: async (alternativeId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post(`/alternatives/${alternativeId}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}
