import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Plus, Eye, Shuffle, Pencil, Trash2, Calendar,
  Building2, User, Layers, ArrowRight, GraduationCap,
} from 'lucide-react'
import { useExams, useDeleteExam } from '../../hooks/useExams'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { getErrorMessage } from '../../services/api'
import type { Exam } from '../../types/exam'

export function ExamsListPage() {
  const navigate = useNavigate()
  const { data: exams, isLoading, error, refetch } = useExams()
  const deleteMutation = useDeleteExam()
  const [deleting, setDeleting] = useState<Exam | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteError(null)
    try {
      await deleteMutation.mutateAsync(deleting.id)
      setDeleting(null)
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingState message="Cargando exámenes..." />
  if (error) return <ErrorMessage message="No se pudieron cargar los exámenes" onRetry={refetch} />

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exámenes</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {exams?.length
              ? `Tienes ${exams.length} examen${exams.length !== 1 ? 'es' : ''} creado${exams.length !== 1 ? 's' : ''}`
              : 'Gestiona y administra tus exámenes'}
          </p>
        </div>
        <Button onClick={() => navigate('/exams/new')}>
          <Plus size={16} /> Nuevo examen
        </Button>
      </div>

      {/* Empty state */}
      {exams?.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <FileText size={28} className="text-gray-300" />
            </div>
            <p className="font-medium text-gray-500">No hay exámenes aún</p>
            <p className="text-sm mt-1">Crea tu primer examen para comenzar</p>
            <Button className="mt-4" onClick={() => navigate('/exams/new')}>
              <Plus size={16} /> Crear examen
            </Button>
          </div>
        </Card>
      ) : (
        /* Exam list */
        <div className="grid gap-4">
          {exams?.map((exam) => (
            <div
              key={exam.id}
              className="group bg-white border border-gray-200 rounded-xl shadow-card p-6 hover:shadow-card-hover hover:border-gray-300 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm shrink-0">
                      <FileText size={18} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3
                        className="text-base font-semibold text-gray-900 truncate cursor-pointer hover:text-primary-600 transition-colors"
                        onClick={() => navigate(`/exams/${exam.id}/versions`)}
                      >
                        {exam.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(exam.exam_date).toLocaleDateString('es-PE')}
                        </span>
                        {exam.config && (
                          <span className="flex items-center gap-1">
                            <Layers size={11} />
                            {exam.config.version_count} versión{exam.config.version_count !== 1 ? 'es' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-gray-400" />
                      {exam.institution_name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User size={14} className="text-gray-400" />
                      {exam.teacher_name}
                    </span>
                    {exam.config && (
                      <span className="flex items-center gap-1.5">
                        <GraduationCap size={14} className="text-gray-400" />
                        {exam.config.total_questions} pregunta{exam.config.total_questions !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {exam.instructions && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-1">{exam.instructions}</p>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => navigate(`/exams/${exam.id}/versions`)}
                    className="rounded-lg p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                    title="Ver versiones"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => navigate(`/exams/${exam.id}/edit`)}
                    className="rounded-lg p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleting(exam)}
                    className="rounded-lg p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Bottom: Quick actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/exams/${exam.id}/versions`)}
                >
                  <Shuffle size={13} /> Versiones
                </Button>
                {exam.config && (
                  <span className="text-xs text-gray-400">
                    {/* Topics summary could go here */}
                  </span>
                )}
                <button
                  onClick={() => navigate(`/exams/${exam.id}/versions`)}
                  className="ml-auto text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                >
                  Ver más <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Modal
        open={deleting !== null}
        onClose={() => { setDeleting(null); setDeleteError(null) }}
        title="Eliminar examen"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          ¿Estás seguro de que deseas eliminar <strong>{deleting?.title}</strong>?
          Esta acción eliminará también todas sus versiones y no se puede deshacer.
        </p>
        {deleteError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {deleteError}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => { setDeleting(null); setDeleteError(null) }}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete} loading={deleteMutation.isPending}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
