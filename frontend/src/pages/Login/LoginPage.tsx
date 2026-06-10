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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#1e3a5f] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ExamForge</h1>
          <p className="text-gray-500 text-sm mt-1">Plataforma de exámenes virtuales</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Iniciar sesión</h2>

          {justRegistered && (
            <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
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
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button type="submit" loading={isLoading} className="w-full mt-2">
              Ingresar
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
