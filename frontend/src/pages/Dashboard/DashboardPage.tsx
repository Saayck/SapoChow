import { useNavigate } from 'react-router-dom'
import { BookOpen, FileText, Layers, Plus, ArrowRight, Sparkles } from 'lucide-react'
import { useTopics } from '../../hooks/useTopics'
import { useQuestions } from '../../hooks/useQuestions'
import { useExams } from '../../hooks/useExams'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

function StatCard({ label, value, icon: Icon, gradient, accent }: {
  label: string; value: number | string; icon: React.ElementType; gradient: string; accent: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-card-hover hover:border-gray-300 group cursor-default">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient} shadow-lg`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        <p className="text-sm text-gray-400 font-medium">{label}</p>
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
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Bienvenido{user?.full_name ? `, ${user.full_name}` : ''}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Panel principal de ExamForge</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-200/80 rounded-xl px-3 py-1.5 shadow-sm">
          <Sparkles size={12} className="text-primary-500" />
          Sistema activo
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Temas" value={topics?.length ?? '—'} icon={BookOpen} gradient="bg-gradient-to-br from-blue-500 to-blue-600" accent="blue" />
        <StatCard label="Preguntas" value={questions?.length ?? '—'} icon={FileText} gradient="bg-gradient-to-br from-violet-500 to-violet-600" accent="violet" />
        <StatCard label="Exámenes" value={exams?.length ?? '—'} icon={Layers} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" accent="emerald" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          title="Banco de preguntas"
          subtitle="Administra y organiza las preguntas por tema"
          action={
            <Button size="sm" variant="secondary" onClick={() => navigate('/questions')}>
              <Plus size={13} /> Nueva pregunta
            </Button>
          }
          hover
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {questions?.length
                ? `Tienes ${questions.length} pregunta${questions.length !== 1 ? 's' : ''} registrada${questions.length !== 1 ? 's' : ''}.`
                : 'Aún no hay preguntas registradas.'}
            </p>
            <button
              onClick={() => navigate('/questions')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              Ver todo <ArrowRight size={13} />
            </button>
          </div>
        </Card>

        <Card
          title="Exámenes"
          subtitle="Crea y genera versiones de exámenes"
          action={
            <Button size="sm" variant="secondary" onClick={() => navigate('/exams/new')}>
              <Plus size={13} /> Nuevo examen
            </Button>
          }
          hover
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {exams?.length
                ? `Tienes ${exams.length} examen${exams.length !== 1 ? 'es' : ''} creado${exams.length !== 1 ? 's' : ''}.`
                : 'Aún no hay exámenes creados.'}
            </p>
            <button
              onClick={() => navigate('/exams')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              Ver todos <ArrowRight size={13} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
