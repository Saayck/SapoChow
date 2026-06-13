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
import { renderLatex } from '../../utils/latex'
import { clsx } from 'clsx'

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

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-wrap items-start gap-3">
        <button onClick={() => navigate(-1)} className="rounded-xl p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all shrink-0 mt-0.5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0 order-3 sm:order-none sm:min-w-0 basis-full sm:basis-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Vista previa — Versión {preview.version_code}
          </h1>
          <p className="text-gray-400 text-sm truncate">{preview.exam.title}</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-wrap ml-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAnswerKey((s) => !s)}
          >
            <Key size={13} />
            <span className="hidden sm:inline">{showAnswerKey ? 'Ocultar clave' : 'Ver clave'}</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={handleOpenPdf} loading={openingPdf}>
            <ExternalLink size={13} /> <span className="hidden sm:inline">Ver PDF</span>
          </Button>
          <Button size="sm" onClick={handleDownload} loading={downloading}>
            <Download size={13} /> <span className="hidden sm:inline">Descargar PDF</span>
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

      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-card p-6 space-y-3">
        <h2 className="text-xl font-bold text-center text-gray-900 tracking-tight">{preview.exam.title}</h2>
        <p className="text-center text-gray-500">{preview.exam.institution_name}</p>
        <div className="flex flex-wrap justify-between gap-2 text-sm text-gray-400 pt-3 border-t border-gray-100">
          <span>Docente: {preview.exam.teacher_name}</span>
          <span>Fecha: {new Date(preview.exam.exam_date).toLocaleDateString('es-PE')}</span>
          <span className="font-semibold text-primary-600">Versión {preview.version_code}</span>
        </div>
        {preview.exam.instructions && (
          <div className="mt-3 bg-primary-50/60 border border-primary-100 rounded-xl p-4">
            <p className="text-sm font-medium text-primary-800 mb-1">Instrucciones:</p>
            <p className="text-sm text-primary-700">{preview.exam.instructions}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {preview.questions.map((q) => (
          <div key={q.number} className="bg-white border border-gray-200/80 rounded-2xl shadow-card p-6">
            <div className="flex gap-4 mb-4">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                {q.number}
              </span>
              <div className="flex-1 pt-0.5">
                {q.statement_text && (
                  <p className="text-sm text-gray-800">{q.statement_text}</p>
                )}
                {q.statement_latex && (
                  <div
                    className="text-sm mt-1"
                    dangerouslySetInnerHTML={{ __html: renderLatex(q.statement_latex, true) }}
                  />
                )}
                {q.image_path && (
                  <img src={q.image_path} alt={`Pregunta ${q.number}`} className="mt-3 max-h-48 rounded-xl border border-gray-100" />
                )}
              </div>
            </div>

            <div className="ml-12 space-y-2">
              {q.alternatives.map((alt) => (
                <div
                  key={alt.letter}
                  className={clsx(
                    'flex items-start gap-3 text-sm rounded-xl px-4 py-2.5 transition-colors',
                    alt.is_correct ? 'bg-emerald-50/60 border border-emerald-200/60' : 'bg-gray-50/60 border border-gray-100'
                  )}
                >
                  <span className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5',
                    alt.is_correct ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-200 text-gray-500'
                  )}>
                    {alt.letter}
                  </span>
                  <div className="flex-1 pt-0.5">
                    {alt.content_text && <span className="text-gray-700">{alt.content_text}</span>}
                    {alt.content_latex && (
                      <div
                        dangerouslySetInnerHTML={{ __html: renderLatex(alt.content_latex, false) }}
                      />
                    )}
                    {alt.image_path && (
                      <img src={alt.image_path} alt={`Alt ${alt.letter}`} className="mt-1 max-h-20 rounded-xl border border-gray-100" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
