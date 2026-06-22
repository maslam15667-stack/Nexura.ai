import { useState, useRef, useEffect } from "react";
import { useGetChatHistory, getGetChatHistoryQueryKey, useSendChatMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Crown, Lock, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { AiAvatar, UserAvatar } from "@/components/AiAvatar";
import { LogoBackground } from "@/components/LogoBackground";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function PremiumModal({ onClose, onUpgrade }: { onClose: () => void; onUpgrade: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-[#0a0a1a] border border-yellow-500/30 rounded-3xl p-6 space-y-5 shadow-[0_0_40px_rgba(245,158,11,0.2)]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-400/20 border border-yellow-500/40 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Lock className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-white">Daily Limit Reached</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You've used all <span className="text-white font-semibold">10 free chats</span> for today.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 space-y-2.5">
          <p className="text-xs text-yellow-400/70 font-mono uppercase tracking-wider">Premium includes</p>
          {["Unlimited AI chats daily", "Faster AI responses", "Premium badge on profile", "Full access to all features"].map((b, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm text-white/80">
              <div className="w-4 h-4 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
              </div>
              {b}
            </div>
          ))}
        </div>

        <button
          onClick={onUpgrade}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-bold text-base hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(245,158,11,0.4)]"
        >
          <Crown className="w-5 h-5" />
          Upgrade for ₹10 →
        </button>

        <p className="text-xs text-center text-white/25">
          One-time payment · Instant activation · No subscription
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function Chat() {
  const [message, setMessage] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const sessionId = "default";

  const { data: history = [] } = useGetChatHistory({ sessionId }, {
    query: { queryKey: getGetChatHistoryQueryKey({ sessionId }) }
  });

  const sendMsg = useSendChatMessage();

  const handleSend = () => {
    if (!message.trim()) return;
    const currentMsg = message;
    setMessage("");
    const token = localStorage.getItem("nexura_token") ?? "";
    sendMsg.mutate(
      { data: { message: currentMsg, mode: "normal", sessionId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey({ sessionId }) });
        },
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { error?: string } } };
          if (e?.response?.data?.error === "limit_reached") {
            setShowPaywall(true);
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

  return (
    <div className="flex flex-col h-full relative">
      <LogoBackground />

      <div className="relative z-10 p-4 border-b border-border/50 glass flex items-center gap-3">
        <AiAvatar character="normal" size="sm" />
        <div>
          <h1 className="text-xl font-display font-bold glow-text">AI Chat</h1>
          <p className="text-xs text-muted-foreground">Powered by Gemini • Auto language detect</p>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-5">
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <AiAvatar character="normal" size="lg" showLabel />
              <p className="text-muted-foreground text-center text-sm">
                Say anything — I understand Tamil, English, Hindi, Malayalam, Japanese & more.
              </p>
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
                <div className={`px-4 py-3 rounded-2xl max-w-[78%] ${
                  msg.role === "user"
                    ? "bg-accent/15 border border-accent/30 text-foreground rounded-br-sm"
                    : "glass border-primary/20 text-foreground/90 rounded-bl-sm"
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {sendMsg.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-end">
              <AiAvatar character="normal" size="sm" />
              <div className="px-4 py-3 rounded-2xl glass border-primary/20 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="relative z-10 p-4 glass border-t border-border/50">
        <div className="max-w-3xl mx-auto relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
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
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Paywall modal */}
      <AnimatePresence>
        {showPaywall && (
          <PremiumModal
            onClose={() => setShowPaywall(false)}
            onUpgrade={() => navigate("/payment")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
