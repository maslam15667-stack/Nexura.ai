import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceSpeak } from "@workspace/api-client-react";
import { AiAvatar } from "@/components/AiAvatar";
import { LogoBackground } from "@/components/LogoBackground";

const CHARACTERS = [
  { id: "tsundere", label: "Tsundere", emoji: "😤" },
  { id: "waifu",    label: "Waifu",    emoji: "🌸" },
  { id: "senpai",   label: "Senpai",   emoji: "📚" },
  { id: "villain",  label: "Villain",  emoji: "⚔️" },
  { id: "yandere",  label: "Yandere",  emoji: "🔪" },
  { id: "kuudere",  label: "Kuudere",  emoji: "❄️" },
];

const VOICE_TYPES = ["soft", "angry", "cute", "deep", "whisper", "energetic", "calm"];
const LANGUAGES   = ["auto", "english", "tamil", "hindi", "malayalam", "japanese"];

const LANG_BCP: Record<string, string> = {
  tamil: "ta-IN", hindi: "hi-IN", malayalam: "ml-IN",
  japanese: "ja-JP", english: "en-US", auto: "en-US",
};

function speakText(text: string, lang: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = LANG_BCP[lang] ?? "en-US";
  utt.rate = 0.95;
  utt.pitch = 1.1;
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find(v => v.lang.startsWith(utt.lang.split("-")[0]));
  if (match) utt.voice = match;
  window.speechSynthesis.speak(utt);
}

export default function Voice() {
  const [character, setCharacter]     = useState("tsundere");
  const [voiceType, setVoiceType]     = useState("soft");
  const [language, setLanguage]       = useState("english");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [transcript, setTranscript]   = useState("");
  const [response, setResponse]       = useState("");
  const transcriptRef                 = useRef("");
  const recognitionRef                = useRef<SpeechRecognition | null>(null);
  const audioRef                      = useRef<HTMLAudioElement>(null);

  const voiceSpeak = useVoiceSpeak();
  const selectedChar = CHARACTERS.find(c => c.id === character) ?? CHARACTERS[0];

  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  const sendToAI = (text: string) => {
    if (!text.trim()) return;
    voiceSpeak.mutate({ data: { text, character, voiceType, language } }, {
      onSuccess: (result) => {
        const reply = result.characterResponse;
        setResponse(reply);
        if (result.audioUrl && audioRef.current) {
          audioRef.current.src = result.audioUrl;
          audioRef.current.play().catch(() => {});
          setIsSpeaking(true);
          audioRef.current.onended = () => setIsSpeaking(false);
        } else {
          setIsSpeaking(true);
          speakText(reply, language);
          const checkDone = setInterval(() => {
            if (!window.speechSynthesis.speaking) {
              setIsSpeaking(false);
              clearInterval(checkDone);
            }
          }, 300);
        }
      },
    });
  };

  const startRecording = () => {
    const SR = (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) { setTranscript("Speech recognition not supported in this browser. Try Chrome."); return; }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const rec = new SR();
    rec.lang = LANG_BCP[language] ?? "en-US";
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(text);
      transcriptRef.current = text;
    };

    rec.onend = () => {
      setIsRecording(false);
      const final = transcriptRef.current;
      if (final.trim()) sendToAI(final);
    };

    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
    setTranscript("");
    setResponse("");
    transcriptRef.current = "";
  };

  const stopRecording = () => { recognitionRef.current?.stop(); setIsRecording(false); };
  const toggleMic = () => { isRecording ? stopRecording() : startRecording(); };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setIsSpeaking(false);
  };

  return (
    <div className="flex flex-col items-center h-full relative overflow-y-auto p-4 md:p-8">
      <LogoBackground />

      {/* Top bar */}
      <div className="relative z-10 w-full max-w-2xl glass p-4 rounded-2xl border border-primary/20 flex flex-wrap gap-3 justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <AiAvatar character={character} size="sm" />
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Voice Link</p>
            <p className="text-sm font-bold text-primary">{selectedChar.emoji} {selectedChar.label}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={character} onValueChange={setCharacter}>
            <SelectTrigger className="w-32 bg-black/40 border-primary/20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHARACTERS.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={voiceType} onValueChange={setVoiceType}>
            <SelectTrigger className="w-28 bg-black/40 border-primary/20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICE_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-28 bg-black/40 border-primary/20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Avatar */}
      <motion.div
        animate={{ scale: isRecording ? [1, 1.03, 1] : 1 }}
        transition={{ duration: 1.5, repeat: isRecording ? Infinity : 0 }}
        className="relative z-10 mb-8"
      >
        <AiAvatar character={character} size="lg" showLabel />
        {isSpeaking && (
          <motion.div
            className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1.5"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <Volume2 className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </motion.div>

      {/* Mic button */}
      <div className="relative z-10 mb-8">
        {isRecording && (
          <>
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-[80px] animate-pulse" />
            <motion.div className="absolute inset-0 border-2 border-primary/60 rounded-full"
              animate={{ scale: [1, 1.6, 2.2], opacity: [0.8, 0.4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }} />
            <motion.div className="absolute inset-0 border border-primary/40 rounded-full"
              animate={{ scale: [1, 1.3, 1.6], opacity: [0.6, 0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
          </>
        )}
        {isSpeaking && (
          <>
            <motion.div className="absolute inset-0 border-2 border-accent/60 rounded-full"
              animate={{ scale: [1, 1.4, 1.8], opacity: [0.7, 0.3, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }} />
          </>
        )}
        <button
          onClick={isSpeaking ? stopSpeaking : toggleMic}
          disabled={voiceSpeak.isPending}
          data-testid="button-mic"
          className={`relative z-10 w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 ${
            isSpeaking
              ? "bg-accent text-white shadow-[0_0_50px_rgba(139,92,246,0.8)] scale-95"
              : isRecording
              ? "bg-primary text-black shadow-[0_0_50px_rgba(0,212,255,0.8)] scale-95"
              : "bg-black/40 border-2 border-primary/40 text-primary hover:border-primary hover:bg-primary/10 shadow-[0_0_20px_rgba(0,212,255,0.2)]"
          }`}
        >
          {isSpeaking
            ? <VolumeX className="w-14 h-14" />
            : isRecording
            ? <MicOff className="w-14 h-14" />
            : <Mic className="w-14 h-14" />}
        </button>
      </div>

      {/* Status & transcript */}
      <div className="relative z-10 text-center space-y-3 max-w-md w-full">
        <h2 className="text-xl font-display font-bold glow-text">
          {isSpeaking ? `${selectedChar.label} is speaking...`
            : voiceSpeak.isPending ? "Generating response..."
            : isRecording ? "Listening..."
            : "Tap to Speak"}
        </h2>
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
          {character} · {voiceType} · {language}
        </p>

        <AnimatePresence>
          {transcript && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass rounded-xl p-3 border border-primary/20 text-left">
              <p className="text-xs text-muted-foreground mb-1">You said:</p>
              <p className="text-sm">{transcript}</p>
            </motion.div>
          )}
          {response && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4 border border-accent/30 text-left">
              <div className="flex items-center gap-2 mb-2">
                <AiAvatar character={character} size="sm" />
                <p className="text-xs text-accent font-mono">{selectedChar.label} says:</p>
                {isSpeaking && <span className="ml-auto text-xs text-accent/60 animate-pulse">🔊 speaking</span>}
              </div>
              <p className="text-sm leading-relaxed">{response}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
