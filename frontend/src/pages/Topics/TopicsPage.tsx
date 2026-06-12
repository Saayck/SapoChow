import { useState } from 'react'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTopics, useCreateTopic, useUpdateTopic, useDeleteTopic } from '../../hooks/useTopics'
import type { Topic } from '../../types/topic'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { LoadingState } from '../../components/ui/LoadingState'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { getErrorMessage } from '../../services/api'

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function TopicsPage() {
  const { data: topics, isLoading, error, refetch } = useTopics()
  const createMutation = useCreateTopic()
  const updateMutation = useUpdateTopic()
  const deleteMutation = useDeleteTopic()

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Topic | null>(null)
  const [deleting, setDeleting] = useState<Topic | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const openCreate = () => {
    reset({ name: '', description: '' })
    setFormError(null)
    setShowCreate(true)
  }

  const openEdit = (topic: Topic) => {
    setEditing(topic)
    reset({ name: topic.name, description: topic.description ?? '' })
    setFormError(null)
  }

  const onSubmit = async (data: FormData) => {
    setFormError(null)
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data })
        setEditing(null)
      } else {
        await createMutation.mutateAsync(data)
        setShowCreate(false)
      }
      reset()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync(deleting.id)
      setDeleting(null)
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  if (isLoading) return <LoadingState message="Cargando temas..." />
  if (error) return <ErrorMessage message="No se pudieron cargar los temas" onRetry={refetch} />

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Temas</h1>
          <p className="text-gray-500 text-sm mt-0.5">Organiza las preguntas por tema</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Nuevo tema
        </Button>
      </div>

      {topics?.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <BookOpen size={28} className="text-gray-300" />
            </div>
            <p className="font-medium text-gray-500">No hay temas aún</p>
            <p className="text-sm mt-1">Crea el primero para comenzar</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {topics?.map((topic) => (
            <div
              key={topic.id}
              className="group bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-start justify-between hover:border-gray-300 hover:shadow-card-hover transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm shrink-0">
                  <BookOpen size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{topic.name}</p>
                  {topic.description && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{topic.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => openEdit(topic)}
                  className="rounded-lg p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  title="Editar"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleting(topic)}
                  className="rounded-lg p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  title="Eliminar"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={showCreate || editing !== null}
        onClose={() => { setShowCreate(false); setEditing(null); setFormError(null) }}
        title={editing ? 'Editar tema' : 'Nuevo tema'}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Nombre" placeholder="Ej: Álgebra lineal" error={errors.name?.message} {...register('name')} />
          <Textarea label="Descripción (opcional)" placeholder="Breve descripción..." rows={3} {...register('description')} />
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowCreate(false); setEditing(null) }}>
              Cancelar
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Guardar cambios' : 'Crear tema'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Eliminar tema"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          ¿Estás seguro de que deseas eliminar <strong>{deleting?.name}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancelar</Button>
          <Button variant="danger" onClick={confirmDelete} loading={deleteMutation.isPending}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
