import api from './api'
import type { Exam, ExamCreate, ExamUpdate } from '../types/exam'

export const examService = {
  list: async (): Promise<Exam[]> => {
    const res = await api.get<Exam[]>('/exams')
    return res.data
  },

  get: async (id: number): Promise<Exam> => {
    const res = await api.get<Exam>(`/exams/${id}`)
    return res.data
  },

  create: async (data: ExamCreate): Promise<Exam> => {
    const res = await api.post<Exam>('/exams', data)
    return res.data
  },

  update: async (id: number, data: ExamUpdate): Promise<Exam> => {
    const res = await api.put<Exam>(`/exams/${id}`, data)
    return res.data
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/exams/${id}`)
  },
}
