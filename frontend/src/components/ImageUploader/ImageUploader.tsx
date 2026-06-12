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
    <div className="flex flex-col gap-1.5">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}

      {displayUrl ? (
        <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
          <img src={displayUrl} alt="preview" className="w-full h-full object-cover" />
          {onRemove && (
            <button
              type="button"
              onClick={() => { setPreview(null); onRemove() }}
              className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
            'flex flex-col items-center justify-center gap-2 w-32 h-32 rounded-xl border-2 border-dashed transition-all duration-150',
            error || localError
              ? 'border-red-300 bg-red-50/30 hover:border-red-400 hover:bg-red-50/50'
              : 'border-gray-300 bg-gray-50/50 hover:border-primary-400 hover:bg-primary-50/30',
            loading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {loading ? (
            <div className="w-6 h-6 border-[3px] border-gray-200 border-t-primary-500 rounded-full animate-spin" />
          ) : (
            <>
              <Upload size={20} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Subir imagen</span>
            </>
          )}
        </button>
      )}

      <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleChange} />
      {(localError || error) && <p className="text-xs text-red-500 font-medium">{localError ?? error}</p>}
      <p className="text-xs text-gray-400">JPG, PNG, WebP — máx 10MB</p>
    </div>
  )
}
