import { NextRequest, NextResponse } from 'next/server'

type Model = {
  id: string
  name: string
  enabled: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { models, prompt, imageData } = await request.json()

    const responses = await Promise.all(
      models.map(async (model: Model) => {
        try {
          const response = await generateModelResponse(model, prompt, imageData)
          return {
            modelId: model.id,
            modelName: model.name,
            response,
          }
        } catch (error) {
          console.error(`Error with ${model.name}:`, error)
          return {
            modelId: model.id,
            modelName: model.name,
            response: `Error generating response: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }
        }
      })
    )

    return NextResponse.json({ responses })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate responses' },
      { status: 500 }
    )
  }
}

async function generateModelResponse(
  model: Model,
  prompt: string,
  imageData: string | null
): Promise<string> {
  // Simulate API calls to different models
  // In production, replace with actual API calls

  if (model.id.includes('gpt')) {
    return generateOpenAIResponse(model.id, prompt, imageData)
  } else if (model.id.includes('claude')) {
    return generateClaudeResponse(model.id, prompt, imageData)
  } else if (model.id.includes('gemini')) {
    return generateGeminiResponse(model.id, prompt, imageData)
  }

  return 'Model not supported'
}

async function generateOpenAIResponse(
  modelId: string,
  prompt: string,
  imageData: string | null
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.'
  }

  try {
    const messages: any[] = []

    if (imageData) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: imageData },
          },
        ],
      })
    } else {
      messages.push({
        role: 'user',
        content: prompt,
      })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId === 'gpt-4-vision-preview' ? 'gpt-4-vision-preview' : 'gpt-4-turbo',
        messages,
        max_tokens: 1000,
      }),
    })

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'No response generated'
  } catch (error) {
    throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function generateClaudeResponse(
  modelId: string,
  prompt: string,
  imageData: string | null
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your environment variables.'
  }

  try {
    const content: any[] = []

    if (imageData) {
      const base64Data = imageData.split(',')[1]
      const mediaType = imageData.split(';')[0].split(':')[1]

      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64Data,
        },
      })
    }

    content.push({
      type: 'text',
      text: prompt,
    })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelId === 'claude-3-opus' ? 'claude-3-opus-20240229' : 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      }),
    })

    const data = await response.json()
    return data.content?.[0]?.text || 'No response generated'
  } catch (error) {
    throw new Error(`Claude API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function generateGeminiResponse(
  modelId: string,
  prompt: string,
  imageData: string | null
): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return 'Google API key not configured. Please add GOOGLE_API_KEY to your environment variables.'
  }

  try {
    const parts: any[] = [{ text: prompt }]

    if (imageData) {
      const base64Data = imageData.split(',')[1]
      const mimeType = imageData.split(';')[0].split(':')[1]

      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data,
        },
      })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts,
            },
          ],
        }),
      }
    )

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated'
  } catch (error) {
    throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
