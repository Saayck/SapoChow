export interface Topic {
  id: number
  name: string
  description: string | null
  created_at: string
}

export interface TopicCreate {
  name: string
  description?: string
}

export interface TopicUpdate {
  name?: string
  description?: string
}
