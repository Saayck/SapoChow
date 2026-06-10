import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { examService } from '../services/examService'
import type { ExamCreate, ExamUpdate } from '../types/exam'

export const EXAMS_KEY = ['exams'] as const

export function useExams() {
  return useQuery({ queryKey: EXAMS_KEY, queryFn: examService.list })
}

export function useExam(id: number) {
  return useQuery({
    queryKey: [...EXAMS_KEY, id],
    queryFn: () => examService.get(id),
    enabled: id > 0,
  })
}

export function useCreateExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ExamCreate) => examService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXAMS_KEY }),
  })
}

export function useUpdateExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExamUpdate }) => examService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXAMS_KEY }),
  })
}

export function useDeleteExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => examService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXAMS_KEY }),
  })
}
