export interface ExamConfig {
  id: number
  exam_id: number
  total_questions: number
  total_topics: number
  questions_per_topic: number
  version_count: number
}

export interface ExamTopic {
  id: number
  exam_id: number
  topic_id: number
  questions_count: number
}

export interface Exam {
  id: number
  title: string
  institution_name: string
  teacher_name: string
  exam_date: string
  modality: string | null
  instructions: string | null
  created_at: string
  config: ExamConfig | null
  exam_topics: ExamTopic[]
}

export interface ExamConfigCreate {
  total_questions: number
  total_topics: number
  questions_per_topic: number
  version_count: number
}

export interface ExamTopicCreate {
  topic_id: number
  questions_count: number
}

export interface ExamCreate {
  title: string
  institution_name: string
  teacher_name: string
  exam_date: string
  modality?: string
  instructions?: string
  config: ExamConfigCreate
  topics: ExamTopicCreate[]
}

export interface ExamUpdate {
  title?: string
  institution_name?: string
  teacher_name?: string
  exam_date?: string
  modality?: string
  instructions?: string
}
