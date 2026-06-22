import { useState } from 'react'
import { Plus, Pencil, Trash2, Upload, ChevronDown, ChevronUp, HelpCircle, Search, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useQuestions, useCreateQuestion, useUpdateQuestion,
  useDeleteQuestion, useImportQuestions, useConfirmImport, useUploadQuestionImage,
} from '../../hooks/useQuestions'
import { useTopics } from '../../hooks/useTopics'
import { questionService } from '../../services/questionService'
import type { Question, QuestionCreate, QuestionImportPreview, ImportedQuestionPreview } from '../../types/question'
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
import { renderContent } from '../../utils/latex'
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
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-card overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:border-gray-300">
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {topicName && (
            <span className="inline-flex items-center text-xs font-medium text-primary-600 bg-primary-50/80 px-2 py-0.5 rounded-lg border border-primary-100 mb-2">
              {topicName}
            </span>
          )}
          <div
            className="text-sm text-gray-800 line-clamp-2 katex-inline"
            dangerouslySetInnerHTML={{
              __html: renderContent({
                text: question.statement_text,
                latex: question.statement_latex,
              }),
            }}
          />
          {correct && (
            <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Correcta:{' '}
              <strong
                className="katex-inline"
                dangerouslySetInnerHTML={{
                  __html: renderContent({
                    text: correct.content_text,
                    latex: correct.content_latex,
                  }),
                }}
              />
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            title={expanded ? 'Colapsar' : 'Expandir'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={onEdit} className="rounded-lg p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-all" title="Editar">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="rounded-lg p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Eliminar">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/30 space-y-2">
          {question.image_path && (
            <img src={question.image_path} alt="question" className="max-h-40 rounded-xl mb-2" />
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
                <span
                  className="katex-inline"
                  dangerouslySetInnerHTML={{
                    __html: renderContent({
                      text: alt.content_text,
                      latex: alt.content_latex,
                    }),
                  }}
                />
                {alt.image_path && (
                  <img src={alt.image_path} alt={`alt-${i}`} className="mt-1 max-h-16 rounded-xl" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ImportPreviewModal({ preview, topics, onClose, onConfirm, saving }: {
  preview: QuestionImportPreview
  topics: { id: number; name: string }[]
  onClose: () => void
  onConfirm: (topicId: number, selected: ImportedQuestionPreview[]) => void
  saving: boolean
}) {
  const [topicId, setTopicId] = useState(0)
  const [selected, setSelected] = useState<boolean[]>(
    () => preview.detected_questions.map((q) => {
      const hasWarning = q.warnings.length > 0
      return !hasWarning
    })
  )
  const [submitError, setSubmitError] = useState<string | null>(null)

  const topicOptions = [
    { value: '0', label: '— Seleccionar tema —' },
    ...topics.map((t) => ({ value: String(t.id), label: t.name })),
  ]

  const selectedQuestions = preview.detected_questions.filter((_, i) => selected[i])
  const toggle = (i: number) => setSelected((prev) => prev.map((v, idx) => idx === i ? !v : v))

  const handleConfirm = () => {
    if (topicId === 0) {
      setSubmitError('Debes seleccionar un tema')
      return
    }
    if (selectedQuestions.length === 0) {
      setSubmitError('Selecciona al menos una pregunta')
      return
    }
    setSubmitError(null)
    onConfirm(topicId, selectedQuestions)
  }

  return (
    <Modal open onClose={onClose} title={`Importar preguntas — ${preview.file_name}`} size="xl">
      <div className="space-y-5">
        {preview.warnings.length > 0 && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              {preview.warnings.map((w, i) => <p key={i}>{w}</p>)}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Asignar a tema <span className="text-red-500">*</span>
            </label>
            <Select
              options={topicOptions}
              value={String(topicId)}
              onChange={(e) => { setTopicId(Number(e.target.value)); setSubmitError(null) }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {preview.detected_questions.length} pregunta{preview.detected_questions.length !== 1 ? 's' : ''} detectada{preview.detected_questions.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white px-1 py-1 max-h-[55vh] overflow-y-auto scrollbar-thin">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm m-3 p-6 sm:p-8 font-serif text-gray-900 print:shadow-none">
            <div className="text-center border-b border-gray-200 pb-4 mb-6">
              <p className="text-[11px] uppercase tracking-[0.25em] text-gray-400 mb-2">
                Vista previa — Exportación profesional
              </p>
              <h3 className="text-lg font-semibold tracking-tight">
                {preview.file_name.replace(/\.[^.]+$/, '')}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Renderizado con LaTeX · {preview.detected_questions.length} pregunta{preview.detected_questions.length !== 1 ? 's' : ''}
              </p>
            </div>

            <ol className="space-y-5 list-none">
              {preview.detected_questions.map((q, i) => {
                const hasWarnings = q.warnings.length > 0
                const isSelected = selected[i]
                return (
                  <li key={i} className="group">
                    <div
                      className={clsx(
                        'rounded-xl px-4 py-4 transition-all border',
                        isSelected
                          ? 'border-primary-200 bg-primary-50/30'
                          : 'border-transparent bg-gray-50/40 opacity-60'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggle(i)}
                          className="mt-1.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-gray-900 shrink-0">{i + 1}.</span>
                            <div
                              className="text-[15px] leading-relaxed katex-inline"
                              dangerouslySetInnerHTML={{
                                __html:
                                  renderContent({
                                    text: q.statement_text,
                                    latex: q.statement_latex,
                                  }) || '<span class="text-gray-400 italic text-sm">(sin enunciado)</span>',
                              }}
                            />
                          </div>

                          <ol className="mt-3 ml-6 space-y-1.5 list-none">
                            {q.alternatives.map((alt, ai) => (
                              <li
                                key={ai}
                                className={clsx(
                                  'flex items-baseline gap-3 text-[14px] leading-relaxed',
                                  alt.is_correct && 'text-emerald-700'
                                )}
                              >
                                <span className={clsx(
                                  'font-bold w-5 shrink-0',
                                  alt.is_correct ? 'text-emerald-600' : 'text-gray-700'
                                )}>
                                  {String.fromCharCode(65 + ai)}.
                                </span>
                                <div
                                  className="katex-inline flex-1"
                                  dangerouslySetInnerHTML={{
                                    __html: renderContent({
                                      text: alt.content_text,
                                      latex: alt.content_latex,
                                    }),
                                  }}
                                />
                                {alt.is_correct && (
                                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                )}
                              </li>
                            ))}
                          </ol>

                          {hasWarnings && (
                            <div className="mt-3 space-y-0.5 font-sans">
                              {q.warnings.map((w, wi) => (
                                <p key={wi} className="text-xs text-amber-600 flex items-center gap-1">
                                  <AlertTriangle size={10} />
                                  {w}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>

        {submitError && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertTriangle size={13} /> {submitError}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            {selectedQuestions.length} de {preview.detected_questions.length} seleccionada{selectedQuestions.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button onClick={handleConfirm} loading={saving} disabled={selectedQuestions.length === 0}>
              Guardar {selectedQuestions.length > 0 ? `${selectedQuestions.length} pregunta${selectedQuestions.length !== 1 ? 's' : ''}` : ''}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export function QuestionBankPage() {
  const [topicFilter, setTopicFilter] = useState<number | undefined>()
  const [search, setSearch] = useState('')
  const { data: questions, isLoading, error, refetch } = useQuestions({
    topic_id: topicFilter,
    search: search || undefined,
  })
  const { data: topics } = useTopics()
  const createMutation = useCreateQuestion()
  const updateMutation = useUpdateQuestion()
  const deleteMutation = useDeleteQuestion()
  const importMutation = useImportQuestions()
  const confirmImportMutation = useConfirmImport()
  const uploadImageMutation = useUploadQuestionImage()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Question | null>(null)
  const [deleting, setDeleting] = useState<Question | null>(null)
  const [importPreview, setImportPreview] = useState<QuestionImportPreview | null>(null)

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
    e.target.value = ''
    try {
      const preview = await importMutation.mutateAsync(file)
      setImportPreview(preview)
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  const handleConfirmImport = async (topicId: number, selected: ImportedQuestionPreview[]) => {
    try {
      await confirmImportMutation.mutateAsync({ topic_id: topicId, questions: selected })
      setImportPreview(null)
    } catch (err) {
      alert(getErrorMessage(err))
    }
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
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Banco de preguntas</h1>
          <p className="text-gray-400 text-sm mt-1">{questions?.length ?? 0} pregunta(s)</p>
        </div>
        <div className="flex gap-2">
          <label className={clsx(
            'cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-150 border shadow-sm',
            'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300',
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
            <Plus size={15} /> Nueva pregunta
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar pregunta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/15 focus:border-primary-400 transition-all duration-150 hover:border-gray-300"
          />
        </div>
        <div className="sm:w-56">
          <Select
            options={topicOptions}
            value={topicFilter ? String(topicFilter) : ''}
            onChange={(e) => setTopicFilter(e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>

      {questions?.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
              <HelpCircle size={24} className="text-gray-300" />
            </div>
            <p className="font-medium text-gray-500">
              {search ? `Sin resultados para "${search}"` : 'No hay preguntas' + (topicFilter ? ' en este tema' : '')}
            </p>
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
              className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/15 focus:border-primary-400 transition-all duration-150 hover:border-gray-300"
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

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Eliminar pregunta" size="sm">
        <p className="text-sm text-gray-500 mb-4">
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

      {importPreview && (
        <ImportPreviewModal
          preview={importPreview}
          topics={topics ?? []}
          onClose={() => setImportPreview(null)}
          onConfirm={handleConfirmImport}
          saving={confirmImportMutation.isPending}
        />
      )}
    </div>
  )
}
