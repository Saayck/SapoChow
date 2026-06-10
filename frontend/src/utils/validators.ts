export function validateExamConfig(
  totalQuestions: number,
  totalTopics: number,
  questionsPerTopic: number
): string | null {
  if (totalQuestions !== totalTopics * questionsPerTopic) {
    return `Total de preguntas (${totalQuestions}) debe ser igual a temas (${totalTopics}) × preguntas por tema (${questionsPerTopic}) = ${totalTopics * questionsPerTopic}`
  }
  return null
}

export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
export const MAX_IMAGE_SIZE_MB = 10

export function validateImageFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return `Extensión no permitida. Usa: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `El archivo supera el límite de ${MAX_IMAGE_SIZE_MB}MB`
  }
  return null
}
