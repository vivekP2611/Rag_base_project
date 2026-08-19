import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Forward to Python backend for extraction + embedding
    const pythonFormData = new FormData();
    pythonFormData.append('file', file);

    const backendUrl = 'http://127.0.0.1:8001';
    const response = await fetch(`${backendUrl}/extract`, {
      method: 'POST',
      body: pythonFormData,
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return NextResponse.json(
        { error: data.error || data.detail || 'Backend extraction failed' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      session_id: data.session_id,
      text: data.text,
      text_preview: data.text_preview,
      chunk_count: data.chunk_count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Upload error:', error);
    return NextResponse.json({ error: `Failed to process document: ${message}` }, { status: 500 });
  }
}