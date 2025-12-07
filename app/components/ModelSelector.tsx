import { Model } from '../page'

type Props = {
  models: Model[]
  onModelToggle: (modelId: string) => void
}

export default function ModelSelector({ models, onModelToggle }: Props) {
  const enabledCount = models.filter(m => m.enabled).length

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-white mb-4">
        Select Models ({enabledCount}/5)
      </h2>
      <p className="text-gray-300 mb-4">Choose 4-5 models to compare</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map(model => (
          <button
            key={model.id}
            onClick={() => onModelToggle(model.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              model.enabled
                ? 'bg-purple-600 border-purple-400 text-white'
                : 'bg-white/5 border-gray-600 text-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{model.name}</span>
              {model.enabled && (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
      {enabledCount < 4 && enabledCount > 0 && (
        <p className="text-yellow-400 mt-4">
          Please select at least {4 - enabledCount} more model(s)
        </p>
      )}
    </div>
  )
}
