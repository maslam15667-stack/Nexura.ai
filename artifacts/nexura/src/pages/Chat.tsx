import React, { useState, useRef, useEffect } from "react";
import { useGetChatHistory, getGetChatHistoryQueryKey, useSendChatMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

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

    // Optimistic update could go here, but for simplicity we rely on refetching or just letting the API handle it.
    // Actually, sending the message and then invalidating is better.
    const currentMsg = message;
    setMessage("");

    sendMsg.mutate({
      data: { message: currentMsg, mode: "normal", sessionId }
    }, {
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
      <div className="p-4 border-b border-border/50 glass z-10">
        <h1 className="text-xl font-display font-bold glow-text">AI Chat</h1>
        <p className="text-sm text-muted-foreground">General intelligence interface</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {history.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-accent/20 border border-accent/50 text-accent" : "bg-primary/20 border border-primary/50 text-primary"
                }`}>
                  {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`px-4 py-3 rounded-xl max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-accent/10 border border-accent/20 text-foreground"
                    : "glass text-foreground/90"
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {sendMsg.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="w-8 h-8 rounded-md bg-primary/20 border border-primary/50 text-primary flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="px-4 py-3 rounded-xl glass flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Processing...</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-4 glass border-t border-border/50">
        <div className="max-w-3xl mx-auto relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Initialize command..."
            className="w-full pl-4 pr-12 py-6 bg-input/50 border-primary/30 focus-visible:ring-primary focus-visible:border-primary glow-border rounded-xl text-base"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || sendMsg.isPending}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/80 text-primary-foreground shadow-[0_0_10px_rgba(0,212,255,0.4)]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
