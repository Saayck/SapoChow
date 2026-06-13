import { LogOut, User, Menu } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <header className="h-14 sm:h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/60 flex items-center justify-between px-3 sm:px-6 lg:px-8 shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-xl p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all -ml-1"
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </button>
        <div className="relative flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs sm:text-sm text-gray-400 font-medium truncate">Sistema de Gestión de Exámenes</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-2.5 text-sm">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm shadow-primary-500/20">
            <span className="text-[10px] sm:text-xs font-bold text-white">{initials}</span>
          </div>
          <span className="hidden sm:block text-gray-700 font-medium text-sm truncate max-w-[120px]">
            {user?.full_name ?? user?.email ?? 'Usuario'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-400 hover:text-red-500 transition-colors duration-150 px-2 py-1.5 rounded-lg hover:bg-red-50/50"
        >
          <LogOut size={13} className="sm:hidden" />
          <LogOut size={14} className="hidden sm:block" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  )
}
