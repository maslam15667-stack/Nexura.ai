import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, RadioReceiver } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

export default function Voice() {
  const [character, setCharacter] = useState("tsundere");
  const [voiceType, setVoiceType] = useState("soft");
  const [language, setLanguage] = useState("english");
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-y-auto p-4 md:p-8">
      
      <div className="absolute top-8 left-8 right-8 glass p-4 rounded-xl border border-primary/20 flex flex-wrap gap-4 justify-between items-center max-w-4xl mx-auto z-10">
        <div className="flex items-center gap-2 text-primary font-mono font-bold">
          <RadioReceiver className="w-5 h-5" />
          VOICE LINK
        </div>
        <div className="flex gap-4 flex-wrap">
          <Select value={character} onValueChange={setCharacter}>
            <SelectTrigger className="w-32 bg-black/40 border-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["tsundere", "waifu", "senpai", "villain", "yandere", "kuudere"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={voiceType} onValueChange={setVoiceType}>
            <SelectTrigger className="w-32 bg-black/40 border-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["soft", "angry", "cute", "deep", "whisper", "energetic", "calm"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-32 bg-black/40 border-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["auto", "english", "japanese", "hindi", "tamil", "malayalam"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative">
        {isRecording && (
          <>
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <motion.div
              className="absolute inset-0 border-2 border-primary rounded-full"
              animate={{ scale: [1, 1.5, 2], opacity: [1, 0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </>
        )}
        
        <button
          onMouseDown={() => setIsRecording(true)}
          onMouseUp={() => setIsRecording(false)}
          onMouseLeave={() => setIsRecording(false)}
          onTouchStart={() => setIsRecording(true)}
          onTouchEnd={() => setIsRecording(false)}
          className={`relative z-10 w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording 
              ? "bg-primary text-black shadow-[0_0_50px_rgba(0,212,255,0.8)] scale-95" 
              : "bg-black/40 border border-primary/30 text-primary hover:border-primary hover:bg-primary/10 shadow-[0_0_20px_rgba(0,212,255,0.2)]"
          }`}
        >
          <Mic className={`w-20 h-20 ${isRecording ? "animate-bounce" : ""}`} />
        </button>
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-display font-bold glow-text">
          {isRecording ? "Listening..." : "Tap & Hold to Speak"}
        </h2>
        <p className="text-muted-foreground mt-2 font-mono text-sm uppercase tracking-widest">
          {character} • {voiceType} • {language}
        </p>
      </div>

    </div>
  );
}
