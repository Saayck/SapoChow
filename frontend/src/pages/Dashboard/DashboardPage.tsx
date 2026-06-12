import { useNavigate } from 'react-router-dom'
import { BookOpen, FileText, Layers, Plus, ArrowRight } from 'lucide-react'
import { useTopics } from '../../hooks/useTopics'
import { useQuestions } from '../../hooks/useQuestions'
import { useExams } from '../../hooks/useExams'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-card-hover hover:border-gray-300 group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shadow-lg shadow-current/20`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{value}</p>
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
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenido{user?.full_name ? `, ${user.full_name}` : ''}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Panel principal de ExamForge</p>
        </div>
        <div className="hidden sm:flex w-2 h-2 rounded-full bg-emerald-500" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Temas" value={topics?.length ?? '—'} icon={BookOpen} color="bg-blue-500" />
        <StatCard label="Preguntas" value={questions?.length ?? '—'} icon={FileText} color="bg-violet-500" />
        <StatCard label="Exámenes" value={exams?.length ?? '—'} icon={Layers} color="bg-emerald-500" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          title="Banco de preguntas"
          subtitle="Administra y organiza las preguntas por tema"
          action={
            <Button size="sm" onClick={() => navigate('/questions')}>
              <Plus size={14} /> Nueva pregunta
            </Button>
          }
          hover
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {questions?.length
                ? `Tienes ${questions.length} pregunta${questions.length !== 1 ? 's' : ''} registrada${questions.length !== 1 ? 's' : ''}.`
                : 'Aún no hay preguntas registradas.'}
            </p>
            <button
              onClick={() => navigate('/questions')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              Ver todo <ArrowRight size={14} />
            </button>
          </div>
        </Card>

        <Card
          title="Exámenes"
          subtitle="Crea y genera versiones de exámenes"
          action={
            <Button size="sm" onClick={() => navigate('/exams/new')}>
              <Plus size={14} /> Nuevo examen
            </Button>
          }
          hover
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {exams?.length
                ? `Tienes ${exams.length} examen${exams.length !== 1 ? 'es' : ''} creado${exams.length !== 1 ? 's' : ''}.`
                : 'Aún no hay exámenes creados.'}
            </p>
            <button
              onClick={() => navigate('/exams')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              Ver todos <ArrowRight size={14} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
