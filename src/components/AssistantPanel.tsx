// AI assistant chat widget — two modes (support / expert).
// Streams from Supabase Edge Function `chat-assistant`. Neutral palette, no red.

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Copy, Headset, Loader2, Send, Sparkles, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type Mode = "support" | "expert";
type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "streamflix:chat-history";

function loadHistory(): Record<Mode, Msg[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { support: [], expert: [] };
    const parsed = JSON.parse(raw);
    return {
      support: Array.isArray(parsed.support) ? parsed.support : [],
      expert: Array.isArray(parsed.expert) ? parsed.expert : [],
    };
  } catch {
    return { support: [], expert: [] };
  }
}

function saveHistory(history: Record<Mode, Msg[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    /* ignore */
  }
}

export function AssistantPanel({
  open,
  onClose,
  initialMode = "support",
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [history, setHistory] = useState<Record<Mode, Msg[]>>(() => loadHistory());
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [viewportH, setViewportH] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const messages = history[mode];

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, mode, messages.length]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const updateAssistant = (modeKey: Mode, chunk: string) => {
    setHistory((prev) => {
      const list = prev[modeKey].slice();
      const last = list[list.length - 1];
      if (last && last.role === "assistant") {
        list[list.length - 1] = { ...last, content: last.content + chunk };
      } else {
        list.push({ role: "assistant", content: chunk });
      }
      return { ...prev, [modeKey]: list };
    });
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    const userMsg: Msg = { role: "user", content: trimmed };
    const modeKey = mode;
    setHistory((prev) => ({ ...prev, [modeKey]: [...prev[modeKey], userMsg] }));
    setInput("");
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          mode: modeKey,
          messages: [...history[modeKey], userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) {
        let msg = "Erro na comunicação com o assistente.";
        try {
          const j = await resp.json();
          if (j?.error) msg = j.error;
        } catch {
          /* ignore */
        }
        toast({ title: "Assistente", description: msg, variant: "destructive" });
        setSending(false);
        return;
      }
      if (!resp.body) {
        toast({ title: "Assistente", description: "Sem resposta do servidor.", variant: "destructive" });
        setSending(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        textBuffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, nl);
          textBuffer = textBuffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(modeKey, content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast({ title: "Assistente", description: "Falha de conexão.", variant: "destructive" });
      }
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  };

  const copy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1500);
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const clearMode = () => {
    setHistory((prev) => ({ ...prev, [mode]: [] }));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onTouchMove={(e) => {
        // Bloqueia drag no backdrop completamente
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{ touchAction: "none", overscrollBehavior: "contain" }}
    >
      <div
        className="w-full sm:max-w-lg sm:my-8 h-[85dvh] sm:h-[640px] bg-popover border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-elevated flex flex-col overflow-hidden"
        role="dialog"
        aria-label="Assistente"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "100dvh", touchAction: "auto", overscrollBehavior: "contain" }}
      >
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-background/40">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/5 border border-white/10 shrink-0">
            {mode === "support" ? (
              <Headset className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            ) : (
              <Sparkles className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">Assistente StreamFlix</p>
            <p className="text-[11px] text-muted-foreground">
              {mode === "support" ? "Suporte do app, conta e dúvidas." : "Recomendações de filmes e séries."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/5 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Mode tabs */}
        <div className="flex items-center gap-1 px-3 pt-3">
          {(["support", "expert"] as const).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-colors",
                  active
                    ? "bg-white/10 text-foreground border-white/20"
                    : "text-muted-foreground border-white/5 hover:text-foreground hover:bg-white/5"
                )}
              >
                {m === "support" ? <Headset className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                {m === "support" ? "Suporte" : "Especialista"}
              </button>
            );
          })}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="h-full grid place-items-center text-center text-xs text-muted-foreground px-6">
              {mode === "support"
                ? "Pergunte sobre conta, login, perfil, configurações ou problemas no app."
                : "Diga um título que você gostou ou um clima — ex: 'Algo sombrio como True Detective'."}
            </div>
          )}
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div key={idx} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "group max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words",
                    isUser
                      ? "bg-white/10 text-foreground border border-white/10"
                      : "bg-white/[0.04] text-foreground border border-white/5"
                  )}
                >
                  <div>{m.content || (sending && !isUser && idx === messages.length - 1 ? "…" : "")}</div>
                  {m.content && (
                    <button
                      onClick={() => copy(m.content, idx)}
                      className="mt-1.5 opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-opacity"
                      aria-label="Copiar mensagem"
                    >
                      {copiedIdx === idx ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedIdx === idx ? "Copiado" : "Copiar"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {sending && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-white/[0.04] border border-white/5 rounded-2xl px-3.5 py-2.5 text-sm text-muted-foreground inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Pensando…
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {messages.length > 0 && (
          <div className="px-4 pb-1 pt-1 flex justify-end">
            <button
              onClick={clearMode}
              className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Limpar conversa
            </button>
          </div>
        )}
        <form onSubmit={send} className="border-t border-white/5 p-3 flex items-end gap-2 bg-background/40">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(e as unknown as FormEvent);
              }
            }}
            placeholder={mode === "support" ? "Como posso ajudar?" : "Conte um título que gostou…"}
            rows={1}
            onFocus={(e) => {
              setTimeout(() => e.currentTarget?.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
            }}
            className="flex-1 max-h-32 resize-none bg-background/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white/30 placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="h-10 w-10 grid place-items-center rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-40"
            aria-label="Enviar"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
