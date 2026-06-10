import { useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { validateImageFile } from '../../utils/validators'
import { clsx } from 'clsx'

interface ImageUploaderProps {
  onFile: (file: File) => void
  currentUrl?: string | null
  onRemove?: () => void
  loading?: boolean
  error?: string
  label?: string
}

export function ImageUploader({ onFile, currentUrl, onRemove, loading, error, label }: ImageUploaderProps) {
  const ref = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { setLocalError(err); return }
    setLocalError(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    onFile(file)
  }

  const displayUrl = preview ?? currentUrl

  return (
    <div className="flex flex-col gap-1">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}

      {displayUrl ? (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
          <img src={displayUrl} alt="preview" className="w-full h-full object-cover" />
          {onRemove && (
            <button
              type="button"
              onClick={() => { setPreview(null); onRemove() }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={loading}
          className={clsx(
            'flex flex-col items-center justify-center gap-2 w-32 h-32 rounded-lg border-2 border-dashed text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors',
            error || localError ? 'border-red-300' : 'border-gray-300',
            loading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <>
              <Upload size={20} />
              <span className="text-xs text-center">Subir imagen</span>
            </>
          )}
        </button>
      )}

      <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleChange} />
      {(localError || error) && <p className="text-xs text-red-500">{localError ?? error}</p>}
      <p className="text-xs text-gray-400">JPG, PNG, WebP — máx 10MB</p>
    </div>
  )
}
