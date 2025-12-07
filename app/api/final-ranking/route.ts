import { NextRequest, NextResponse } from 'next/server'

type ModelResponse = {
  modelId: string
  modelName: string
  response: string
  crossEvaluationScore: number
}

export async function POST(request: NextRequest) {
  try {
    const { topResponses, originalPrompt } = await request.json()

    // Use Gemini Pro to rank the top 3 responses
    const ranking = await getGeminiRanking(topResponses, originalPrompt)

    return NextResponse.json({ ranking })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to get final ranking' },
      { status: 500 }
    )
  }
}

async function getGeminiRanking(
  topResponses: ModelResponse[],
  originalPrompt: string
): Promise<string[]> {
  const apiKey = process.env.GOOGLE_API_KEY

  if (!apiKey) {
    console.log('Google API key not configured, using default ranking')
    return topResponses.map(r => r.modelId)
  }

  const rankingPrompt = `You are an expert AI evaluator. You need to rank these 3 AI model responses to the following prompt.

Original Prompt: "${originalPrompt}"

Here are the 3 responses to rank:

Response A (${topResponses[0].modelName}):
"${topResponses[0].response}"

Response B (${topResponses[1].modelName}):
"${topResponses[1].response}"

Response C (${topResponses[2].modelName}):
"${topResponses[2].response}"

Evaluate each response based on:
1. Quality - Overall excellence and completeness
2. Clarity - How clear and understandable it is
3. Relevance - How well it addresses the prompt
4. Accuracy - Correctness of information
5. Usefulness - Practical value to the user

Rank them from best to worst. Reply ONLY with the letters in order (e.g., "A B C" or "C A B"). No explanations, just the three letters separated by spaces.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: rankingPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 20,
          },
        }),
      }
    )

    const data = await response.json()
    const rankingText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'A B C'

    // Parse the ranking (e.g., "A B C" or "C A B")
    const letters = rankingText.toUpperCase().match(/[ABC]/g) || ['A', 'B', 'C']

    // Map letters back to model IDs
    const letterToIndex: { [key: string]: number } = {
      A: 0,
      B: 1,
      C: 2,
    }

    const ranking = letters
      .slice(0, 3)
      .map((letter: string) => topResponses[letterToIndex[letter]]?.modelId)
      .filter(Boolean)

    // Ensure we have all 3 responses
    if (ranking.length < 3) {
      return topResponses.map(r => r.modelId)
    }

    return ranking
  } catch (error) {
    console.error('Error getting Gemini ranking:', error)
    // Fallback to score-based ranking
    return topResponses.map(r => r.modelId)
  }
}
