import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { session_id, question } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }
    if (!session_id) {
      return NextResponse.json({ error: 'No session_id provided — please re-upload your document' }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, question }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || 'Chat backend request failed' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, answer: data.answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Chat error:', error);
    return NextResponse.json({ error: `Failed to generate answer: ${message}` }, { status: 500 });
  }
}
