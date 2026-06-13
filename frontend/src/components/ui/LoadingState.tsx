interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Cargando...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="relative">
        <div className="w-8 h-8 border-2 border-gray-200 rounded-full" />
        <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-primary-500 rounded-full animate-spin" />
      </div>
      <span className="text-sm text-gray-400 font-medium">{message}</span>
    </div>
  )
}
