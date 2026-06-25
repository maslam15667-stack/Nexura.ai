import { useState, useRef } from "react";
import { useGenerateImage } from "@workspace/api-client-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Loader2, Download, Sparkles, RefreshCw, Wallpaper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoBackground } from "@/components/LogoBackground";
import nexuraLogo from "@assets/ChatGPT_Image_Jun_11,_2026,_09_45_11_AM_1781152668994.png";

const STYLES = [
  { id: "realistic", label: "📸 Realistic",  desc: "Ultra-photorealistic photo quality" },
  { id: "anime",     label: "🎌 Anime",       desc: "Vibrant anime illustration style" },
  { id: "cartoon",   label: "🎨 Cartoon",     desc: "Colorful cartoon art style" },
  { id: "3d",        label: "💎 3D Render",   desc: "CGI / ray-traced 3D quality" },
];

const ASPECT_RATIOS = [
  { id: "9:16", label: "Portrait", desc: "9:16" },
  { id: "16:9", label: "Landscape", desc: "16:9" },
  { id: "1:1", label: "Square", desc: "1:1" },
];

const EXAMPLE_PROMPTS = [
  "a girl standing in heavy rain holding an umbrella on a busy London street at night, cinematic, 8k",
  "a samurai warrior in cherry blossom forest at sunset, photorealistic",
  "futuristic cyberpunk city skyline with neon lights reflecting on wet streets",
  "young woman in traditional Indian saree at Taj Mahal, golden hour photography",
  "a cozy coffee shop interior with warm lighting and rain outside the window",
];

function enhancePrompt(userPrompt: string): string {
  const qualityTags = `masterpiece, best quality, ultra detailed, 8K, sharp focus, cinematic lighting, anime key visual, Ufotable studio style, intricate details, depth of field, vibrant colors, individual strands, professional illustration, trending on pixiv`;
  
  const negativeTags = `worst quality, low quality, normal quality, blurry, lowres, bad anatomy, bad hands, watermark, text, jpeg artifacts, extra limbs, missing fingers, poorly drawn, deformed`;

  return `${userPrompt}, ${qualityTags} --no ${negativeTags}`;
}

export default function ImageGen() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle]   = useState("realistic");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const imgRef              = useRef<HTMLAnchorElement>(null);
  const generateImage       = useGenerateImage();

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    const enhancedPrompt = enhancePrompt(prompt);
    generateImage.mutate({ data: { prompt: enhancedPrompt, style } });
  };

  const handleDownload = (dataUrl: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `nexura-8k-${style}-${Date.now()}.jpg`;
    a.click();
  };

  const handleWallpaper = async (dataUrl: string) => {
    try {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `nexura-wallpaper-${Date.now()}.jpg`;
      link.click();
      alert("Wallpaper downloaded! Set it in your device settings.");
    } catch {
      alert("Failed to download wallpaper.");
    }
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
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold text-white">Image Generator</h1>
            <p className="text-xs text-muted-foreground">Create HD AI images from text</p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-green-400">HD Quality</span>
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

        {/* Aspect Ratio selector */}
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIOS.map(ar => (
            <button
              key={ar.id}
              onClick={() => setAspectRatio(ar.id)}
              className={`p-3 rounded-xl border text-center transition-all ${
                aspectRatio === ar.id
                  ? "bg-primary/20 border-primary/50 shadow-[0_0_12px_rgba(0,212,255,0.3)]"
                  : "bg-white/3 border-white/10 hover:bg-white/5"
              }`}
            >
              <div className="text-sm font-semibold text-white">{ar.label}</div>
              <div className="text-[11px] text-white/60">{ar.desc}</div>
            </button>
          ))}
        </div>

        {/* Prompt input */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate... (we'll enhance it for 8K quality)"
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
                <p className="text-white font-semibold">Generating 8K masterpiece...</p>
                <p className="text-xs text-muted-foreground mt-1">Creating ultra-detailed artwork</p>
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
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">HD Generated Image</p>
                  <p className="text-xs text-muted-foreground">Aspect: {aspectRatio} • Quality: 8K</p>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generateImage.isPending}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              </div>

              {generateImage.data.images.map((img, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-white/10 relative group">
                  <img
                    src={img}
                    alt="Generated"
                    className="w-full object-contain max-h-[500px]"
                  />
                  
                  {/* Nexura logo bottom left */}
                  <div className="absolute bottom-4 left-4 w-10 h-10 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center overflow-hidden hover:border-primary/30 transition-colors">
                    <img src={nexuraLogo} alt="Nexura" className="w-8 h-8 object-contain" />
                  </div>

                  {/* Overlay actions */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                    <p className="text-xs text-white/60 truncate max-w-[40%]">{prompt.slice(0, 40)}{prompt.length > 40 ? "..." : ""}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleWallpaper(img)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary font-semibold text-xs transition-colors"
                        title="Download as wallpaper"
                      >
                        <Wallpaper className="w-3.5 h-3.5" /> Wallpaper
                      </button>
                      <button
                        onClick={() => handleDownload(img)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-white/90 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download HD
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <p className="text-xs text-white/30 text-center">
                I can adjust this image if you tell me more details — describe changes and click Regenerate.
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
