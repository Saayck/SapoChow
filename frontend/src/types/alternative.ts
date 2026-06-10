export interface Alternative {
  id: number
  question_id: number
  content_text: string | null
  content_latex: string | null
  image_path: string | null
  is_correct: boolean
  created_at: string
}

export interface AlternativeCreate {
  content_text?: string
  content_latex?: string
  image_path?: string
  is_correct: boolean
}

export interface AlternativeUpdate {
  content_text?: string
  content_latex?: string
  image_path?: string
  is_correct?: boolean
}
