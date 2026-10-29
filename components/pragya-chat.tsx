'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Send,
  Sparkles,
  StopCircle,
  Sun,
  User2,
  Wand2,
} from 'lucide-react';
import { useTheme } from 'next-themes';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
};

const welcomeMessage = "Hello! I'm Pragya, your AI assistant. What would you like to explore today?";

const starterPrompts = [
  'Explain something complicated.',
  'Help me write better.',
  'Help me build a better study plan.',
  'Create a short product pitch.',
];

function formatNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createMessage(role: 'user' | 'assistant', content: string): Message {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: formatNow(),
  };
}

function createConversation(title: string, firstMessage?: Message): Conversation {
  return {
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    updatedAt: new Date().toISOString(),
    messages: firstMessage ? [firstMessage] : [],
  };
}

export function PragyaChat() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [status, setStatus] = useState('Ready');
  const [providerNote, setProviderNote] = useState('No AI provider connected yet. Local demo mode is enabled.');
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('pragya-ai-conversations');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Conversation[];
        if (parsed.length) {
          setConversations(parsed);
          setActiveConversationId(parsed[0].id);
          return;
        }
      } catch {
        // ignore invalid data and continue to default state
      }
    }

    const welcome = createMessage('assistant', welcomeMessage);
    const defaultConversation = createConversation('Welcome', welcome);
    setConversations([defaultConversation]);
    setActiveConversationId(defaultConversation.id);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('pragya-ai-conversations', JSON.stringify(conversations));
    }
  }, [conversations, mounted]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? conversations[0] ?? null,
    [activeConversationId, conversations],
  );

  const createNewConversation = () => {
    const welcome = createMessage('assistant', welcomeMessage);
    const newConvo = createConversation('New Chat', welcome);
    setConversations((current) => [newConvo, ...current]);
    setActiveConversationId(newConvo.id);
    setInput('');
  };

  const updateConversation = (nextMessages: Message[]) => {
    if (!activeConversationId) return;

    setConversations((current) =>
      current.map((conversation) => {
        if (conversation.id !== activeConversationId) return conversation;

        return {
          ...conversation,
          title:
            nextMessages[0]?.role === 'assistant' && nextMessages.length === 1
              ? 'Welcome'
              : conversation.title,
          updatedAt: new Date().toISOString(),
          messages: nextMessages,
        };
      }),
    );
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !activeConversation) return;

    const userMessage = input.trim();
    const message = createMessage('user', userMessage);
    const nextMessages = [...activeConversation.messages, message];
    updateConversation(nextMessages);
    setInput('');
    setLoading(true);
    setStatus('Thinking...');

    const assistantMessage = createMessage('assistant', '');
    const streamingMessages = [...nextMessages, assistantMessage];
    setConversations((current) =>
      current.map((conversation) => {
        if (conversation.id !== activeConversationId) return conversation;
        return { ...conversation, updatedAt: new Date().toISOString(), messages: streamingMessages };
      }),
    );

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Unable to get a response from the AI server.');
      }

      const data = await response.json();
      const content = data.reply || 'I could not generate a response.';
      const finalMessages = nextMessages.concat(createMessage('assistant', content));
      setConversations((current) =>
        current.map((conversation) => {
          if (conversation.id !== activeConversationId) return conversation;
          return {
            ...conversation,
            title:
              conversation.title === 'New Chat' || conversation.title === 'Welcome'
                ? userMessage.slice(0, 32) || 'New Chat'
                : conversation.title,
            updatedAt: new Date().toISOString(),
            messages: finalMessages,
          };
        }),
      );
      setProviderNote(
        data.needsSetup
          ? data.setupMessage || 'No AI provider connected. Local demo mode is active.'
          : `Live response via ${data.provider || 'connected provider'}.`,
      );
      setStatus('Ready');
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setStatus('Stopped');
      } else {
        setStatus('Error');
        const fallbackContent = `I hit a problem while generating a response. Please check your AI provider configuration.\n\n- If you are using Ollama, make sure it is running.\n- If you are using OpenAI, verify your API key is configured.`;
        const finalMessages = nextMessages.concat(createMessage('assistant', fallbackContent));
        setConversations((current) =>
          current.map((conversation) => {
            if (conversation.id !== activeConversationId) return conversation;
            return { ...conversation, updatedAt: new Date().toISOString(), messages: finalMessages };
          }),
        );
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setLoading(false);
    setStatus('Stopped');
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100">
      <aside
        className={`${sidebarOpen ? 'w-72' : 'w-20'} border-r border-slate-800 bg-slate-900/80 backdrop-blur transition-all duration-300`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 p-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-slate-950 shadow-glow">
                <Sparkles className="h-5 w-5" />
              </div>
              {sidebarOpen && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-[0.22em] text-cyan-300">PRAGYA</p>
                  <p className="text-xs text-slate-400">AI assistant</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
          </div>

          <div className="p-3">
            <button
              onClick={createNewConversation}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
            >
              <Plus className="h-4 w-4" />
              {sidebarOpen && <span>New chat</span>}
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setActiveConversationId(conversation.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                  activeConversation?.id === conversation.id
                    ? 'bg-slate-800 text-white ring-1 ring-slate-700'
                    : 'text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <MessageSquare className="h-4 w-4 text-cyan-300" />
                {sidebarOpen && (
                  <span className="truncate text-sm font-medium">{conversation.title || 'Untitled chat'}</span>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-800 p-3">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-violet-400 hover:text-violet-200"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {sidebarOpen && <span>{resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.08),_transparent_30%)]">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-slate-950 shadow-glow">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">PRAGYA AI</h1>
              <p className="text-xs text-slate-400">{status}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">
              Free-ready
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-3 py-4 md:px-6">
          {activeConversation?.messages.length === 0 ? (
            <div className="mx-auto flex max-w-5xl flex-col gap-6 py-4">
              <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6 shadow-glow backdrop-blur-sm md:p-8">
                <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
                      <Sparkles className="h-3.5 w-3.5" />
                      Your intelligence. Your possibilities.
                    </div>

                    <h2 className="max-w-xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                      Think clearly. Build faster. Move smarter.
                    </h2>

                    <p className="mt-4 max-w-xl text-base text-slate-300 md:text-lg">
                      PRAGYA AI brings together fast reasoning, creative thinking, and practical guidance in one clean workspace for learning, writing, planning, and building.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setInput('Explain something complicated.')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-95"
                      >
                        Start chatting
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={createNewConversation}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-400 hover:text-cyan-200"
                      >
                        New conversation
                      </button>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        Free-ready setup
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        Local or cloud AI
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        Built for real work
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-700 bg-slate-950/80 p-5 shadow-2xl">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-slate-950">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Pragya mode</p>
                          <p className="text-xs text-slate-400">Helpful • practical • clear</p>
                        </div>
                      </div>
                      <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">
                        Online
                      </div>
                    </div>

                    <div className="space-y-3 text-sm text-slate-300">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                        <p className="font-medium text-slate-200">Explain something complicated.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                        <p className="font-medium text-slate-200">Help me write better.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                        <p className="font-medium text-slate-200">Plan a smarter workflow.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: 'Fast thinking',
                    text: 'Turn vague ideas into practical next steps.',
                  },
                  {
                    title: 'Better writing',
                    text: 'Structure clear drafts, emails, and product ideas.',
                  },
                  {
                    title: 'Smart planning',
                    text: 'Break projects into simple actions and momentum.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[24px] border border-slate-800 bg-slate-900/60 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  Suggested prompts
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-cyan-400 hover:bg-slate-800"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-4xl flex-col gap-4 pb-4">
              {activeConversation?.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-2xl border p-4 shadow-sm ${
                      message.role === 'user'
                        ? 'border-cyan-400/30 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-900/80'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {message.role === 'assistant' ? (
                          <Bot className="h-4 w-4 text-cyan-300" />
                        ) : (
                          <User2 className="h-4 w-4 text-violet-300" />
                        )}
                        <span>{message.role === 'assistant' ? 'Pragya' : 'You'}</span>
                        <span>•</span>
                        <span>{message.timestamp}</span>
                      </div>
                      {message.role === 'assistant' && (
                        <button
                          onClick={() => handleCopy(message.content, message.id)}
                          className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
                          aria-label="Copy response"
                        >
                          {copiedId === message.id ? (
                            <Check className="h-4 w-4 text-emerald-300" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="markdown-body text-sm text-slate-100">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            const isInline = !match && !className;

                            if (isInline) {
                              return (
                                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300" {...props}>
                                  {children}
                                </code>
                              );
                            }

                            return (
                              <SyntaxHighlighter
                                style={oneDark as any}
                                language={match ? match[1] : 'text'}
                                PreTag="div"
                                customStyle={{ margin: 0, borderRadius: 12, fontSize: 12 }}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 bg-slate-950/80 px-3 py-3 backdrop-blur-sm md:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span>{providerNote}</span>
            </div>
            <div className="flex items-end gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-3 shadow-glow">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Type your message..."
                className="max-h-32 min-h-[48px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
              {loading ? (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20"
                >
                  <StopCircle className="h-4 w-4" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!input.trim()}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
