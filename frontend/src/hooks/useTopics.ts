import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { topicService } from '../services/topicService'
import type { TopicCreate, TopicUpdate } from '../types/topic'

export const TOPICS_KEY = ['topics'] as const

export function useTopics() {
  return useQuery({ queryKey: TOPICS_KEY, queryFn: topicService.list })
}

export function useCreateTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TopicCreate) => topicService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: TOPICS_KEY }),
  })
}

export function useUpdateTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TopicUpdate }) => topicService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: TOPICS_KEY }),
  })
}

export function useDeleteTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => topicService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TOPICS_KEY }),
  })
}
