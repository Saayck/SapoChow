import { AlertTriangle } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
        <AlertTriangle size={22} className="text-red-400" />
      </div>
      <p className="text-sm text-gray-500 font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
