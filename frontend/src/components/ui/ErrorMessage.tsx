import { AlertTriangle } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <p className="text-sm font-medium text-gray-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
