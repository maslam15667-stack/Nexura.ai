import React, { useState } from "react";
import { useGetChatHistory, getGetChatHistoryQueryKey, useSendChatMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

const CHARACTERS = ["Tsundere", "Waifu", "Senpai", "Villain", "Yandere", "Kuudere"];

export default function Anime() {
  const [character, setCharacter] = useState("Tsundere");
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const sessionId = `anime-${character.toLowerCase()}`;

  const { data: history = [] } = useGetChatHistory({ sessionId }, {
    query: { queryKey: getGetChatHistoryQueryKey({ sessionId }) }
  });

  const sendMsg = useSendChatMessage();

  const handleSend = () => {
    if (!message.trim()) return;
    const currentMsg = message;
    setMessage("");

    sendMsg.mutate({
      data: { message: currentMsg, mode: character.toLowerCase(), sessionId }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey({ sessionId }) });
      }
    });
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-4 border-b border-border/50 glass z-10 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-accent glow-text">Anime Mode</h1>
          <p className="text-sm text-muted-foreground">Select your companion</p>
        </div>
        <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
          {CHARACTERS.map((char) => (
            <Button
              key={char}
              variant={character === char ? "default" : "outline"}
              onClick={() => setCharacter(char)}
              className={character === char ? "bg-accent hover:bg-accent/80 text-white glow-border-accent" : "border-accent/30 text-accent hover:bg-accent/10"}
            >
              {char}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        <div className="max-w-3xl mx-auto w-full space-y-6 flex-1 flex flex-col justify-end">
          <AnimatePresence initial={false}>
            {history.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-primary/20 border border-primary/50 text-primary" : "bg-accent/20 border border-accent/50 text-accent"
                }`}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-primary/10 border border-primary/20 text-foreground"
                    : "glass border-accent/20 text-foreground/90"
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {sendMsg.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/50 text-accent flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl glass border-accent/20 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span className="text-sm text-muted-foreground">Typing...</span>
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
            placeholder={`Message ${character}...`}
            className="w-full pl-4 pr-12 py-6 bg-input/50 border-accent/30 focus-visible:ring-accent focus-visible:border-accent glow-border-accent rounded-xl text-base"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || sendMsg.isPending}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent hover:bg-accent/80 text-white shadow-[0_0_10px_rgba(139,92,246,0.4)]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
