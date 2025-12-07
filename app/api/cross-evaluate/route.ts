import { NextRequest, NextResponse } from 'next/server'

type ModelResponse = {
  modelId: string
  modelName: string
  response: string
}

export async function POST(request: NextRequest) {
  try {
    const { responses, originalPrompt } = await request.json()

    // Each model evaluates all other models' responses
    const evaluations: { [key: string]: number[] } = {}

    for (const evaluator of responses) {
      evaluations[evaluator.modelId] = []

      for (const evaluated of responses) {
        if (evaluator.modelId === evaluated.modelId) {
          // Don't evaluate itself
          continue
        }

        const score = await evaluateResponse(
          evaluator,
          evaluated,
          originalPrompt
        )
        evaluations[evaluator.modelId].push(score)
      }
    }

    // Calculate average score for each response
    const evaluatedResponses = responses.map((response: ModelResponse, idx: number) => {
      const scores: number[] = []

      // Collect all scores this response received from other models
      for (const evaluatorId in evaluations) {
        if (evaluatorId !== response.modelId) {
          const evaluatorScores = evaluations[evaluatorId]
          // Find which position this response was in the evaluator's list
          let position = 0
          let currentPos = 0
          for (let i = 0; i < responses.length; i++) {
            if (responses[i].modelId === response.modelId) {
              position = currentPos
              break
            }
            if (responses[i].modelId !== evaluatorId) {
              currentPos++
            }
          }
          if (evaluatorScores[position] !== undefined) {
            scores.push(evaluatorScores[position])
          }
        }
      }

      const avgScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 7.0

      return {
        ...response,
        crossEvaluationScore: avgScore,
      }
    })

    // Sort by score and get top 3
    const sorted = [...evaluatedResponses].sort(
      (a, b) => b.crossEvaluationScore - a.crossEvaluationScore
    )
    const topThree = sorted.slice(0, 3)

    return NextResponse.json({
      evaluatedResponses,
      topThree,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to cross-evaluate responses' },
      { status: 500 }
    )
  }
}

async function evaluateResponse(
  evaluator: ModelResponse,
  evaluated: ModelResponse,
  originalPrompt: string
): Promise<number> {
  // Create evaluation prompt
  const evaluationPrompt = `You are evaluating an AI model's response to a prompt.

Original Prompt: "${originalPrompt}"

Response to Evaluate:
"${evaluated.response}"

Please rate this response on a scale of 1-10 based on:
- Quality: Is it well-written and clear?
- Clarity: Is it easy to understand?
- Relevance: Does it address the prompt appropriately?
- Accuracy: Is the information correct?

Provide only a numeric score between 1 and 10. Reply with just the number, nothing else.`

  try {
    // Use the evaluator model to score the response
    let score: number

    if (evaluator.modelId.includes('gpt')) {
      score = await getOpenAIEvaluation(evaluator.modelId, evaluationPrompt)
    } else if (evaluator.modelId.includes('claude')) {
      score = await getClaudeEvaluation(evaluator.modelId, evaluationPrompt)
    } else if (evaluator.modelId.includes('gemini')) {
      score = await getGeminiEvaluation(evaluator.modelId, evaluationPrompt)
    } else {
      score = 7.0 // Default score
    }

    return Math.max(1, Math.min(10, score))
  } catch (error) {
    console.error(`Error evaluating with ${evaluator.modelName}:`, error)
    return 7.0 // Default score on error
  }
}

async function getOpenAIEvaluation(modelId: string, prompt: string): Promise<number> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return 7.0

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0.3,
      }),
    })

    const data = await response.json()
    const scoreText = data.choices?.[0]?.message?.content?.trim() || '7'
    return parseFloat(scoreText) || 7.0
  } catch (error) {
    return 7.0
  }
}

async function getClaudeEvaluation(modelId: string, prompt: string): Promise<number> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return 7.0

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 10,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const scoreText = data.content?.[0]?.text?.trim() || '7'
    return parseFloat(scoreText) || 7.0
  } catch (error) {
    return 7.0
  }
}

async function getGeminiEvaluation(modelId: string, prompt: string): Promise<number> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) return 7.0

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 10,
          },
        }),
      }
    )

    const data = await response.json()
    const scoreText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '7'
    return parseFloat(scoreText) || 7.0
  } catch (error) {
    return 7.0
  }
}
