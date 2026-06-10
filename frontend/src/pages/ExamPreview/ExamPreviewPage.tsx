import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Key } from 'lucide-react'
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

  if (isLoading) return <LoadingState message="Cargando vista previa..." />
  if (error || !preview) return <ErrorMessage message="No se pudo cargar la vista previa" />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Vista previa — Versión {preview.version_code}
          </h1>
          <p className="text-gray-500 text-sm">{preview.exam.title}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAnswerKey((s) => !s)}
          >
            <Key size={14} className="mr-1.5" />
            {showAnswerKey ? 'Ocultar clave' : 'Ver clave'}
          </Button>
          <Button size="sm" onClick={handleDownload} loading={downloading}>
            <Download size={14} className="mr-1.5" /> Descargar PDF
          </Button>
        </div>
      </div>

      {downloadError && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
          {downloadError}
        </p>
      )}

      {/* Answer key panel */}
      {showAnswerKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <AnswerKeyTable versionId={id} versionCode={preview.version_code} />
        </div>
      )}

      {/* Exam header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-2">
        <h2 className="text-xl font-bold text-center text-gray-900">{preview.exam.title}</h2>
        <p className="text-center text-gray-600">{preview.exam.institution_name}</p>
        <div className="flex justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
          <span>Docente: {preview.exam.teacher_name}</span>
          <span>Fecha: {new Date(preview.exam.exam_date).toLocaleDateString('es-PE')}</span>
          <span className="font-semibold">Versión {preview.version_code}</span>
        </div>
        {preview.exam.instructions && (
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800 mb-1">Instrucciones:</p>
            <p className="text-sm text-blue-700">{preview.exam.instructions}</p>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {preview.questions.map((q) => (
          <div key={q.number} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex gap-3 mb-3">
              <span className="w-7 h-7 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-sm font-bold shrink-0">
                {q.number}
              </span>
              <div className="flex-1">
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
                  <img src={q.image_path} alt={`Pregunta ${q.number}`} className="mt-2 max-h-48 rounded" />
                )}
              </div>
            </div>

            <div className="ml-10 space-y-2">
              {q.alternatives.map((alt) => (
                <div
                  key={alt.letter}
                  className={clsx(
                    'flex items-start gap-2 text-sm rounded-lg px-3 py-2',
                    alt.is_correct ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  )}
                >
                  <span className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    alt.is_correct ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  )}>
                    {alt.letter}
                  </span>
                  <div className="flex-1">
                    {alt.content_text && <span className="text-gray-700">{alt.content_text}</span>}
                    {alt.content_latex && (
                      <div
                        dangerouslySetInnerHTML={{ __html: renderLatex(alt.content_latex, false) }}
                      />
                    )}
                    {alt.image_path && (
                      <img src={alt.image_path} alt={`Alt ${alt.letter}`} className="mt-1 max-h-20 rounded" />
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
