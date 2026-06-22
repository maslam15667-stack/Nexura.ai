import { useState, useMemo } from "react";
import { useListPrompts, getListPromptsQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Copy, Check, Eye, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["All", "Writing", "Code", "Learning", "Business", "Creative", "Personal"];

const PROMPT_META: Record<string, { category: string; color: string; seed: number }> = {
  "Write Resume":       { category: "Writing",   color: "from-blue-500 to-indigo-600",   seed: 10 },
  "YouTube Script":     { category: "Creative",  color: "from-red-500 to-orange-500",    seed: 20 },
  "Exam Notes":         { category: "Learning",  color: "from-green-500 to-teal-600",    seed: 30 },
  "Debug Code":         { category: "Code",      color: "from-yellow-500 to-amber-600",  seed: 40 },
  "Write Email":        { category: "Writing",   color: "from-purple-500 to-violet-600", seed: 50 },
  "Study Plan":         { category: "Learning",  color: "from-cyan-500 to-blue-500",     seed: 60 },
  "Business Idea":      { category: "Business",  color: "from-emerald-500 to-green-600", seed: 70 },
  "Social Media Post":  { category: "Creative",  color: "from-pink-500 to-rose-600",     seed: 80 },
  "Cover Letter":       { category: "Writing",   color: "from-sky-500 to-blue-600",      seed: 90 },
  "Python Script":      { category: "Code",      color: "from-lime-500 to-green-500",    seed: 100 },
  "Essay Introduction": { category: "Writing",   color: "from-violet-500 to-purple-600", seed: 110 },
  "Meeting Summary":    { category: "Business",  color: "from-slate-500 to-blue-700",    seed: 120 },
  "Product Description":{ category: "Business",  color: "from-orange-500 to-red-500",    seed: 130 },
  "Data Analysis":      { category: "Code",      color: "from-teal-500 to-cyan-600",     seed: 140 },
  "Story Starter":      { category: "Creative",  color: "from-rose-500 to-pink-600",     seed: 150 },
  "Explain Concept":    { category: "Learning",  color: "from-indigo-500 to-blue-600",   seed: 160 },
  "Interview Prep":     { category: "Personal",  color: "from-amber-500 to-yellow-500",  seed: 170 },
  "Workout Plan":       { category: "Personal",  color: "from-green-400 to-emerald-500", seed: 180 },
  "Recipe Creator":     { category: "Creative",  color: "from-orange-400 to-amber-500",  seed: 190 },
  "Translation":        { category: "Writing",   color: "from-blue-400 to-cyan-500",     seed: 200 },
};

type Prompt = { id: number; name: string; text: string; isPreset?: boolean; createdAt: string };

function PromptCard({ prompt, index, onClick }: { prompt: Prompt; index: number; onClick: () => void }) {
  const meta = PROMPT_META[prompt.name] ?? { category: "Writing", color: "from-primary/60 to-accent/60", seed: index * 17 };
  const imgUrl = `https://picsum.photos/seed/${meta.seed + index}/400/500`;
  const views = ((meta.seed + index * 37) % 900 + 100) * 100;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl border border-white/10 text-left group aspect-[3/4]"
    >
      {/* Background photo */}
      <img
        src={imgUrl}
        alt={prompt.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className={`absolute inset-0 bg-gradient-to-br ${meta.color} opacity-20`} />

      {/* Category badge */}
      <div className="absolute top-3 left-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r ${meta.color} text-white shadow-lg`}>
          {meta.category}
        </span>
      </div>

      {/* View count */}
      <div className="absolute top-3 right-3 flex items-center gap-1 text-white/60 text-xs bg-black/40 px-2 py-1 rounded-full">
        <Eye className="w-3 h-3" />
        <span>{(views / 1000).toFixed(1)}k+</span>
      </div>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="font-display font-bold text-white text-sm leading-tight">{prompt.name}</p>
        <p className="text-white/50 text-xs mt-1 line-clamp-2 leading-tight">{prompt.text.slice(0, 60)}...</p>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
    </motion.button>
  );
}

function PromptDetail({ prompt, onBack }: { prompt: Prompt; onBack: () => void }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const meta = PROMPT_META[prompt.name] ?? { category: "Writing", color: "from-primary/60 to-accent/60", seed: 10 };
  const imgUrl = `https://picsum.photos/seed/${meta.seed}/400/500`;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.text);
    setCopied(true);
    toast({ title: "Copied!", description: "Prompt copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 glass">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Prompt Details & Copy</p>
          <p className={`text-sm font-bold bg-gradient-to-r ${meta.color} bg-clip-text text-transparent`}>Prompt</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Preview image */}
        <div className={`relative w-full aspect-video rounded-2xl overflow-hidden border-2 bg-gradient-to-br ${meta.color} p-0.5`}>
          <img src={imgUrl} alt={prompt.name} className="w-full h-full object-cover rounded-[14px]" />
          <div className="absolute bottom-3 left-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${meta.color} text-white shadow-lg`}>
              {meta.category}
            </span>
          </div>
        </div>

        {/* Prompt title */}
        <h2 className="text-xl font-display font-bold text-white">{prompt.name}</h2>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Prompt"}
          </button>
          <a
            href={`https://gemini.google.com/app?q=${encodeURIComponent(prompt.text)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Open Gemini
          </a>
        </div>

        {/* Full prompt text */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">Prompt:</p>
          <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{prompt.text}</p>
        </div>

        {/* Tips */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <p className="text-xs text-primary/70 font-mono mb-2 uppercase tracking-wider">💡 How to use</p>
          <p className="text-xs text-white/50 leading-relaxed">
            Copy this prompt and paste it into any AI assistant. Replace the <span className="text-primary/70 font-mono">[bracketed]</span> parts with your specific details for best results.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Prompts() {
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Prompt | null>(null);

  const { data: serverPrompts = [] } = useListPrompts({
    query: { queryKey: getListPromptsQueryKey() }
  });

  const filtered = useMemo(() => {
    return serverPrompts.filter(p => {
      const meta = PROMPT_META[p.name];
      const matchCat = category === "All" || meta?.category === category;
      const matchSearch = !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || p.text.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [serverPrompts, search, category]);

  return (
    <div className="flex flex-col h-full relative">
      <AnimatePresence mode="wait">
        {selected ? (
          <PromptDetail key="detail" prompt={selected} onBack={() => setSelected(null)} />
        ) : (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 space-y-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <div>
                  <h1 className="text-lg font-display font-bold text-white">Generate High Quality</h1>
                  <p className="text-primary font-display font-bold text-lg leading-tight">Prompt</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search prompts..!"
                  className="pl-9 bg-white/5 border-white/10 rounded-xl focus-visible:border-primary/40 focus-visible:ring-0"
                />
              </div>

              {/* Category chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      category === cat
                        ? "bg-primary text-black shadow-[0_0_10px_rgba(0,212,255,0.4)]"
                        : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    ✦ {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                  <Search className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No prompts found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map((prompt, i) => (
                    <PromptCard key={prompt.id} prompt={prompt} index={i} onClick={() => setSelected(prompt)} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
