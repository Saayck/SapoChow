import { useState } from 'react'
import { Plus, Pencil, Trash2, Upload, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useQuestions, useCreateQuestion, useUpdateQuestion,
  useDeleteQuestion, useImportQuestions, useUploadQuestionImage,
} from '../../hooks/useQuestions'
import { useTopics } from '../../hooks/useTopics'
import { questionService } from '../../services/questionService'
import type { Question, QuestionCreate } from '../../types/question'
import type { AlternativeCreate } from '../../types/alternative'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Card } from '../../components/ui/Card'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AlternativeManager } from '../../components/AlternativeManager/AlternativeManager'
import { LatexEditor } from '../../components/LatexEditor/LatexEditor'
import { ImageUploader } from '../../components/ImageUploader/ImageUploader'
import { getErrorMessage } from '../../services/api'
import { renderLatex } from '../../utils/latex'
import { clsx } from 'clsx'

const EMPTY_ALT_IMAGES = (): (File | null)[] => Array(5).fill(null)

const emptyAlts = (): AlternativeCreate[] =>
  Array(5).fill(null).map(() => ({ content_text: '', content_latex: '', is_correct: false }))

const schema = z.object({
  topic_id: z.coerce.number().min(1, 'Selecciona un tema'),
  statement_text: z.string().optional(),
  statement_latex: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function QuestionCard({ question, topicName, onEdit, onDelete }: {
  question: Question
  topicName?: string
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const correct = question.alternatives.find((a) => a.is_correct)

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:border-gray-300">
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {topicName && (
            <span className="inline-flex items-center text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg mb-2">
              {topicName}
            </span>
          )}
          {question.statement_text && (
            <p className="text-sm text-gray-800 line-clamp-2">{question.statement_text}</p>
          )}
          {question.statement_latex && !question.statement_text && (
            <div
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: renderLatex(question.statement_latex, false) }}
            />
          )}
          {correct && (
            <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Correcta: <strong>{correct.content_text || correct.content_latex}</strong>
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            title={expanded ? 'Colapsar' : 'Expandir'}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button onClick={onEdit} className="rounded-lg p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Editar">
            <Pencil size={15} />
          </button>
          <button onClick={onDelete} className="rounded-lg p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Eliminar">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50 space-y-2">
          {question.image_path && (
            <img src={question.image_path} alt="question" className="max-h-40 rounded-lg mb-2" />
          )}
          {question.alternatives.map((alt, i) => (
            <div
              key={alt.id}
              className={clsx('flex items-start gap-2.5 text-sm', alt.is_correct && 'text-emerald-700 font-medium')}
            >
              <span className={clsx(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5',
                alt.is_correct ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              )}>
                {String.fromCharCode(65 + i)}
              </span>
              <div className="flex-1">
                <span>{alt.content_text || alt.content_latex}</span>
                {alt.image_path && (
                  <img src={alt.image_path} alt={`alt-${i}`} className="mt-1 max-h-16 rounded-lg" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function QuestionBankPage() {
  const [topicFilter, setTopicFilter] = useState<number | undefined>()
  const { data: questions, isLoading, error, refetch } = useQuestions({ topic_id: topicFilter })
  const { data: topics } = useTopics()
  const createMutation = useCreateQuestion()
  const updateMutation = useUpdateQuestion()
  const deleteMutation = useDeleteQuestion()
  const importMutation = useImportQuestions()
  const uploadImageMutation = useUploadQuestionImage()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Question | null>(null)
  const [deleting, setDeleting] = useState<Question | null>(null)

  const [alternatives, setAlternatives] = useState<AlternativeCreate[]>(emptyAlts())
  const [altImageFiles, setAltImageFiles] = useState<(File | null)[]>(EMPTY_ALT_IMAGES())
  const [pendingQuestionImage, setPendingQuestionImage] = useState<File | null>(null)

  const [altError, setAltError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [statementLatex, setStatementLatex] = useState('')

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const openCreate = () => {
    reset({ topic_id: 0, statement_text: '' })
    setStatementLatex('')
    setAlternatives(emptyAlts())
    setAltImageFiles(EMPTY_ALT_IMAGES())
    setPendingQuestionImage(null)
    setAltError(null)
    setFormError(null)
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (q: Question) => {
    setEditing(q)
    reset({ topic_id: q.topic_id, statement_text: q.statement_text ?? '' })
    setStatementLatex(q.statement_latex ?? '')
    setAlternatives(q.alternatives.map((a) => ({
      content_text: a.content_text ?? '',
      content_latex: a.content_latex ?? '',
      image_path: a.image_path ?? undefined,
      is_correct: a.is_correct,
    })))
    setAltImageFiles(EMPTY_ALT_IMAGES())
    setPendingQuestionImage(null)
    setAltError(null)
    setFormError(null)
    setShowForm(true)
  }

  const uploadPendingImages = async (savedQuestion: Question) => {
    const uploads: Promise<unknown>[] = []

    if (pendingQuestionImage) {
      uploads.push(
        uploadImageMutation.mutateAsync({ id: savedQuestion.id, file: pendingQuestionImage })
      )
    }

    altImageFiles.forEach((file, i) => {
      const altId = savedQuestion.alternatives[i]?.id
      if (file && altId) {
        uploads.push(questionService.uploadAlternativeImage(altId, file))
      }
    })

    if (uploads.length > 0) await Promise.all(uploads)
  }

  const onSubmit = async (data: FormData) => {
    const correctCount = alternatives.filter((a) => a.is_correct).length
    if (correctCount !== 1) {
      setAltError('Debe haber exactamente una alternativa correcta')
      return
    }
    setAltError(null)
    setFormError(null)

    const payload: QuestionCreate = {
      topic_id: data.topic_id,
      statement_text: data.statement_text || undefined,
      statement_latex: statementLatex || undefined,
      alternatives,
    }

    try {
      let savedQuestion: Question
      if (editing) {
        savedQuestion = await updateMutation.mutateAsync({ id: editing.id, data: payload })
      } else {
        savedQuestion = await createMutation.mutateAsync(payload)
      }

      await uploadPendingImages(savedQuestion)
      setShowForm(false)
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importMutation.mutateAsync(file)
    } catch (err) {
      alert(getErrorMessage(err))
    }
    e.target.value = ''
  }

  const topicOptions = [
    { value: '', label: 'Todos los temas' },
    ...(topics?.map((t) => ({ value: String(t.id), label: t.name })) ?? []),
  ]

  const topicSelectOptions = [
    { value: '0', label: '— Seleccionar tema —' },
    ...(topics?.map((t) => ({ value: String(t.id), label: t.name })) ?? []),
  ]

  if (isLoading) return <LoadingState message="Cargando preguntas..." />
  if (error) return <ErrorMessage message="No se pudieron cargar las preguntas" onRetry={refetch} />

  const isSaving = createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banco de preguntas</h1>
          <p className="text-gray-500 text-sm mt-0.5">{questions?.length ?? 0} pregunta(s)</p>
        </div>
        <div className="flex gap-2">
          <label className={clsx(
            'cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150',
            'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm hover:shadow',
            importMutation.isPending && 'opacity-50 pointer-events-none'
          )}>
            {importMutation.isPending ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <Upload size={14} />
            )}
            Importar
            <input type="file" accept=".docx,.pdf" className="hidden" onChange={handleImport} />
          </label>
          <Button onClick={openCreate}>
            <Plus size={16} /> Nueva pregunta
          </Button>
        </div>
      </div>

      <Select
        options={topicOptions}
        value={topicFilter ? String(topicFilter) : ''}
        onChange={(e) => setTopicFilter(e.target.value ? Number(e.target.value) : undefined)}
        label="Filtrar por tema"
      />

      {questions?.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <HelpCircle size={28} className="text-gray-300" />
            </div>
            <p className="font-medium text-gray-500">No hay preguntas{topicFilter ? ' en este tema' : ''}</p>
            <p className="text-sm mt-1">Crea o importa preguntas para comenzar</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions?.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              topicName={topics?.find((t) => t.id === q.topic_id)?.name}
              onEdit={() => openEdit(q)}
              onDelete={() => setDeleting(q)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Editar pregunta' : 'Nueva pregunta'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Controller
            name="topic_id"
            control={control}
            render={({ field }) => (
              <Select
                label="Tema"
                options={topicSelectOptions}
                value={String(field.value)}
                onChange={(e) => field.onChange(Number(e.target.value))}
                error={errors.topic_id?.message}
              />
            )}
          />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">Enunciado (texto)</p>
            <input
              type="text"
              placeholder="Texto del enunciado..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-150"
              {...register('statement_text')}
            />
          </div>

          <LatexEditor
            label="Enunciado (LaTeX)"
            value={statementLatex}
            onChange={setStatementLatex}
            displayMode
          />

          <ImageUploader
            label="Imagen del enunciado (opcional)"
            currentUrl={editing?.image_path ?? null}
            onFile={(file) => setPendingQuestionImage(file)}
            onRemove={() => setPendingQuestionImage(null)}
          />

          <AlternativeManager
            value={alternatives}
            onChange={setAlternatives}
            imageFiles={altImageFiles}
            onImageFiles={setAltImageFiles}
            error={altError ?? undefined}
          />

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving}>
              {editing ? 'Guardar cambios' : 'Crear pregunta'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Eliminar pregunta" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          ¿Seguro que deseas eliminar esta pregunta? La acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancelar</Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={async () => {
              if (!deleting) return
              await deleteMutation.mutateAsync(deleting.id)
              setDeleting(null)
            }}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
