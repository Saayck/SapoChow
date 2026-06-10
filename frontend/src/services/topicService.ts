import api from './api'
import type { Topic, TopicCreate, TopicUpdate } from '../types/topic'

export const topicService = {
  list: async (): Promise<Topic[]> => {
    const res = await api.get<Topic[]>('/topics')
    return res.data
  },

  get: async (id: number): Promise<Topic> => {
    const res = await api.get<Topic>(`/topics/${id}`)
    return res.data
  },

  create: async (data: TopicCreate): Promise<Topic> => {
    const res = await api.post<Topic>('/topics', data)
    return res.data
  },

  update: async (id: number, data: TopicUpdate): Promise<Topic> => {
    const res = await api.put<Topic>(`/topics/${id}`, data)
    return res.data
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/topics/${id}`)
  },
}
