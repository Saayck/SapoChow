import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { questionService } from '../services/questionService'
import type { QuestionCreate, QuestionUpdate, QuestionImportConfirm } from '../types/question'

export const QUESTIONS_KEY = ['questions'] as const

export function useQuestions(params?: { topic_id?: number; search?: string }) {
  return useQuery({
    queryKey: [...QUESTIONS_KEY, params],
    queryFn: () => questionService.list(params),
  })
}

export function useCreateQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: QuestionCreate) => questionService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUESTIONS_KEY }),
  })
}

export function useUpdateQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: QuestionUpdate }) =>
      questionService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUESTIONS_KEY }),
  })
}

export function useDeleteQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => questionService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUESTIONS_KEY }),
  })
}

export function useImportQuestions() {
  return useMutation({
    mutationFn: (file: File) => questionService.importFile(file),
  })
}

export function useConfirmImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: QuestionImportConfirm) => questionService.confirmImport(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUESTIONS_KEY }),
  })
}

export function useUploadQuestionImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      questionService.uploadImage(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUESTIONS_KEY }),
  })
}
