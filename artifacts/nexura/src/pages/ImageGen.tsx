import React, { useState } from "react";
import { useGenerateImage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Loader2, Download } from "lucide-react";
import { motion } from "framer-motion";

const STYLES = ["Anime", "Realistic", "Cartoon", "3D"];

export default function ImageGen() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Anime");
  const generateImage = useGenerateImage();

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generateImage.mutate({ data: { prompt, style: style.toLowerCase() } });
  };

  return (
    <div className="flex flex-col h-full relative overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold glow-text flex items-center gap-3 text-accent">
            <ImageIcon className="w-8 h-8 text-accent" />
            Image Generator
          </h1>
          <p className="text-muted-foreground mt-2">Materialize concepts into visual reality</p>
        </div>

        <div className="glass p-6 rounded-2xl border border-accent/30 glow-border-accent space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="min-h-[120px] bg-black/40 border-accent/20 resize-none text-lg"
          />
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="w-full sm:w-64">
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="bg-black/40 border-accent/20">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generateImage.isPending}
              className="w-full sm:w-auto px-8 bg-accent hover:bg-accent/80 text-white font-semibold"
            >
              {generateImage.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ImageIcon className="w-5 h-5 mr-2" />}
              Generate
            </Button>
          </div>
        </div>

        {generateImage.data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {generateImage.data.images.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group rounded-xl overflow-hidden glass border border-accent/30 aspect-square"
              >
                <img src={img} alt="Generated" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
