import { useState, useRef } from "react";
import { useGenerateImage } from "@workspace/api-client-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Loader2, Download, Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoBackground } from "@/components/LogoBackground";

const STYLES = [
  { id: "realistic", label: "📸 Realistic",  desc: "Ultra-photorealistic photo quality" },
  { id: "anime",     label: "🎌 Anime",       desc: "Vibrant anime illustration style" },
  { id: "cartoon",   label: "🎨 Cartoon",     desc: "Colorful cartoon art style" },
  { id: "3d",        label: "💎 3D Render",   desc: "CGI / ray-traced 3D quality" },
];

const EXAMPLE_PROMPTS = [
  "a girl standing in heavy rain holding an umbrella on a busy London street at night, cinematic, 8k",
  "a samurai warrior in cherry blossom forest at sunset, photorealistic",
  "futuristic cyberpunk city skyline with neon lights reflecting on wet streets",
  "young woman in traditional Indian saree at Taj Mahal, golden hour photography",
  "a cozy coffee shop interior with warm lighting and rain outside the window",
];

export default function ImageGen() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle]   = useState("realistic");
  const imgRef              = useRef<HTMLAnchorElement>(null);
  const generateImage       = useGenerateImage();

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generateImage.mutate({ data: { prompt, style } });
  };

  const handleDownload = (dataUrl: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `nexura-${style}-${Date.now()}.jpg`;
    a.click();
  };

  const selectedStyle = STYLES.find(s => s.id === style)!;

  return (
    <div className="flex flex-col h-full relative overflow-y-auto">
      <LogoBackground />

      <div className="relative z-10 max-w-2xl mx-auto w-full p-4 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white">Image Generator</h1>
            <p className="text-xs text-muted-foreground">Create realistic AI images from text</p>
          </div>
        </div>

        {/* Style selector */}
        <div className="grid grid-cols-4 gap-2">
          {STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                style === s.id
                  ? "bg-accent/20 border-accent/50 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                  : "bg-white/3 border-white/10 hover:bg-white/5"
              }`}
            >
              <div className="text-lg mb-0.5">{s.label.split(" ")[0]}</div>
              <div className="text-[10px] font-medium text-white/70 leading-tight">{s.label.split(" ").slice(1).join(" ")}</div>
            </button>
          ))}
        </div>

        {/* Prompt input */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="min-h-[100px] bg-transparent border-0 resize-none text-sm focus-visible:ring-0 p-0 placeholder:text-white/30"
          />
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
            <p className="text-xs text-muted-foreground">{selectedStyle.desc}</p>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generateImage.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/80 text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(139,92,246,0.4)]"
            >
              {generateImage.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                : <><Sparkles className="w-4 h-4" /> Generate</>}
            </button>
          </div>
        </div>

        {/* Example prompts */}
        {!generateImage.data && !generateImage.isPending && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">✦ Try these</p>
            <div className="space-y-2">
              {EXAMPLE_PROMPTS.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  className="w-full text-left text-sm text-white/50 hover:text-white/80 bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl px-4 py-2.5 transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        <AnimatePresence>
          {generateImage.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <div className="w-16 h-16 rounded-2xl border border-accent/30 bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-accent animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Creating your image...</p>
                <p className="text-xs text-muted-foreground mt-1">This takes 10–20 seconds</p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full bg-accent"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.3 }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated image */}
        <AnimatePresence>
          {generateImage.data && generateImage.data.images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Here's your generated image.</p>
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              </div>

              {generateImage.data.images.map((img, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-white/10 relative">
                  <img
                    src={img}
                    alt="Generated"
                    className="w-full object-contain max-h-[500px]"
                  />
                  {/* Overlay actions */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                    <p className="text-xs text-white/60 truncate max-w-[60%]">{prompt.slice(0, 60)}{prompt.length > 60 ? "..." : ""}</p>
                    <button
                      onClick={() => handleDownload(img)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors shadow-lg"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </div>
                </div>
              ))}

              <p className="text-xs text-white/30 text-center">
                I can adjust this image if you tell me more details — describe changes and click Generate again.
              </p>
            </motion.div>
          )}

          {generateImage.data && generateImage.data.images.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <p className="text-sm">Generation failed. Please try again.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <a ref={imgRef} className="hidden" />
    </div>
  );
}
