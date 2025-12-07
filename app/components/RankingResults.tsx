import { ModelResponse, RankingData } from '../page'

type Props = {
  responses: ModelResponse[]
  rankingData: RankingData
  onUserSelection: (modelId: string) => void
  onReset: () => void
}

export default function RankingResults({
  responses,
  rankingData,
  onUserSelection,
  onReset,
}: Props) {
  const getResponseByModelId = (modelId: string) =>
    responses.find(r => r.modelId === modelId)

  const topThree = responses
    .sort((a, b) => (b.crossEvaluationScore || 0) - (a.crossEvaluationScore || 0))
    .slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
        <h2 className="text-3xl font-bold text-white mb-4">Final Rankings</h2>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-purple-400 mb-4">
            Gemini Pro Final Ranking
          </h3>
          <div className="space-y-3">
            {rankingData.geminiRanking.map((modelId, index) => {
              const response = getResponseByModelId(modelId)
              return (
                <div
                  key={modelId}
                  className="bg-purple-600/20 border border-purple-500 rounded-lg p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg">
                        {response?.modelName}
                      </p>
                      <p className="text-gray-300 text-sm">
                        Cross-Evaluation Score: {response?.crossEvaluationScore?.toFixed(1)}/10
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-blue-400 mb-4">
            Your Selection
          </h3>
          <p className="text-gray-300 mb-4">
            Which response do you think is the best?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map(response => (
              <button
                key={response.modelId}
                onClick={() => onUserSelection(response.modelId)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  rankingData.userSelection === response.modelId
                    ? 'bg-blue-600 border-blue-400 text-white'
                    : 'bg-white/5 border-gray-600 text-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold text-lg">{response.modelName}</div>
                <div className="text-sm mt-1">
                  Score: {response.crossEvaluationScore?.toFixed(1)}/10
                </div>
              </button>
            ))}
          </div>
        </div>

        {rankingData.userSelection && (
          <div
            className={`p-6 rounded-lg ${
              rankingData.alignment
                ? 'bg-green-600/20 border border-green-500'
                : 'bg-yellow-600/20 border border-yellow-500'
            }`}
          >
            <h3 className="text-xl font-semibold text-white mb-2">
              Alignment Analysis
            </h3>
            {rankingData.alignment ? (
              <div className="flex items-center gap-2 text-green-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="font-semibold">
                  Perfect alignment! Your choice matches Gemini Pro's #1 ranking.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="font-semibold">
                  Different preference. Your choice differs from Gemini Pro's top pick.
                </p>
              </div>
            )}
            <p className="text-gray-300 mt-2">
              You selected:{' '}
              <span className="font-semibold text-white">
                {getResponseByModelId(rankingData.userSelection)?.modelName}
              </span>
            </p>
            <p className="text-gray-300">
              Gemini Pro's top choice:{' '}
              <span className="font-semibold text-white">
                {getResponseByModelId(rankingData.geminiRanking[0])?.modelName}
              </span>
            </p>
          </div>
        )}

        <button
          onClick={onReset}
          className="mt-6 w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-all"
        >
          Start New Test
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">All Responses</h3>
        <div className="space-y-4">
          {responses.map(response => (
            <div
              key={response.modelId}
              className="bg-white/5 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold text-white">
                  {response.modelName}
                </h4>
                <span className="text-purple-400 font-semibold">
                  {response.crossEvaluationScore?.toFixed(1)}/10
                </span>
              </div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                {response.response}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
