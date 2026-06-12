interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Cargando...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400 animate-fade-in">
      <div className="relative">
        <div className="w-10 h-10 border-[3px] border-gray-200 rounded-full" />
        <div className="absolute inset-0 w-10 h-10 border-[3px] border-transparent border-t-primary-500 rounded-full animate-spin" />
      </div>
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}
