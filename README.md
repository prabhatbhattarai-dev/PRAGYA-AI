# PRAGYA AI

PRAGYA AI is a free-ready, modern AI assistant web app built with Next.js, TypeScript, and Tailwind CSS. It gives you a clean ChatGPT-style experience while keeping the stack minimal, flexible, and open-source.

Features:
- Dark mode by default
- Responsive chat layout
- Sidebar conversations
- Markdown rendering and copy buttons
- Local demo mode when no AI provider is connected
- Optional live AI via Ollama or OpenAI
- Free local development and free deployment on Vercel

Free-tier and cost strategy:
- Ollama is the recommended free local model path.
- Use a local open-source model like Llama 3.2 to keep costs at $0.
- Vercel has a free plan for hosting Next.js apps.
- Supabase or PostgreSQL can be added later for account and chat persistence if needed.
- If no AI provider is configured, the app shows a helpful setup message instead of pretending the AI is live.

Recommended provider setup:
- Best free option: Ollama running locally
- Alternative: OpenAI API key if you later choose a paid service

Quick start:

1. Install Node.js 18+.
2. In the project root, run:

```bash
npm install
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

4. Open:

```bash
http://localhost:3000
```

Optional free AI setup with Ollama:

```bash
# Install Ollama from https://ollama.com
ollama pull llama3.2
```

Then set your environment in `.env.local`:

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

The app will use the local model when available. If it is not running, the app stays in demo mode and shows a clear setup message.

Production deployment:

- Deploy the project on Vercel
- Import the repository and set environment variables
- Use `.env.local` values in the Vercel project settings
- Build with `npm run build` and deploy

Important note:
- Without a valid AI provider, PRAGYA AI still works as a polished front-end and demo assistant, but it does not claim to be a real AI unless a model is connected.

Project structure:

```bash
app/
  api/chat/route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  pragya-chat.tsx
  theme-provider.tsx
.env.example
package.json
next.config.mjs
tailwind.config.ts
postcss.config.js
```

This setup keeps the app free, understandable, and easy to extend later with user accounts, persistent chat history, and more advanced AI providers.
