export interface Topic {
  id: number
  name: string
  description: string | null
  created_at: string
  question_count: number
}

export interface TopicCreate {
  name: string
  description?: string
}

export interface TopicUpdate {
  name?: string
  description?: string
}
