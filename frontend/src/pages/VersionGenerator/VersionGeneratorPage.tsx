import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Eye, Download, Shuffle, FileArchive, Pencil, ExternalLink } from 'lucide-react'
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
  const [openingPdf, setOpeningPdf] = useState<number | null>(null)
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

  const handleOpenPdf = async (versionId: number) => {
    setOpeningPdf(versionId)
    try {
      const blob = await versionService.downloadPdf(versionId)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setOpeningPdf(null)
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
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="rounded-xl p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all shrink-0 mt-0.5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">{exam.title}</h1>
          <p className="text-gray-400 text-sm truncate">{exam.institution_name} — {exam.teacher_name}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/exams/${id}/edit`)}
          className="shrink-0 mt-0.5"
        >
          <Pencil size={13} /> Editar
        </Button>
      </div>

      {exam.config && (
        <Card title="Configuración">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Temas', value: exam.config.total_topics },
              { label: 'Preguntas/tema', value: exam.config.questions_per_topic },
              { label: 'Total preguntas', value: exam.config.total_questions },
              { label: 'Versiones', value: exam.config.version_count },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-4 text-center transition-all hover:border-gray-200">
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

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
                <FileArchive size={13} /> Exportar ZIP
              </Button>
            )}
            <Button size="sm" onClick={handleGenerate} loading={generating}>
              <Shuffle size={13} /> Generar versiones
            </Button>
          </div>
        }
      >
        {actionError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
            {actionError}
          </p>
        )}

        {loadingVersions ? (
          <LoadingState message="Cargando versiones..." />
        ) : !versions?.length ? (
          <div className="flex flex-col items-center py-14 text-gray-400">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
              <Shuffle size={24} className="text-gray-300" />
            </div>
            <p className="font-medium text-gray-500">No hay versiones generadas</p>
            <p className="text-sm mt-1">Haz clic en "Generar versiones" para comenzar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 transition-all hover:border-gray-200 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                    {v.version_code}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">Versión {v.version_code}</p>
                    <p className="text-xs text-gray-400">
                      Creada el {new Date(v.created_at).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  <Link
                    to={`/versions/${v.id}/preview`}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                  >
                    <Eye size={13} className="shrink-0" /> <span className="hidden sm:inline">Vista previa</span>
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenPdf(v.id)}
                    loading={openingPdf === v.id}
                    title="Abrir PDF en nueva pestaña"
                  >
                    <ExternalLink size={13} className="sm:mr-1" /> <span className="hidden sm:inline">Ver PDF</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownloadPdf(v.id, v.version_code)}
                    loading={downloading === v.id}
                  >
                    <Download size={13} />
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
