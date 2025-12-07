import { ModelResponse } from '../page'

type Props = {
  responses: ModelResponse[]
  loading: boolean
}

export default function ResponseDisplay({ responses, loading }: Props) {
  if (loading && responses.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <svg
            className="animate-spin h-12 w-12 text-purple-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-xl text-white font-semibold">Generating responses...</p>
          <p className="text-gray-400 mt-2">This may take a moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-4">Model Responses</h2>
      {responses.map(response => (
        <div
          key={response.modelId}
          className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{response.modelName}</h3>
            {response.crossEvaluationScore !== undefined && (
              <div className="bg-purple-600 text-white px-4 py-2 rounded-full font-semibold">
                Score: {response.crossEvaluationScore.toFixed(1)}/10
              </div>
            )}
          </div>
          <div className="text-gray-300 whitespace-pre-wrap">
            {response.response}
          </div>
        </div>
      ))}
      {loading && (
        <div className="text-center text-gray-400 mt-4">
          <p>Cross-evaluating responses...</p>
        </div>
      )}
    </div>
  )
}
