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
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Clave de respuestas — Versión {code}
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">N° Pregunta</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Respuesta correcta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.answers.map((item) => (
              <tr key={item.question_number} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-700">{item.question_number}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
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
