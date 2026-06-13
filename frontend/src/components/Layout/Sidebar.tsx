import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, HelpCircle, FileText, Library, ChevronRight, X } from 'lucide-react'
import { clsx } from 'clsx'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/exams', icon: Library, label: 'Exámenes' },
  { to: '/topics', icon: BookOpen, label: 'Temas' },
  { to: '/questions', icon: HelpCircle, label: 'Banco de preguntas' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const sidebar = (
    <aside className={clsx(
      'w-64 min-h-screen bg-sidebar flex flex-col text-white shrink-0',
      'lg:static lg:translate-x-0 lg:min-h-screen',
      'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
      open ? 'translate-x-0' : '-translate-x-full'
    )}>
      <div className="flex items-center justify-between px-5 py-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <FileText size={16} className="text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight">ExamForge</span>
            <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest hidden sm:block">Plataforma de exámenes</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden rounded-lg p-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-2.5 py-5 space-y-0.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold text-white/20 uppercase tracking-widest mb-3">
          Menú principal
        </p>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
                  isActive ? 'bg-primary-500/20' : 'bg-white/[0.04] group-hover:bg-white/[0.06]'
                )}>
                  <Icon size={16} className={isActive ? 'text-primary-400' : 'text-white/30'} />
                </div>
                {label}
                {isActive && <ChevronRight size={14} className="ml-auto text-white/20" />}
              </>
            )}
          </NavLink>
        ))}
        <div className="pt-4 mt-4 border-t border-white/[0.06]">
          <p className="px-3 text-[10px] font-semibold text-white/20 uppercase tracking-widest mb-3">
            Acción rápida
          </p>
          <NavLink
            to="/exams/new"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
              )
            }
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 group-hover:bg-emerald-500/15 transition-all">
              <FileText size={16} className="text-emerald-400" />
            </div>
            <span>Crear examen</span>
          </NavLink>
        </div>
      </nav>

      <div className="px-5 py-4 border-t border-white/[0.06] hidden sm:block">
        <p className="text-[10px] text-white/20">ExamForge v1.0</p>
      </div>
    </aside>
  )

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}
      {sidebar}
    </>
  )
}
