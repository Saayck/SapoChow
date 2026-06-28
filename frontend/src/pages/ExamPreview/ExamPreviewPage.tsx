import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Key, ExternalLink } from 'lucide-react'
import { useVersionPreview } from '../../hooks/useVersions'
import { AnswerKeyTable } from '../../components/AnswerKeyTable/AnswerKeyTable'
import { versionService } from '../../services/versionService'
import { downloadBlob } from '../../utils/downloadFile'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { getErrorMessage } from '../../services/api'
import { renderContent } from '../../utils/latex'

export function ExamPreviewPage() {
  const navigate = useNavigate()
  const { versionId } = useParams<{ versionId: string }>()
  const id = Number(versionId)

  const { data: preview, isLoading, error } = useVersionPreview(id)
  const [showAnswerKey, setShowAnswerKey] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [openingPdf, setOpeningPdf] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const handleDownload = async () => {
    if (!preview) return
    setDownloading(true)
    setDownloadError(null)
    try {
      const blob = await versionService.downloadPdf(id)
      downloadBlob(blob, `version_${preview.version_code}.pdf`)
    } catch (err) {
      setDownloadError(getErrorMessage(err))
    } finally {
      setDownloading(false)
    }
  }

  const handleOpenPdf = async () => {
    if (!preview) return
    setOpeningPdf(true)
    setDownloadError(null)
    try {
      const blob = await versionService.downloadPdf(id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      setDownloadError(getErrorMessage(err))
    } finally {
      setOpeningPdf(false)
    }
  }

  if (isLoading) return <LoadingState message="Cargando vista previa..." />
  if (error || !preview) return <ErrorMessage message="No se pudo cargar la vista previa" />

  const modality = preview.exam.modality || 'ORDINARIO'
  const examYear = new Date(preview.exam.exam_date).getFullYear()

  const half = Math.ceil(preview.questions.length / 2)
  const leftQuestions = preview.questions.slice(0, half)
  const rightQuestions = preview.questions.slice(half)

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight truncate">
            Vista previa — Versión {preview.version_code}
          </h1>
          <p className="text-gray-400 text-xs truncate">{preview.exam.title}</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => setShowAnswerKey(s => !s)}>
            <Key size={13} />
            <span className="hidden sm:inline">{showAnswerKey ? 'Ocultar clave' : 'Ver clave'}</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={handleOpenPdf} loading={openingPdf}>
            <ExternalLink size={13} />
            <span className="hidden sm:inline">Ver PDF</span>
          </Button>
          <Button size="sm" onClick={handleDownload} loading={downloading}>
            <Download size={13} />
            <span className="hidden sm:inline">Descargar PDF</span>
          </Button>
        </div>
      </div>

      {downloadError && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {downloadError}
        </p>
      )}

      {showAnswerKey && (
        <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-5 animate-slide-down">
          <AnswerKeyTable versionId={id} versionCode={preview.version_code} />
        </div>
      )}

      {/* Exam paper simulation */}
      <div className="bg-white border border-gray-300 rounded-xl shadow-lg overflow-hidden font-serif">

        {/* ── PORTADA ── */}
        <div className="border-b border-gray-200 bg-gray-50 px-10 py-12 text-center space-y-6">
          <p className="text-base font-bold uppercase tracking-wide text-gray-800">
            {preview.exam.institution_name}
          </p>

          <div className="space-y-1">
            <p className="text-3xl font-black uppercase tracking-tight text-gray-900">
              {preview.exam.title}
            </p>
            <p className="text-3xl font-black text-gray-900">{examYear}</p>
          </div>

          <div className="space-y-1 pt-2">
            <p className="text-2xl font-bold uppercase tracking-widest text-gray-800">MODALIDAD</p>
            <p className="text-2xl font-bold uppercase tracking-widest text-gray-800">{modality}</p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <span className="text-2xl font-black text-gray-900">TEMA:</span>
            <div className="w-16 h-16 rounded-full border-[3px] border-gray-900 flex items-center justify-center">
              <span className="text-3xl font-black text-gray-900">{preview.version_code}</span>
            </div>
          </div>

          <div className="pt-4 text-xs text-gray-500 space-y-0.5">
            <p>Docente: <span className="font-semibold">{preview.exam.teacher_name}</span></p>
            <p>Fecha: <span className="font-semibold">
              {new Date(preview.exam.exam_date).toLocaleDateString('es-PE')}
            </span></p>
          </div>
        </div>

        {/* ── INSTRUCCIONES ── */}
        {preview.exam.instructions && (
          <div className="px-8 pt-4 pb-2 border-b border-gray-200">
            <p className="text-sm text-gray-800">
              <span className="font-bold">Instrucciones: </span>
              {preview.exam.instructions}
            </p>
          </div>
        )}

        {/* ── PÁGINAS DE PREGUNTAS ── */}
        <div>
          {/* Header of question pages */}
          <div className="flex justify-between items-center px-8 py-2 border-b border-gray-300 bg-gray-50">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-700">{modality}</span>
            <span className="text-xs font-bold text-gray-700">TEMA &ldquo;{preview.version_code}&rdquo;</span>
          </div>

          {/* Two-column question layout */}
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            {/* Left column */}
            <div className="px-5 py-4 space-y-4">
              {leftQuestions.map(q => (
                <QuestionBlock key={q.number} q={q} />
              ))}
            </div>

            {/* Right column */}
            <div className="px-5 py-4 space-y-4">
              {rightQuestions.map(q => (
                <QuestionBlock key={q.number} q={q} />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end px-8 py-2 border-t border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500">Page: 1</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface QuestionBlockProps {
  q: {
    number: number
    statement_text: string | null
    statement_latex: string | null
    image_path: string | null
    alternatives: Array<{
      letter: string
      content_text: string | null
      content_latex: string | null
      image_path: string | null
      is_correct: boolean
    }>
  }
}

function QuestionBlock({ q }: QuestionBlockProps) {
  return (
    <div className="text-sm text-gray-800 space-y-1.5">
      {/* Question statement */}
      <div className="flex gap-1.5">
        <span className="font-bold shrink-0">{q.number})</span>
        <div
          className="leading-snug katex-inline flex-1"
          dangerouslySetInnerHTML={{
            __html: renderContent({
              text: q.statement_text,
              latex: q.statement_latex,
              displayLatex: true,
            }),
          }}
        />
      </div>

      {q.image_path && (
        <img
          src={q.image_path}
          alt={`Pregunta ${q.number}`}
          className="max-w-full max-h-32 object-contain my-1"
        />
      )}

      {/* Alternatives */}
      <div className="pl-4 space-y-0.5">
        {q.alternatives.map(alt => (
          <div key={alt.letter} className="flex gap-1.5 items-start">
            <span className="font-semibold shrink-0 text-gray-700">{alt.letter})</span>
            <div
              className="leading-snug katex-inline flex-1"
              dangerouslySetInnerHTML={{
                __html: renderContent({
                  text: alt.content_text,
                  latex: alt.content_latex,
                }),
              }}
            />
            {alt.image_path && (
              <img
                src={alt.image_path}
                alt={`Alt ${alt.letter}`}
                className="max-h-12 object-contain"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
