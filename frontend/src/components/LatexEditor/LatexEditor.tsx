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
    <div className="flex flex-col gap-1">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}

      {/* Mode toggle */}
      <div className="flex border border-gray-200 rounded-t-md overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={clsx(
            'flex items-center gap-1 px-3 py-1.5 transition-colors',
            mode === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          )}
        >
          <Edit3 size={12} /> Editar
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={clsx(
            'flex items-center gap-1 px-3 py-1.5 transition-colors',
            mode === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          )}
        >
          <Eye size={12} /> Preview
        </button>
      </div>

      {/* Editor or Preview */}
      <div className={clsx('border rounded-b-md min-h-[80px]', error ? 'border-red-400' : 'border-gray-300')}>
        {mode === 'edit' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-b-md"
          />
        ) : (
          <div className="px-3 py-2 min-h-[80px]">
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

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
