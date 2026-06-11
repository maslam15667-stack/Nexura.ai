import { useState, useRef, useEffect } from "react";
import { useGetChatHistory, getGetChatHistoryQueryKey, useSendChatMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { AiAvatar, UserAvatar } from "@/components/AiAvatar";
import { LogoBackground } from "@/components/LogoBackground";

export default function Chat() {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const sessionId = "default";

  const { data: history = [] } = useGetChatHistory({ sessionId }, {
    query: { queryKey: getGetChatHistoryQueryKey({ sessionId }) }
  });

  const sendMsg = useSendChatMessage();

  const handleSend = () => {
    if (!message.trim()) return;
    const currentMsg = message;
    setMessage("");
    sendMsg.mutate({ data: { message: currentMsg, mode: "normal", sessionId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey({ sessionId }) });
      }
    });
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
    </div>
  );
}
