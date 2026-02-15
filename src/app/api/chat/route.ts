import { NextRequest, NextResponse } from 'next/server'

const LOCAL_AI_BACKEND_URL = process.env.LOCAL_AI_BACKEND_URL
const LOCAL_AI_API_KEY = process.env.LOCAL_AI_API_KEY

export async function POST(request: NextRequest) {
  if (!LOCAL_AI_BACKEND_URL || !LOCAL_AI_API_KEY) {
    return NextResponse.json(
      { error: 'Chat service is not configured' },
      { status: 503 }
    )
  }

  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${LOCAL_AI_BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': LOCAL_AI_API_KEY,
      },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to get response from chat service' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
