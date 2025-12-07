'use client'

import { useState } from 'react'
import ModelSelector from './components/ModelSelector'
import PromptInput from './components/PromptInput'
import ResponseDisplay from './components/ResponseDisplay'
import RankingResults from './components/RankingResults'

export type Model = {
  id: string
  name: string
  enabled: boolean
}

export type ModelResponse = {
  modelId: string
  modelName: string
  response: string
  crossEvaluationScore?: number
}

export type RankingData = {
  geminiRanking: string[]
  userSelection: string | null
  alignment: boolean
}

export default function Home() {
  const [selectedModels, setSelectedModels] = useState<Model[]>([
    { id: 'gpt-4-vision-preview', name: 'GPT-4 Vision', enabled: false },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', enabled: false },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', enabled: false },
    { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', enabled: false },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', enabled: false },
  ])
  const [prompt, setPrompt] = useState('')
  const [imageData, setImageData] = useState<string | null>(null)
  const [responses, setResponses] = useState<ModelResponse[]>([])
  const [rankingData, setRankingData] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState<'input' | 'responses' | 'ranking'>('input')

  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev =>
      prev.map(m => m.id === modelId ? { ...m, enabled: !m.enabled } : m)
    )
  }

  const handleSubmit = async () => {
    const enabledModels = selectedModels.filter(m => m.enabled)
    if (enabledModels.length < 4) {
      alert('Please select at least 4 models')
      return
    }
    if (!prompt.trim()) {
      alert('Please enter a prompt')
      return
    }

    setLoading(true)
    setStage('responses')

    try {
      // Step 1: Get responses from all models
      const response = await fetch('/api/generate-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          models: enabledModels,
          prompt,
          imageData,
        }),
      })

      const data = await response.json()
      setResponses(data.responses)

      // Step 2: Cross-evaluate responses
      const evalResponse = await fetch('/api/cross-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: data.responses,
          originalPrompt: prompt,
        }),
      })

      const evalData = await evalResponse.json()
      setResponses(evalData.evaluatedResponses)

      // Step 3: Get final ranking from Gemini
      const rankResponse = await fetch('/api/final-ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topResponses: evalData.topThree,
          originalPrompt: prompt,
        }),
      })

      const rankData = await rankResponse.json()
      setRankingData({
        geminiRanking: rankData.ranking,
        userSelection: null,
        alignment: false,
      })

      setStage('ranking')
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelection = (modelId: string) => {
    if (!rankingData) return

    const alignment = rankingData.geminiRanking[0] === modelId
    setRankingData({
      ...rankingData,
      userSelection: modelId,
      alignment,
    })
  }

  const handleReset = () => {
    setPrompt('')
    setImageData(null)
    setResponses([])
    setRankingData(null)
    setStage('input')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-2 text-center">
          AI Model Ranker
        </h1>
        <p className="text-gray-300 text-center mb-8">
          Test, compare, and rank multimodal AI model responses
        </p>

        {stage === 'input' && (
          <>
            <ModelSelector
              models={selectedModels}
              onModelToggle={handleModelToggle}
            />
            <PromptInput
              prompt={prompt}
              onPromptChange={setPrompt}
              imageData={imageData}
              onImageChange={setImageData}
              onSubmit={handleSubmit}
              loading={loading}
            />
          </>
        )}

        {stage === 'responses' && (
          <ResponseDisplay
            responses={responses}
            loading={loading}
          />
        )}

        {stage === 'ranking' && rankingData && (
          <RankingResults
            responses={responses}
            rankingData={rankingData}
            onUserSelection={handleUserSelection}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  )
}
