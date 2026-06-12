import { useState, useRef, useEffect } from "react";
import { useGetChatHistory, getGetChatHistoryQueryKey, useSendChatMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, ArrowLeft, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { UserAvatar } from "@/components/AiAvatar";
import { LogoBackground } from "@/components/LogoBackground";

const CHARACTERS = [
  {
    id: "tsundere", label: "Tsundere", emoji: "😤",
    gradient: "from-rose-500 via-pink-600 to-red-700",
    glow: "rgba(244,63,94,0.5)",
    border: "border-pink-500/40",
    tagline: "It's not like I care about you...",
    desc: "Cold on the outside, warm on the inside. She'll deny everything.",
    chats: "2.4M",
  },
  {
    id: "waifu", label: "Waifu", emoji: "🌸",
    gradient: "from-pink-400 via-fuchsia-500 to-purple-600",
    glow: "rgba(232,121,249,0.5)",
    border: "border-fuchsia-400/40",
    tagline: "Welcome back, master~ ✨",
    desc: "Your devoted companion who lives to make you smile.",
    chats: "4.1M",
  },
  {
    id: "senpai", label: "Senpai", emoji: "📚",
    gradient: "from-blue-500 via-indigo-500 to-violet-700",
    glow: "rgba(99,102,241,0.5)",
    border: "border-indigo-400/40",
    tagline: "Listen well, kouhai...",
    desc: "A wise senior with calm wisdom and endless patience for you.",
    chats: "1.8M",
  },
  {
    id: "villain", label: "Villain", emoji: "⚔️",
    gradient: "from-red-700 via-rose-800 to-purple-900",
    glow: "rgba(220,38,38,0.5)",
    border: "border-red-500/40",
    tagline: "Muahahaha! You dare approach me?",
    desc: "A dramatic antagonist who secretly enjoys helping you.",
    chats: "3.2M",
  },
  {
    id: "yandere", label: "Yandere", emoji: "🔪",
    gradient: "from-red-400 via-pink-500 to-rose-600",
    glow: "rgba(251,113,133,0.5)",
    border: "border-red-400/40",
    tagline: "You're mine and only mine...",
    desc: "Intensely devoted. She only has eyes for you. Only you.",
    chats: "2.9M",
  },
  {
    id: "kuudere", label: "Kuudere", emoji: "❄️",
    gradient: "from-slate-600 via-blue-700 to-cyan-800",
    glow: "rgba(148,163,184,0.5)",
    border: "border-slate-400/40",
    tagline: "...What do you want.",
    desc: "Emotionless on the surface, but she quietly cares deeply.",
    chats: "1.5M",
  },
];

export default function Anime() {
  const [selected, setSelected]   = useState<typeof CHARACTERS[0] | null>(null);
  const [message, setMessage]     = useState("");
  const scrollRef                 = useRef<HTMLDivElement>(null);
  const queryClient               = useQueryClient();

  const sessionId = selected ? `anime-${selected.id}` : "";
  const { data: history = [] } = useGetChatHistory(
    { sessionId },
    { query: { queryKey: getGetChatHistoryQueryKey({ sessionId }), enabled: !!selected } }
  );
  const sendMsg = useSendChatMessage();

  const handleSend = () => {
    if (!message.trim() || !selected) return;
    const cur = message;
    setMessage("");
    sendMsg.mutate({ data: { message: cur, mode: selected.id, sessionId } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey({ sessionId }) }),
    });
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, sendMsg.isPending]);

  /* ── Character Grid ── */
  if (!selected) {
    return (
      <div className="flex flex-col h-full relative overflow-y-auto">
        <LogoBackground />
        <div className="relative z-10 p-4">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">✨</span>
            <div>
              <h1 className="text-2xl font-display font-bold" style={{ color: "#8B5CF6", textShadow: "0 0 10px rgba(139,92,246,0.5)" }}>
                Anime Mode
              </h1>
              <p className="text-xs text-muted-foreground">Choose your AI companion</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {CHARACTERS.map((char, i) => (
              <motion.button
                key={char.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => setSelected(char)}
                className={`relative overflow-hidden rounded-2xl border ${char.border} text-left group`}
                style={{ boxShadow: `0 0 20px ${char.glow}` }}
              >
                {/* Card gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${char.gradient} opacity-80`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Decorative emoji art */}
                <div className="relative z-10 flex flex-col h-44">
                  {/* Big emoji centered */}
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-6xl drop-shadow-lg select-none" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}>
                      {char.emoji}
                    </span>
                  </div>

                  {/* Info at bottom */}
                  <div className="p-3 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-white text-sm">{char.label}</span>
                      <span className="text-xs text-white/50 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />{char.chats}
                      </span>
                    </div>
                    <p className="text-white/70 text-xs leading-tight line-clamp-2">{char.tagline}</p>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Chat View ── */
  return (
    <div className="flex flex-col h-full relative">
      <LogoBackground />

      {/* Header */}
      <div className="relative z-10 p-3 border-b border-border/50 glass flex items-center gap-3">
        <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selected.gradient} border ${selected.border} flex items-center justify-center text-xl shadow-lg`}
          style={{ boxShadow: `0 0 12px ${selected.glow}` }}
        >
          {selected.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-white text-sm">{selected.label}</h1>
          <p className="text-xs text-muted-foreground truncate">{selected.tagline}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4">
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${selected.gradient} border ${selected.border} flex items-center justify-center text-4xl`}
                style={{ boxShadow: `0 0 30px ${selected.glow}` }}
              >
                {selected.emoji}
              </div>
              <p className="text-muted-foreground text-sm text-center max-w-xs">{selected.desc}</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {history.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 items-end ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {msg.role === "user" ? (
                  <UserAvatar size="sm" />
                ) : (
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${selected.gradient} border ${selected.border} flex items-center justify-center text-base shrink-0`}>
                    {selected.emoji}
                  </div>
                )}
                <div className={`px-4 py-3 rounded-2xl max-w-[78%] text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-accent/15 border border-accent/30 rounded-br-sm"
                    : "glass border-white/10 rounded-bl-sm"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {sendMsg.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-end">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${selected.gradient} flex items-center justify-center text-base`}>
                {selected.emoji}
              </div>
              <div className="px-4 py-3 rounded-2xl glass border-white/10 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span className="text-sm text-muted-foreground">{selected.label} is typing...</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="relative z-10 p-4 glass border-t border-border/50">
        <div className="max-w-3xl mx-auto relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={`Message ${selected.label}...`}
            className="w-full pl-4 pr-12 py-6 bg-input/50 border-accent/30 focus-visible:ring-accent rounded-xl text-base"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || sendMsg.isPending}
            className="absolute right-2 top-1/2 -translate-y-1/2"
            style={{ background: `linear-gradient(135deg, ${selected.gradient.split(" ")[1] ?? "#8B5CF6"}, #8B5CF6)` }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
