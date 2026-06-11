import nexuraLogo from "@assets/ChatGPT_Image_Jun_11,_2026,_09_45_11_AM_1781152668994.png";

const CHARACTER_STYLES: Record<string, { bg: string; border: string; emoji: string; label: string }> = {
  normal:   { bg: "from-cyan-500/30 to-blue-600/30",   border: "border-cyan-400/60",   emoji: "🤖", label: "NEXURA" },
  tsundere: { bg: "from-pink-500/30 to-red-500/30",    border: "border-pink-400/60",   emoji: "😤", label: "Tsundere" },
  waifu:    { bg: "from-pink-400/30 to-purple-500/30", border: "border-pink-300/60",   emoji: "🌸", label: "Waifu" },
  senpai:   { bg: "from-blue-500/30 to-indigo-600/30", border: "border-blue-400/60",   emoji: "📚", label: "Senpai" },
  villain:  { bg: "from-red-600/30 to-purple-800/30",  border: "border-red-400/60",    emoji: "⚔️", label: "Villain" },
  yandere:  { bg: "from-red-400/30 to-pink-600/30",    border: "border-red-300/60",    emoji: "🔪", label: "Yandere" },
  kuudere:  { bg: "from-slate-500/30 to-blue-700/30",  border: "border-slate-400/60",  emoji: "❄️", label: "Kuudere" },
};

interface AiAvatarProps {
  character?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function AiAvatar({ character = "normal", size = "md", showLabel = false }: AiAvatarProps) {
  const style = CHARACTER_STYLES[character.toLowerCase()] ?? CHARACTER_STYLES.normal;

  const sizeClass = {
    sm: "w-9 h-9 text-lg",
    md: "w-12 h-12 text-2xl",
    lg: "w-20 h-20 text-4xl",
  }[size];

  const isNexura = character === "normal" || character === "nexura";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClass} rounded-xl bg-gradient-to-br ${style.bg} border ${style.border} flex items-center justify-center shrink-0 shadow-lg overflow-hidden`}
        style={{ boxShadow: `0 0 12px ${style.border.replace("border-", "").replace("/60", "")}` }}
      >
        {isNexura ? (
          <img src={nexuraLogo} alt="NEXURA" className="w-full h-full object-cover" />
        ) : (
          <span className={size === "sm" ? "text-base" : size === "lg" ? "text-3xl" : "text-xl"}>
            {style.emoji}
          </span>
        )}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-mono">{style.label}</span>
      )}
    </div>
  );
}

export function UserAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = {
    sm: "w-9 h-9 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-20 h-20 text-2xl",
  }[size];

  return (
    <div className={`${sizeClass} rounded-xl bg-gradient-to-br from-accent/30 to-purple-700/30 border border-accent/60 flex items-center justify-center shrink-0 shadow-lg`}>
      <span>👤</span>
    </div>
  );
}
