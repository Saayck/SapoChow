import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

export function AppLayout() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
