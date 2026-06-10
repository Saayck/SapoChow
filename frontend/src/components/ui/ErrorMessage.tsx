import { AlertTriangle } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-red-500">
      <AlertTriangle size={32} />
      <p className="text-sm font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-blue-600 hover:underline"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
