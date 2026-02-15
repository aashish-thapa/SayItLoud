import { NextResponse } from 'next/server'

const LOCAL_AI_BACKEND_URL = process.env.LOCAL_AI_BACKEND_URL

export async function GET() {
  if (!LOCAL_AI_BACKEND_URL) {
    return NextResponse.json(
      { error: 'Server status endpoint is not configured' },
      { status: 503 }
    )
  }

  try {
    const response = await fetch(`${LOCAL_AI_BACKEND_URL}/health`, {
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Health check failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Server is unreachable' },
      { status: 503 }
    )
  }
}
