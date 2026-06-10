import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Eye, Download, Shuffle, FileArchive, Pencil } from 'lucide-react'
import { clsx } from 'clsx'
import { useExam } from '../../hooks/useExams'
import { useVersions, useGenerateVersions } from '../../hooks/useVersions'
import { versionService } from '../../services/versionService'
import { downloadBlob } from '../../utils/downloadFile'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { getErrorMessage } from '../../services/api'

export function VersionGeneratorPage() {
  const navigate = useNavigate()
  const { examId } = useParams<{ examId: string }>()
  const id = Number(examId)

  const { data: exam, isLoading: loadingExam, error: examError } = useExam(id)
  const { data: versions, isLoading: loadingVersions, refetch } = useVersions(id)
  const generateMutation = useGenerateVersions(id)

  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setActionError(null)
    setGenerating(true)
    try {
      await generateMutation.mutateAsync({})
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadPdf = async (versionId: number, code: string) => {
    setDownloading(versionId)
    try {
      const blob = await versionService.downloadPdf(versionId)
      downloadBlob(blob, `version_${code}.pdf`)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadZip = async () => {
    setDownloadingZip(true)
    try {
      const blob = await versionService.downloadZip(id)
      downloadBlob(blob, `examen_${id}_versiones.zip`)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDownloadingZip(false)
    }
  }

  if (loadingExam) return <LoadingState message="Cargando examen..." />
  if (examError || !exam) return <ErrorMessage message="No se pudo cargar el examen" />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
          <p className="text-gray-500 text-sm">{exam.institution_name} — {exam.teacher_name}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/exams/${id}/edit`)}
        >
          <Pencil size={14} className="mr-1.5" /> Editar
        </Button>
      </div>

      {/* Exam config summary */}
      {exam.config && (
        <Card title="Configuración">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Temas', value: exam.config.total_topics },
              { label: 'Preguntas/tema', value: exam.config.questions_per_topic },
              { label: 'Total preguntas', value: exam.config.total_questions },
              { label: 'Versiones', value: exam.config.version_count },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Generate section */}
      <Card
        title="Versiones del examen"
        action={
          <div className="flex gap-2">
            {(versions?.length ?? 0) > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadZip}
                loading={downloadingZip}
              >
                <FileArchive size={14} className="mr-1.5" /> Exportar ZIP
              </Button>
            )}
            <Button size="sm" onClick={handleGenerate} loading={generating}>
              <Shuffle size={14} className="mr-1.5" /> Generar versiones
            </Button>
          </div>
        }
      >
        {actionError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
            {actionError}
          </p>
        )}

        {loadingVersions ? (
          <LoadingState message="Cargando versiones..." />
        ) : !versions?.length ? (
          <div className="text-center py-10 text-gray-400">
            <Shuffle size={32} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium">No hay versiones generadas</p>
            <p className="text-sm mt-1">Haz clic en "Generar versiones" para comenzar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-bold text-sm">
                    {v.version_code}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Versión {v.version_code}</p>
                    <p className="text-xs text-gray-400">
                      Creada el {new Date(v.created_at).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/versions/${v.id}/preview`}
                    className={clsx(
                      'inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                      'hover:bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    )}
                  >
                    <Eye size={14} /> Vista previa
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownloadPdf(v.id, v.version_code)}
                    loading={downloading === v.id}
                  >
                    <Download size={14} className="mr-1" /> PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
