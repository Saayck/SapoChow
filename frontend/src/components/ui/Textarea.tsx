import { TextareaHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={clsx(
            'block w-full rounded-xl border px-3.5 py-2.5 text-sm shadow-sm transition-all duration-150 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-y min-h-[80px]',
            error
              ? 'border-red-300 bg-red-50/50 text-red-900 focus:border-red-400 focus:ring-red-500/20'
              : 'border-gray-200 bg-white text-gray-900 focus:border-primary-400 focus:ring-primary-500/15 hover:border-gray-300',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
