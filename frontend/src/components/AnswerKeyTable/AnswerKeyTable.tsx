import { useAnswerKey } from '../../hooks/useVersions'
import { LoadingState } from '../ui/LoadingState'
import { ErrorMessage } from '../ui/ErrorMessage'

interface AnswerKeyTableProps {
  versionId: number
  versionCode?: string
}

export function AnswerKeyTable({ versionId, versionCode }: AnswerKeyTableProps) {
  const { data, isLoading, error } = useAnswerKey(versionId)

  if (isLoading) return <LoadingState message="Cargando clave..." />
  if (error || !data) return <ErrorMessage message="No se pudo cargar la clave de respuestas" />

  const code = versionCode ?? data.version_code

  return (
    <div className="animate-fade-in">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Clave de respuestas — Versión {code}
      </h3>

      <div className="overflow-x-auto rounded-xl border border-amber-200/60 shadow-sm">
        <table className="min-w-full divide-y divide-amber-100 text-sm">
          <thead className="bg-amber-50/80">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">N° Pregunta</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">Respuesta correcta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-50 bg-white">
            {data.answers.map((item) => (
              <tr key={item.question_number} className="hover:bg-amber-50/30 transition-colors">
                <td className="px-4 py-2.5 text-gray-500">{item.question_number}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                    {item.correct_letter}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
