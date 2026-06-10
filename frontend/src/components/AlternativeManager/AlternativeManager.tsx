import { useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { LatexEditor } from '../LatexEditor/LatexEditor'
import { ImageUploader } from '../ImageUploader/ImageUploader'
import { clsx } from 'clsx'
import type { AlternativeCreate } from '../../types/alternative'

const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const

interface AlternativeManagerProps {
  value: AlternativeCreate[]
  onChange: (alts: AlternativeCreate[]) => void
  imageFiles?: (File | null)[]
  onImageFiles?: (files: (File | null)[]) => void
  error?: string
}

const emptyAlt = (): AlternativeCreate => ({
  content_text: '',
  content_latex: '',
  is_correct: false,
})

export function AlternativeManager({ value, onChange, imageFiles, onImageFiles, error }: AlternativeManagerProps) {
  useEffect(() => {
    if (value.length !== 5) {
      const filled = [...value]
      while (filled.length < 5) filled.push(emptyAlt())
      onChange(filled.slice(0, 5))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const alts = value.length === 5 ? value : Array(5).fill(null).map((_, i) => value[i] ?? emptyAlt())

  const update = (index: number, patch: Partial<AlternativeCreate>) => {
    const next = alts.map((a, i) => (i === index ? { ...a, ...patch } : a))
    onChange(next)
  }

  const markCorrect = (index: number) => {
    onChange(alts.map((a, i) => ({ ...a, is_correct: i === index })))
  }

  const setImageFile = (index: number, file: File | null) => {
    if (!onImageFiles || !imageFiles) return
    const next = [...imageFiles]
    next[index] = file
    onImageFiles(next)
  }

  const correctCount = alts.filter((a) => a.is_correct).length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Alternativas (exactamente 5)</p>
        {correctCount === 0 && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            ⚠ Selecciona la alternativa correcta
          </span>
        )}
        {correctCount > 1 && (
          <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            ✗ Solo puede haber una alternativa correcta
          </span>
        )}
      </div>

      {alts.map((alt, i) => (
        <div
          key={i}
          className={clsx(
            'border rounded-lg p-4 transition-colors',
            alt.is_correct ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex items-start gap-3">
            {/* Letter badge */}
            <div
              className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-1',
                alt.is_correct ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
              )}
            >
              {LETTERS[i]}
            </div>

            <div className="flex-1 space-y-2">
              {/* Text content */}
              <input
                type="text"
                value={alt.content_text ?? ''}
                onChange={(e) => update(i, { content_text: e.target.value })}
                placeholder={`Texto de alternativa ${LETTERS[i]}...`}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              {/* LaTeX content */}
              <LatexEditor
                value={alt.content_latex ?? ''}
                onChange={(v) => update(i, { content_latex: v })}
                placeholder="LaTeX opcional..."
              />

              {/* Image upload per alternative */}
              {onImageFiles && imageFiles && (
                <ImageUploader
                  label="Imagen de alternativa (opcional)"
                  currentUrl={alt.image_path ?? null}
                  onFile={(file) => setImageFile(i, file)}
                  onRemove={() => {
                    setImageFile(i, null)
                    update(i, { image_path: undefined })
                  }}
                />
              )}
            </div>

            {/* Mark as correct */}
            <button
              type="button"
              onClick={() => markCorrect(i)}
              title={alt.is_correct ? 'Correcta' : 'Marcar como correcta'}
              className={clsx(
                'shrink-0 mt-1 transition-colors',
                alt.is_correct ? 'text-green-500' : 'text-gray-300 hover:text-green-400'
              )}
            >
              <CheckCircle2 size={22} />
            </button>
          </div>
        </div>
      ))}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
