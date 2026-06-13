import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLogin } from '../../hooks/useAuth'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { FileText } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const { isAuthenticated } = useAuthStore()
  const { handleLogin, isLoading, error } = useLogin()
  const location = useLocation()
  const justRegistered = (location.state as { registered?: boolean } | null)?.registered

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 mb-5">
              <FileText size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Accede a tu cuenta</h1>
            <p className="text-gray-400 text-sm mt-1.5">Ingresa tus credenciales para continuar</p>
          </div>

          {justRegistered && (
            <div className="mb-6 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-xl px-4 py-3 animate-slide-down">
              Cuenta creada correctamente. Ya puedes iniciar sesión.
            </div>
          )}

          <form onSubmit={handleSubmit(handleLogin)} className="flex flex-col gap-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="correo@ejemplo.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="Ingresa tu contraseña"
              error={errors.password?.message}
              {...register('password')}
            />

            {error && (
              <p className="text-sm text-red-500 text-center bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
            )}

            <Button type="submit" loading={isLoading} className="w-full mt-1">
              Ingresar
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-8">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
              Regístrate
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative z-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-white/10">
            <FileText size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">ExamForge</h2>
          <p className="text-primary-200/80 text-sm leading-relaxed">
            Plataforma inteligente para crear, gestionar y generar versiones aleatorias de exámenes académicos con soporte para LaTeX y exportación PDF.
          </p>
        </div>
      </div>
    </div>
  )
}
