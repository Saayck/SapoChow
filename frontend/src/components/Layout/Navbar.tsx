import { LogOut, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

export function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-sm text-gray-500 font-medium">Sistema de Gestión de Exámenes</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5 text-sm">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <User size={15} className="text-primary-600" />
          </div>
          <span className="text-gray-700 font-medium">{user?.full_name ?? user?.email ?? 'Usuario'}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-red-500 transition-colors duration-150"
        >
          <LogOut size={15} />
          Salir
        </button>
      </div>
    </header>
  )
}
