import { useNavigate } from 'react-router-dom'
import { BookOpen, FileText, Layers, Plus } from 'lucide-react'
import { useTopics } from '../../hooks/useTopics'
import { useQuestions } from '../../hooks/useQuestions'
import { useExams } from '../../hooks/useExams'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: topics } = useTopics()
  const { data: questions } = useQuestions({})
  const { data: exams } = useExams()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido{user?.full_name ? `, ${user.full_name}` : ''}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Panel principal de ExamForge</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Temas" value={topics?.length ?? '—'} icon={BookOpen} color="bg-blue-500" />
        <StatCard label="Preguntas" value={questions?.length ?? '—'} icon={FileText} color="bg-violet-500" />
        <StatCard label="Exámenes" value={exams?.length ?? '—'} icon={Layers} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          title="Banco de preguntas"
          subtitle="Administra y organiza las preguntas por tema"
          action={
            <Button size="sm" onClick={() => navigate('/questions')}>
              <Plus size={14} className="mr-1" /> Nueva pregunta
            </Button>
          }
        >
          <p className="text-sm text-gray-500">
            {questions?.length
              ? `Tienes ${questions.length} pregunta${questions.length !== 1 ? 's' : ''} registrada${questions.length !== 1 ? 's' : ''}.`
              : 'Aún no hay preguntas registradas.'}
          </p>
        </Card>

        <Card
          title="Exámenes"
          subtitle="Crea y genera versiones de exámenes"
          action={
            <Button size="sm" onClick={() => navigate('/exams/new')}>
              <Plus size={14} className="mr-1" /> Nuevo examen
            </Button>
          }
        >
          <p className="text-sm text-gray-500">
            {exams?.length
              ? `Tienes ${exams.length} examen${exams.length !== 1 ? 'es' : ''} creado${exams.length !== 1 ? 's' : ''}.`
              : 'Aún no hay exámenes creados.'}
          </p>
        </Card>
      </div>
    </div>
  )
}
