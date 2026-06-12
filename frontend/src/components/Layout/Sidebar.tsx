import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, HelpCircle, FileText, Library } from 'lucide-react'
import { clsx } from 'clsx'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/exams', icon: Library, label: 'Exámenes' },
  { to: '/topics', icon: BookOpen, label: 'Temas' },
  { to: '/questions', icon: HelpCircle, label: 'Banco de preguntas' },
]

export function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col text-white shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-blue-500/20">
            EF
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">ExamForge</span>
            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Plataforma de exámenes</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="px-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">
          Menú principal
        </p>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:bg-white/8 hover:text-white/80'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
                  isActive ? 'bg-white/15' : 'bg-white/5'
                )}>
                  <Icon size={16} className={isActive ? 'text-blue-300' : 'text-white/50'} />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
        <div className="pt-3 mt-3 border-t border-white/10">
          <NavLink
            to="/exams/new"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                  : 'text-white/40 hover:bg-white/8 hover:text-white/70'
              )
            }
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5">
              <FileText size={16} className="text-emerald-400" />
            </div>
            <span>Crear examen</span>
          </NavLink>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-[10px] text-white/30">ExamForge v1.0</p>
      </div>
    </aside>
  )
}
