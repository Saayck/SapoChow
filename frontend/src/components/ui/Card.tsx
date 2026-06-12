import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: ReactNode
  hover?: boolean
}

export function Card({ children, className, title, subtitle, action, hover }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-gray-200 shadow-card transition-all duration-200',
        hover && 'hover:shadow-card-hover hover:border-gray-300',
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="min-w-0">
            {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0 ml-4">{action}</div>}
        </div>
      )}
      <div className={clsx((title || action) ? 'p-6' : 'p-6')}>{children}</div>
    </div>
  )
}
