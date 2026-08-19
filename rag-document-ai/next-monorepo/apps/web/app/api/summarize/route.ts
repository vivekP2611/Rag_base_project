import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { session_id, text } = await request.json();

    if (!session_id || !text) {
      return NextResponse.json({ error: 'session_id and text are required' }, { status: 400 });
    }

    const backendUrl = 'http://127.0.0.1:8001';
    const response = await fetch(`${backendUrl}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, text }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || 'Summarize backend request failed' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      overview: data.overview,
      key_points: data.key_points,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Summarize error:', error);
    return NextResponse.json({ error: `Failed to summarize: ${message}` }, { status: 500 });
  }
}
