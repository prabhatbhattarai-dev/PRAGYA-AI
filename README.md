# PRAGYA-AI

PRAGYA AI is a small, friendly AI assistant project inspired by the system prompt you provided. It behaves like a wise, encouraging mentor and can answer questions, help with coding, and guide users in a calm and practical way.

Features:
- Friendly mentor-style personality
- Optional OpenAI-powered generation when an API key is configured
- Local fallback responses when no API key is available
- Simple FastAPI web API for chat

Quick start:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app:app --reload
```

Then open:
- http://127.0.0.1:8000/docs

Example request:

```bash
curl -X POST http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Help me plan my study schedule"}'
```

If you want to use real LLM generation, add your OpenAI API key to `.env`:

```bash
OPENAI_API_KEY=your_key_here
```

Without an API key, the assistant still works with a built-in helpful fallback mode.
