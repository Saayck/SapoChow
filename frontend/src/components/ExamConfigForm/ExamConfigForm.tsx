import { useEffect } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Input } from '../ui/Input'

export interface ExamConfigFormValues {
  total_topics: number
  questions_per_topic: number
  version_count: number
}

export function ExamConfigForm() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<{
    config: ExamConfigFormValues & { total_questions: number }
  }>()

  const totalTopics = watch('config.total_topics')
  const questionsPerTopic = watch('config.questions_per_topic')

  useEffect(() => {
    const tt = Number(totalTopics) || 0
    const qpt = Number(questionsPerTopic) || 0
    if (tt > 0 && qpt > 0) {
      setValue('config.total_questions', tt * qpt)
    }
  }, [totalTopics, questionsPerTopic, setValue])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Número de temas"
          type="number"
          min={1}
          placeholder="Ej: 3"
          error={(errors as any)?.config?.total_topics?.message}
          {...register('config.total_topics', { valueAsNumber: true })}
        />
        <Input
          label="Preguntas por tema"
          type="number"
          min={1}
          placeholder="Ej: 10"
          error={(errors as any)?.config?.questions_per_topic?.message}
          {...register('config.questions_per_topic', { valueAsNumber: true })}
        />
      </div>

      <Input
        label="Total de preguntas (calculado automáticamente)"
        type="number"
        readOnly
        className="bg-gray-50 cursor-not-allowed"
        error={(errors as any)?.config?.total_questions?.message}
        {...register('config.total_questions', { valueAsNumber: true })}
      />

      <Input
        label="Número de versiones"
        type="number"
        min={1}
        max={26}
        placeholder="Ej: 4"
        error={(errors as any)?.config?.version_count?.message}
        {...register('config.version_count', { valueAsNumber: true })}
      />
    </div>
  )
}
