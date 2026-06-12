import { useState } from 'react'
import { Eye, Edit3 } from 'lucide-react'
import { renderLatex } from '../../utils/latex'
import { clsx } from 'clsx'

interface LatexEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  displayMode?: boolean
}

export function LatexEditor({
  value,
  onChange,
  placeholder = 'Escribe LaTeX aquí... Ej: \\frac{a}{b}',
  label,
  error,
  displayMode = false,
}: LatexEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  return (
    <div className="flex flex-col gap-1.5">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}

      {/* Mode toggle */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 font-medium transition-all duration-150',
            mode === 'edit' ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          )}
        >
          <Edit3 size={12} /> Editar
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 font-medium transition-all duration-150',
            mode === 'preview' ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          )}
        >
          <Eye size={12} /> Preview
        </button>
      </div>

      {/* Editor or Preview */}
      <div className={clsx(
        'border rounded-lg overflow-hidden transition-all duration-150',
        error ? 'border-red-300' : 'border-gray-300 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/30'
      )}>
        {mode === 'edit' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 text-sm font-mono resize-y focus:outline-none placeholder:text-gray-400"
          />
        ) : (
          <div className="px-3 py-3 min-h-[80px]">
            {value ? (
              <div
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: renderLatex(value, displayMode) }}
              />
            ) : (
              <p className="text-gray-400 text-sm italic">Sin contenido LaTeX</p>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}
