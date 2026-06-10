import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, HelpCircle, FileText } from 'lucide-react'
import { clsx } from 'clsx'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/topics', icon: BookOpen, label: 'Temas' },
  { to: '/questions', icon: HelpCircle, label: 'Banco de preguntas' },
  { to: '/exams/new', icon: FileText, label: 'Crear examen' },
]

export function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-[#1e3a5f] flex flex-col text-white shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center font-bold text-white text-sm">
            EF
          </div>
          <span className="text-lg font-bold tracking-tight">ExamForge</span>
        </div>
        <p className="text-xs text-white/50 mt-1">Plataforma de exámenes</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
