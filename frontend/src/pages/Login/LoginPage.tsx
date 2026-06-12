import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLogin } from '../../hooks/useAuth'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

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
    <div className="min-h-screen bg-gradient-to-br from-surface via-white to-surface-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="ExamForge" className="w-20 h-20 mx-auto mb-5 rounded-2xl shadow-xl object-cover" />
          <h1 className="text-2xl font-bold text-gray-900">ExamForge</h1>
          <p className="text-gray-500 text-sm mt-1">Plataforma de exámenes virtuales</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-elevated border border-gray-200/80 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Iniciar sesión</h2>

          {justRegistered && (
            <div className="mb-5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-xl px-4 py-3">
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
              <p className="text-sm text-red-500 text-center bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" loading={isLoading} className="w-full mt-2">
              Ingresar
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
