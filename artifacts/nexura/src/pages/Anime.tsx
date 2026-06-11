import { useState, useRef, useEffect } from "react";
import { useGetChatHistory, getGetChatHistoryQueryKey, useSendChatMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { AiAvatar, UserAvatar } from "@/components/AiAvatar";
import { LogoBackground } from "@/components/LogoBackground";

const CHARACTERS = [
  { id: "tsundere", label: "Tsundere", emoji: "😤", color: "from-pink-500 to-red-500" },
  { id: "waifu",    label: "Waifu",    emoji: "🌸", color: "from-pink-400 to-purple-400" },
  { id: "senpai",   label: "Senpai",   emoji: "📚", color: "from-blue-400 to-indigo-500" },
  { id: "villain",  label: "Villain",  emoji: "⚔️", color: "from-red-600 to-purple-700" },
  { id: "yandere",  label: "Yandere",  emoji: "🔪", color: "from-red-400 to-pink-600" },
  { id: "kuudere",  label: "Kuudere",  emoji: "❄️", color: "from-slate-500 to-blue-600" },
];

export default function Anime() {
  const [character, setCharacter] = useState(CHARACTERS[0]);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const sessionId = `anime-${character.id}`;

  const { data: history = [] } = useGetChatHistory({ sessionId }, {
    query: { queryKey: getGetChatHistoryQueryKey({ sessionId }) }
  });

  const sendMsg = useSendChatMessage();

  const handleSend = () => {
    if (!message.trim()) return;
    const currentMsg = message;
    setMessage("");
    sendMsg.mutate({ data: { message: currentMsg, mode: character.id, sessionId } }, {
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

      {/* Header with character selector */}
      <div className="relative z-10 p-4 border-b border-border/50 glass space-y-3">
        <div className="flex items-center gap-3">
          <AiAvatar character={character.id} size="sm" />
          <div>
            <h1 className="text-xl font-display font-bold text-accent glow-text">Anime Mode</h1>
            <p className="text-xs text-muted-foreground">Chatting with {character.label}</p>
          </div>
        </div>
        <div className="flex overflow-x-auto pb-1 gap-2 scrollbar-hide">
          {CHARACTERS.map((char) => (
            <button
              key={char.id}
              onClick={() => setCharacter(char)}
              data-testid={`button-char-${char.id}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all ${
                character.id === char.id
                  ? `bg-gradient-to-r ${char.color} border-transparent text-white shadow-lg`
                  : "border-accent/20 text-accent/70 hover:border-accent/40 hover:bg-accent/5"
              }`}
            >
              <span>{char.emoji}</span>
              {char.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-5">
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="text-6xl">{character.emoji}</div>
              <AiAvatar character={character.id} size="lg" showLabel />
              <p className="text-muted-foreground text-sm text-center">
                {character.id === "tsundere" && "Hmph! It's not like I'm waiting for you or anything..."}
                {character.id === "waifu" && "Welcome back, master~ I missed you so much~"}
                {character.id === "senpai" && "Kouhai, I shall share my wisdom with you."}
                {character.id === "villain" && "So... you've come to me seeking power? Interesting."}
                {character.id === "yandere" && "You're finally here. I've been waiting... only for you."}
                {character.id === "kuudere" && "...What do you want."}
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
                {msg.role === "user"
                  ? <UserAvatar size="sm" />
                  : <AiAvatar character={character.id} size="sm" />
                }
                <div className={`px-4 py-3 rounded-2xl max-w-[78%] text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-accent/15 border border-accent/30 text-foreground rounded-br-sm"
                    : "glass border-accent/20 text-foreground/90 rounded-bl-sm"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {sendMsg.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-end">
              <AiAvatar character={character.id} size="sm" />
              <div className="px-4 py-3 rounded-2xl glass border-accent/20 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span className="text-sm text-muted-foreground">{character.label} is typing...</span>
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
            placeholder={`Message ${character.label}...`}
            data-testid="input-anime-message"
            className="w-full pl-4 pr-12 py-6 bg-input/50 border-accent/30 focus-visible:ring-accent glow-border-accent rounded-xl text-base"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || sendMsg.isPending}
            data-testid="button-send-anime"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent hover:bg-accent/80 text-white shadow-[0_0_10px_rgba(139,92,246,0.4)]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
