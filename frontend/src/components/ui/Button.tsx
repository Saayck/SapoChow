import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm hover:shadow active:scale-[0.98]',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
  ghost: 'hover:bg-gray-100 text-gray-600 active:scale-[0.98]',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
