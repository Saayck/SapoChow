import { useEffect } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
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
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
            Selecciona la alternativa correcta
          </span>
        )}
        {correctCount > 1 && (
          <span className="text-xs text-red-600 bg-red-50 border border-red-200/80 px-2.5 py-1 rounded-lg">
            Solo puede haber una alternativa correcta
          </span>
        )}
      </div>

      {alts.map((alt, i) => (
        <div
          key={i}
          className={clsx(
            'border rounded-xl p-4 transition-all duration-200',
            alt.is_correct ? 'border-emerald-300 bg-emerald-50/50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
          )}
        >
          <div className="flex items-start gap-3">
            {/* Letter badge */}
            <button
              type="button"
              onClick={() => markCorrect(i)}
              className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-1 transition-all',
                alt.is_correct
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              )}
            >
              {LETTERS[i]}
            </button>

            <div className="flex-1 space-y-2">
              {/* Text content */}
              <input
                type="text"
                value={alt.content_text ?? ''}
                onChange={(e) => update(i, { content_text: e.target.value })}
                placeholder={`Texto de alternativa ${LETTERS[i]}...`}
                className="block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-150"
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
                'shrink-0 mt-1 transition-all',
                alt.is_correct ? 'text-emerald-500' : 'text-gray-300 hover:text-emerald-400'
              )}
            >
              {alt.is_correct ? <CheckCircle2 size={22} /> : <Circle size={22} />}
            </button>
          </div>
        </div>
      ))}

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}
