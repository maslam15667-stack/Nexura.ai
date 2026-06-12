import { useState, useEffect } from "react";
import { Settings as SettingsIcon, LogOut, Globe, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

const LANGUAGES = [
  { code: "english",   label: "English",   flag: "🇬🇧" },
  { code: "tamil",     label: "தமிழ்",    flag: "🇮🇳" },
  { code: "hindi",     label: "हिन्दी",   flag: "🇮🇳" },
  { code: "malayalam", label: "മലയാളം",   flag: "🇮🇳" },
  { code: "japanese",  label: "日本語",    flag: "🇯🇵" },
  { code: "arabic",    label: "العربية",   flag: "🇸🇦" },
];

export default function Settings() {
  const [lang, setLang] = useState(() => localStorage.getItem("nexura_lang") ?? "english");
  const [open, setOpen] = useState(false);

  const selected = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];

  const handleLang = (code: string) => {
    setLang(code);
    localStorage.setItem("nexura_lang", code);
    setOpen(false);
  };

  const handleLogout = () => {
    if (confirm("Log out of NEXURA?")) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-y-auto">
      <div className="max-w-md mx-auto w-full p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Settings</h1>
            <p className="text-xs text-muted-foreground">Personalise your experience</p>
          </div>
        </div>

        {/* App Language */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-white">App Language</span>
          </div>

          <div className="p-4 space-y-2">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => handleLang(l.code)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  lang === l.code
                    ? "bg-primary/20 border border-primary/50 text-white"
                    : "bg-black/20 border border-white/5 text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{l.flag}</span>
                  <span className="font-medium text-sm">{l.label}</span>
                </div>
                {lang === l.code && (
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(0,212,255,0.8)]" />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all group"
          >
            <div>
              <p className="font-semibold text-red-400 text-sm">Logout</p>
              <p className="text-xs text-red-400/50 mt-0.5">Clear session and return to home</p>
            </div>
            <LogOut className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Version */}
        <p className="text-center text-xs text-white/15 font-mono pb-4">NEXURA v1.0 · A NXT GEN AI</p>
      </div>
    </div>
  );
}
