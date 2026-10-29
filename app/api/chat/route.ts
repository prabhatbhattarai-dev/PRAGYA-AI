import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are PRAGYA AI, an advanced, helpful AI assistant. You are warm, wise, precise, and practical. Provide clear, useful answers, explain ideas simply, and help users solve real tasks with confidence. Keep your tone helpful and professional. If the user's request is vague, ask questions before giving a final recommendation.`;

function buildFallbackReply(userMessage: string) {
  const trimmed = userMessage.trim();

  if (!trimmed) {
    return `Hello! I'm Pragya, your AI assistant. What would you like to explore today?`;
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes('write') || lower.includes('draft') || lower.includes('email')) {
    return `I can help you write better. Start with your goal, audience, and tone, and I will turn it into a clear, strong draft.\n\nExample: “Write a professional reply to a client asking for a deadline extension.”`;
  }

  if (lower.includes('explain') || lower.includes('what is') || lower.includes('how does')) {
    return `Here’s a simple way to understand it:\n\n1. Break the subject into its core parts.\n2. Explain the purpose and benefits.\n3. Show the most common use cases.\n4. Note the important limitations.\n\nIf you want, I can help explain this in plain language, step by step.`;
  }

  if (lower.includes('code') || lower.includes('debug') || lower.includes('bug') || lower.includes('fix')) {
    return `Let’s debug it systematically. Share:\n- the error or symptom\n- the code you changed\n- the expected result\n- the actual result\n\nThen I can help you identify the root cause and suggest the cleanest fix.`;
  }

  return `Namaste! I’m PRAGYA AI. I can help with ideas, writing, learning, coding, planning, and problem-solving.\n\nRight now, no AI provider is configured, so this is a local demo response. To enable live AI generation, connect Ollama or add an API key in your environment settings.`;
}

async function callOllama(userMessage: string) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2';

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt: `${SYSTEM_PROMPT}\n\nUser: ${userMessage}`,
      stream: false,
      options: {
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Ollama request failed: ${raw}`);
  }

  const data = await response.json();
  return {
    reply: data.response || 'I could not generate a response from the local model.',
    provider: `Ollama (${model})`,
    needsSetup: false,
  };
}

async function callOpenAI(userMessage: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
  });

  const message = completion.choices[0]?.message?.content;

  return {
    reply: message || 'I could not generate a response from OpenAI.',
    provider: 'OpenAI (gpt-4o-mini)',
    needsSetup: false,
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const userMessage = typeof body?.message === 'string' ? body.message : '';

  if (!userMessage.trim()) {
    return NextResponse.json(
      { error: 'A message is required before sending.' },
      { status: 400 }
    );
  }

  try {
    if (process.env.OPENAI_API_KEY) {
      const result = await callOpenAI(userMessage);
      return NextResponse.json(result);
    }

    if (process.env.OLLAMA_MODEL || process.env.OLLAMA_BASE_URL) {
      const result = await callOllama(userMessage);
      return NextResponse.json(result);
    }

    return NextResponse.json({
      reply: buildFallbackReply(userMessage),
      provider: 'Local demo mode',
      needsSetup: true,
      setupMessage:
        'No AI provider is connected yet. Install Ollama, pull a model like llama3.2, and set OLLAMA_MODEL in your environment, or add an OpenAI API key.',
    });
  } catch (error) {
    const fallbackReply = buildFallbackReply(userMessage);
    return NextResponse.json({
      reply: `${fallbackReply}\n\n${error instanceof Error ? error.message : 'Unknown provider error.'}`,
      provider: 'Local demo mode',
      needsSetup: true,
      setupMessage:
        'No AI provider is connected yet. Use Ollama locally or configure another free AI provider in the environment.',
    });
  }
}
