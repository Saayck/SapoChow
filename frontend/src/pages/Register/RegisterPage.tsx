import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import { getErrorMessage } from '../../services/api'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

const schema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)
    try {
      await authService.register({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
      })
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-white to-surface-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-primary-500/20">
            <span className="text-white font-extrabold text-2xl">E</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ExamForge</h1>
          <p className="text-gray-500 text-sm mt-1">Crea tu cuenta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-elevated border border-gray-200/80 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Registro</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Nombre completo"
              placeholder="Juan Pérez"
              error={errors.full_name?.message}
              {...register('full_name')}
            />
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
              placeholder="Mínimo 6 caracteres"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="Repite la contraseña"
              error={errors.confirm_password?.message}
              {...register('confirm_password')}
            />

            {error && (
              <p className="text-sm text-red-500 text-center bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" loading={isLoading} className="w-full mt-2">
              Crear cuenta
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
