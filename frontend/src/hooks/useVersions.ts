import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { versionService } from '../services/versionService'
import type { GenerateVersionsRequest } from '../types/version'

export const versionsKey = (examId: number) => ['versions', examId] as const
export const previewKey = (versionId: number) => ['preview', versionId] as const
export const answerKeyKey = (versionId: number) => ['answer-key', versionId] as const

export function useVersions(examId: number) {
  return useQuery({
    queryKey: versionsKey(examId),
    queryFn: () => versionService.list(examId),
    enabled: examId > 0,
  })
}

export function useVersionPreview(versionId: number) {
  return useQuery({
    queryKey: previewKey(versionId),
    queryFn: () => versionService.preview(versionId),
    enabled: versionId > 0,
  })
}

export function useAnswerKey(versionId: number) {
  return useQuery({
    queryKey: answerKeyKey(versionId),
    queryFn: () => versionService.answerKey(versionId),
    enabled: versionId > 0,
  })
}

export function useGenerateVersions(examId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GenerateVersionsRequest) => versionService.generate(examId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: versionsKey(examId) }),
  })
}
