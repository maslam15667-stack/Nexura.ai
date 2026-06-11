import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
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
const LANGUAGES  = ["auto", "english", "tamil", "hindi", "malayalam", "japanese"];

export default function Voice() {
  const [character, setCharacter] = useState("tsundere");
  const [voiceType, setVoiceType] = useState("soft");
  const [language, setLanguage]   = useState("english");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript]   = useState("");
  const [response, setResponse]       = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const voiceSpeak = useVoiceSpeak();

  const selectedChar = CHARACTERS.find(c => c.id === character) ?? CHARACTERS[0];

  const startRecording = () => {
    const SpeechRecognitionCtor = (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
      || (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setTranscript("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = language === "tamil" ? "ta-IN"
      : language === "hindi" ? "hi-IN"
      : language === "malayalam" ? "ml-IN"
      : language === "japanese" ? "ja-JP"
      : "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const text = Array.from(event.results).map(r => r[0].transcript).join("");
      setTranscript(text);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (transcript) {
        sendToAI(transcript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setTranscript("");
    setResponse("");
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const sendToAI = (text: string) => {
    voiceSpeak.mutate({
      data: { text, character, voiceType, language }
    }, {
      onSuccess: (result) => {
        setResponse(result.characterResponse);
        if (result.audioUrl && audioRef.current) {
          audioRef.current.src = result.audioUrl;
          audioRef.current.play().catch(() => {});
        }
      }
    });
  };

  const toggleMic = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center h-full relative overflow-y-auto p-4 md:p-8">
      <LogoBackground />

      {/* Settings bar */}
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
            <SelectTrigger className="w-32 bg-black/40 border-primary/20 text-xs" data-testid="select-character">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHARACTERS.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={voiceType} onValueChange={setVoiceType}>
            <SelectTrigger className="w-28 bg-black/40 border-primary/20 text-xs" data-testid="select-voice-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICE_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-28 bg-black/40 border-primary/20 text-xs" data-testid="select-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Big character avatar */}
      <motion.div
        animate={{ scale: isRecording ? [1, 1.02, 1] : 1 }}
        transition={{ duration: 1.5, repeat: isRecording ? Infinity : 0 }}
        className="relative z-10 mb-8"
      >
        <AiAvatar character={character} size="lg" showLabel />
        {voiceSpeak.isPending && (
          <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-1">
            <Volume2 className="w-4 h-4 text-black animate-pulse" />
          </div>
        )}
      </motion.div>

      {/* Mic button */}
      <div className="relative z-10 mb-8">
        {isRecording && (
          <>
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-[80px] animate-pulse" />
            <motion.div
              className="absolute inset-0 border-2 border-primary/60 rounded-full"
              animate={{ scale: [1, 1.6, 2.2], opacity: [0.8, 0.4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 border border-primary/40 rounded-full"
              animate={{ scale: [1, 1.3, 1.6], opacity: [0.6, 0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}
        <button
          onClick={toggleMic}
          disabled={voiceSpeak.isPending}
          data-testid="button-mic"
          className={`relative z-10 w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording
              ? "bg-primary text-black shadow-[0_0_50px_rgba(0,212,255,0.8)] scale-95"
              : "bg-black/40 border-2 border-primary/40 text-primary hover:border-primary hover:bg-primary/10 shadow-[0_0_20px_rgba(0,212,255,0.2)]"
          }`}
        >
          {isRecording ? <MicOff className="w-14 h-14" /> : <Mic className="w-14 h-14" />}
        </button>
      </div>

      <div className="relative z-10 text-center space-y-3 max-w-md w-full">
        <h2 className="text-xl font-display font-bold glow-text">
          {isRecording ? "Listening..." : voiceSpeak.isPending ? "Generating response..." : "Tap to Speak"}
        </h2>
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
          {character} • {voiceType} • {language}
        </p>

        {transcript && (
          <div className="glass rounded-xl p-3 border border-primary/20 text-left">
            <p className="text-xs text-muted-foreground mb-1">You said:</p>
            <p className="text-sm">{transcript}</p>
          </div>
        )}

        {response && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4 border border-accent/30 text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <AiAvatar character={character} size="sm" />
              <p className="text-xs text-accent font-mono">{selectedChar.label} says:</p>
            </div>
            <p className="text-sm leading-relaxed">{response}</p>
          </motion.div>
        )}
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
