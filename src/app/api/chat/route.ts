import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'API error');

    return NextResponse.json({ content: data.content[0].text });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ content: 'Sorry, the AI is unavailable. Please check your ANTHROPIC_API_KEY.' }, { status: 500 });
  }
}
