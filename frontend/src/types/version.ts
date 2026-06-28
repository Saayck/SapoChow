export interface ExamVersion {
  id: number
  exam_id: number
  version_code: string
  pdf_path: string | null
  created_at: string
}

export interface VersionPreviewAlternative {
  letter: string
  content_text: string | null
  content_latex: string | null
  image_path: string | null
  is_correct: boolean
}

export interface VersionPreviewQuestion {
  number: number
  statement_text: string | null
  statement_latex: string | null
  image_path: string | null
  topic_order: number
  alternatives: VersionPreviewAlternative[]
}

export interface VersionPreview {
  version_id: number
  version_code: string
  exam: {
    title: string
    institution_name: string
    teacher_name: string
    exam_date: string
    modality?: string | null
    instructions?: string | null
  }
  questions: VersionPreviewQuestion[]
}

export interface AnswerKeyItem {
  question_number: number
  correct_letter: string
}

export interface AnswerKey {
  version_code: string
  answers: AnswerKeyItem[]
}

export interface GenerateVersionsRequest {
  seed?: number
}

export interface GeneratedVersionItem {
  id: number
  version_code: string
}

export interface GenerateVersionsResponse {
  exam_id: number
  generated_versions: GeneratedVersionItem[]
}
