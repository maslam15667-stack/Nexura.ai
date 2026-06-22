import { useState, useRef, useEffect, useCallback } from "react";
import { useGetChatHistory, getGetChatHistoryQueryKey, useSendChatMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Crown, Sparkles, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { AiAvatar, UserAvatar } from "@/components/AiAvatar";
import { LogoBackground } from "@/components/LogoBackground";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const CHAT_LIMIT = 10;

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/60"
          animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

type UserInfo = { chatsToday: number; chatLimit: number; isPremium: boolean };

function ChatUsageBadge({
  chatsToday, chatLimit, isPremium, onClick,
}: { chatsToday: number; chatLimit: number; isPremium: boolean; onClick: () => void }) {
  if (isPremium) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
        <Crown className="w-3 h-3 text-yellow-400" />
        <span className="text-xs font-bold text-yellow-400">∞</span>
        <span className="text-[10px] text-yellow-400/60">Premium</span>
      </div>
    );
  }

  const used       = Math.min(chatsToday, chatLimit);
  const remaining  = Math.max(0, chatLimit - used);
  const pct        = Math.min(100, (used / chatLimit) * 100);
  const isWarning  = remaining <= 3 && remaining > 0;
  const isDanger   = remaining === 0;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all group ${
        isDanger
          ? "bg-red-500/15 border-red-500/40 hover:bg-red-500/25"
          : isWarning
          ? "bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      }`}
    >
      {/* pill progress */}
      <div className="relative w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`absolute inset-y-0 left-0 rounded-full ${
            isDanger ? "bg-red-500" : isWarning ? "bg-orange-400" : "bg-primary"
          }`}
        />
      </div>

      <span className={`text-xs font-bold tabular-nums ${
        isDanger ? "text-red-400" : isWarning ? "text-orange-400" : "text-white/60"
      }`}>
        {used}/{chatLimit}
      </span>

      {isDanger && (
        <span className="text-[10px] text-red-400/80 font-semibold hidden sm:inline">Tap to upgrade</span>
      )}
      {isWarning && (
        <span className="text-[10px] text-orange-400/80 font-semibold hidden sm:inline">{remaining} left</span>
      )}
    </button>
  );
}

export default function Chat() {
  const [message, setMessage]   = useState("");
  const scrollRef               = useRef<HTMLDivElement>(null);
  const queryClient             = useQueryClient();
  const [, navigate]            = useLocation();
  const sessionId               = "default";

  const [userInfo, setUserInfo] = useState<UserInfo>({ chatsToday: 0, chatLimit: CHAT_LIMIT, isPremium: false });

  const fetchUserInfo = useCallback(() => {
    const token = localStorage.getItem("nexura_token");
    if (!token) return;
    fetch(`${BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((d: UserInfo) => setUserInfo({ chatsToday: d.chatsToday ?? 0, chatLimit: d.chatLimit ?? CHAT_LIMIT, isPremium: d.isPremium ?? false }))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchUserInfo(); }, [fetchUserInfo]);

  const { data: history = [] } = useGetChatHistory({ sessionId }, {
    query: { queryKey: getGetChatHistoryQueryKey({ sessionId }) }
  });

  const sendMsg = useSendChatMessage();

  const handleSend = () => {
    if (!message.trim() || sendMsg.isPending) return;
    const currentMsg = message;
    setMessage("");
    sendMsg.mutate(
      { data: { message: currentMsg, mode: "normal", sessionId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey({ sessionId }) });
          setUserInfo(prev => ({
            ...prev,
            chatsToday: prev.isPremium ? prev.chatsToday : prev.chatsToday + 1,
          }));
        },
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { error?: string } } };
          if (e?.response?.data?.error === "limit_reached") {
            navigate("/payment");
          } else if (e?.response?.data?.error === "blocked") {
            localStorage.clear();
            navigate("/login");
          }
        },
      }
    );
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, sendMsg.isPending]);

  const limitReached = !userInfo.isPremium && userInfo.chatsToday >= userInfo.chatLimit;

  return (
    <div className="flex flex-col h-full relative">
      <LogoBackground />

      {/* Header */}
      <div className="relative z-10 p-4 border-b border-border/50 glass flex items-center gap-3">
        <AiAvatar character="normal" size="sm" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold glow-text">AI Chat</h1>
          <p className="text-xs text-muted-foreground">Powered by Gemini • Auto language detect</p>
        </div>
        {/* Live usage badge */}
        <ChatUsageBadge
          chatsToday={userInfo.chatsToday}
          chatLimit={userInfo.chatLimit}
          isPremium={userInfo.isPremium}
          onClick={() => navigate("/payment")}
        />
      </div>

      {/* Limit reached banner */}
      <AnimatePresence>
        {limitReached && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 overflow-hidden"
          >
            <button
              onClick={() => navigate("/payment")}
              className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-yellow-500/15 to-amber-400/10 border-b border-yellow-500/30 hover:from-yellow-500/25 hover:to-amber-400/15 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-3.5 h-3.5 text-yellow-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Daily limit reached — 10/10 chats used</p>
                  <p className="text-xs text-yellow-400/70">Get 24-hour unlimited access for just ₹10 →</p>
                </div>
              </div>
              <Zap className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform flex-shrink-0" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4">
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <AiAvatar character="normal" size="lg" showLabel />
              <p className="text-muted-foreground text-center text-sm">
                Say anything — I understand Tamil, English, Hindi, Malayalam, Japanese & more.
              </p>
              {!userInfo.isPremium && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                  <span className="text-xs text-white/40">
                    <span className="text-primary font-semibold">{Math.max(0, userInfo.chatLimit - userInfo.chatsToday)}</span> free chats remaining today
                  </span>
                </div>
              )}
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
                {msg.role === "user" ? <UserAvatar size="sm" /> : <AiAvatar character="normal" size="sm" />}
                <div className="flex flex-col gap-1 max-w-[78%]">
                  <div className={`px-4 py-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-accent/15 border border-accent/30 text-foreground rounded-br-sm"
                      : "glass border-primary/20 text-foreground/90 rounded-bl-sm"
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                  </div>
                  <p className={`text-[10px] text-white/25 font-mono px-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {sendMsg.isPending && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="flex gap-3 items-end"
              >
                <AiAvatar character="normal" size="sm" />
                <div className="flex flex-col gap-1">
                  <div className="px-4 py-3 rounded-2xl glass border-primary/20 rounded-bl-sm">
                    <TypingDots />
                  </div>
                  <p className="text-[10px] text-white/25 font-mono px-1">NEXURA is typing...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input */}
      <div className="relative z-10 p-4 glass border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          {limitReached ? (
            /* Limit reached — replace input with upgrade CTA */
            <motion.button
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => navigate("/payment")}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-bold text-base hover:opacity-90 transition-opacity shadow-[0_0_24px_rgba(245,158,11,0.4)]"
            >
              <Crown className="w-5 h-5" />
              Get 24-Hour Premium for ₹10
              <span className="text-xs font-normal opacity-70 hidden sm:inline">· Scan GPay QR →</span>
            </motion.button>
          ) : (
            <div className="relative">
              <Input
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Message NEXURA..."
                data-testid="input-chat-message"
                className="w-full pl-4 pr-12 py-6 bg-input/50 border-primary/30 focus-visible:ring-primary glow-border rounded-xl text-base"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!message.trim() || sendMsg.isPending}
                data-testid="button-send-chat"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/80 text-primary-foreground shadow-[0_0_10px_rgba(0,212,255,0.4)]"
              >
                {sendMsg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
