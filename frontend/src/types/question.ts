import { Alternative, AlternativeCreate } from './alternative'

export interface Question {
  id: number
  topic_id: number
  statement_text: string | null
  statement_latex: string | null
  image_path: string | null
  created_at: string
  alternatives: Alternative[]
}

export interface QuestionCreate {
  topic_id: number
  statement_text?: string
  statement_latex?: string
  image_path?: string
  alternatives: AlternativeCreate[]
}

export interface QuestionUpdate {
  topic_id?: number
  statement_text?: string
  statement_latex?: string
  image_path?: string
  alternatives?: AlternativeCreate[]
}

export interface ImportedAlternativePreview {
  content_text?: string
  content_latex?: string
  is_correct: boolean
}

export interface ImportedQuestionPreview {
  statement_text?: string
  statement_latex?: string
  alternatives: ImportedAlternativePreview[]
  warnings: string[]
}

export interface QuestionImportPreview {
  file_name: string
  detected_questions: ImportedQuestionPreview[]
  warnings: string[]
}
