import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, FormProvider, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { useExam, useCreateExam, useUpdateExam } from '../../hooks/useExams'
import { useTopics } from '../../hooks/useTopics'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { ExamConfigForm } from '../../components/ExamConfigForm/ExamConfigForm'
import { LoadingState } from '../../components/ui/LoadingState'
import { getErrorMessage } from '../../services/api'

const schema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  institution_name: z.string().min(1, 'La institución es requerida'),
  teacher_name: z.string().min(1, 'El docente es requerido'),
  exam_date: z.string().min(1, 'La fecha es requerida'),
  instructions: z.string().optional(),
  config: z.object({
    total_topics: z.number().min(1, 'Mínimo 1 tema'),
    questions_per_topic: z.number().min(1, 'Mínimo 1 pregunta por tema'),
    total_questions: z.number().min(1),
    version_count: z.number().min(1, 'Mínimo 1 versión').max(26, 'Máximo 26 versiones'),
  }),
  topics: z.array(z.object({
    topic_id: z.coerce.number().min(1, 'Selecciona un tema'),
    questions_count: z.coerce.number().min(1, 'Mínimo 1 pregunta'),
  })).min(1, 'Agrega al menos un tema'),
})

type FormValues = z.infer<typeof schema>

export function ExamBuilderPage() {
  const navigate = useNavigate()
  const { examId } = useParams<{ examId: string }>()
  const isEditing = Boolean(examId)
  const { data: exam, isLoading: loadingExam } = useExam(examId ? Number(examId) : 0)
  const { data: topics } = useTopics()
  const createMutation = useCreateExam()
  const updateMutation = useUpdateExam()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      institution_name: '',
      teacher_name: '',
      exam_date: '',
      instructions: '',
      config: { total_topics: 1, questions_per_topic: 10, total_questions: 10, version_count: 4 },
      topics: [{ topic_id: 0, questions_count: 10 }],
    },
  })

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = methods
  const { fields, append, remove } = useFieldArray({ control, name: 'topics' })

  useEffect(() => {
    if (exam && isEditing) {
      reset({
        title: exam.title,
        institution_name: exam.institution_name,
        teacher_name: exam.teacher_name,
        exam_date: exam.exam_date,
        instructions: exam.instructions ?? '',
        config: exam.config
          ? {
              total_topics: exam.config.total_topics,
              questions_per_topic: exam.config.questions_per_topic,
              total_questions: exam.config.total_questions,
              version_count: exam.config.version_count,
            }
          : { total_topics: 1, questions_per_topic: 10, total_questions: 10, version_count: 4 },
        topics: exam.exam_topics.map((t) => ({
          topic_id: t.topic_id,
          questions_count: t.questions_count,
        })),
      })
    }
  }, [exam, isEditing, reset])

  const topicOptions = [
    { value: '0', label: '— Seleccionar tema —' },
    ...(topics?.map((t) => ({ value: String(t.id), label: t.name })) ?? []),
  ]

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null)
    try {
      if (isEditing && examId) {
        await updateMutation.mutateAsync({
          id: Number(examId),
          data: {
            title: data.title,
            institution_name: data.institution_name,
            teacher_name: data.teacher_name,
            exam_date: data.exam_date,
            instructions: data.instructions,
          },
        })
        navigate(`/exams/${examId}/versions`)
      } else {
        const created = await createMutation.mutateAsync({
          title: data.title,
          institution_name: data.institution_name,
          teacher_name: data.teacher_name,
          exam_date: data.exam_date,
          instructions: data.instructions,
          config: data.config,
          topics: data.topics,
        })
        navigate(`/exams/${created.id}/versions`)
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    }
  }

  if (loadingExam && isEditing) return <LoadingState message="Cargando examen..." />

  return (
    <FormProvider {...methods}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar examen' : 'Nuevo examen'}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing ? 'Modifica los datos del examen' : 'Configura y crea un nuevo examen'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic info */}
          <Card title="Información general">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Título del examen"
                  placeholder="Ej: Examen Parcial I — Matemáticas"
                  error={errors.title?.message}
                  {...register('title')}
                />
              </div>
              <Input
                label="Institución"
                placeholder="Nombre de la institución"
                error={errors.institution_name?.message}
                {...register('institution_name')}
              />
              <Input
                label="Docente"
                placeholder="Nombre del docente"
                error={errors.teacher_name?.message}
                {...register('teacher_name')}
              />
              <Input
                label="Fecha del examen"
                type="date"
                error={errors.exam_date?.message}
                {...register('exam_date')}
              />
            </div>
            <div className="mt-4">
              <Textarea
                label="Instrucciones (opcional)"
                placeholder="Instrucciones para los alumnos..."
                rows={3}
                {...register('instructions')}
              />
            </div>
          </Card>

          {/* Config — only for new exams */}
          {!isEditing && (
            <Card title="Configuración del examen">
              <ExamConfigForm />
            </Card>
          )}

          {/* Topics — only for new exams */}
          {!isEditing && (
            <Card
              title="Temas del examen"
              subtitle="Indica cuántas preguntas se tomarán de cada tema"
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => append({ topic_id: 0, questions_count: 10 })}
                >
                  <Plus size={14} className="mr-1" /> Agregar tema
                </Button>
              }
            >
              {(errors.topics as any)?.root?.message && (
                <p className="text-xs text-red-500 mb-3">{(errors.topics as any).root.message}</p>
              )}
              <div className="space-y-3">
                {fields.map((field, i) => (
                  <div key={field.id} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Select
                        label={i === 0 ? 'Tema' : undefined}
                        options={topicOptions}
                        error={(errors.topics?.[i] as any)?.topic_id?.message}
                        {...register(`topics.${i}.topic_id`)}
                      />
                    </div>
                    <div className="w-36">
                      <Input
                        label={i === 0 ? 'Preguntas' : undefined}
                        type="number"
                        min={1}
                        placeholder="N°"
                        error={(errors.topics?.[i] as any)?.questions_count?.message}
                        {...register(`topics.${i}.questions_count`)}
                      />
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="text-gray-400 hover:text-red-500 pb-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {submitError && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {isEditing ? 'Guardar cambios' : 'Crear examen'}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  )
}
