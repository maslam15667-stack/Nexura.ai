import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, Sparkles, Zap, MessageSquare, Image, Loader2, CheckCircle, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoBackground } from "@/components/LogoBackground";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const UPI_ID = "maslam15667@okaxis";
const UPI_NAME = "Mohammed Aslam";
const UPI_URI = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=10&cu=INR&tn=${encodeURIComponent("NEXURA Premium")}`;

const FEATURES = [
  { icon: MessageSquare, label: "Unlimited AI chats daily", free: "10/day", premium: "Unlimited" },
  { icon: Image,         label: "Image generation",         free: "Limited", premium: "Unlimited" },
  { icon: Zap,           label: "Priority AI responses",    free: false, premium: true },
  { icon: Star,          label: "Premium badge",            free: false, premium: true },
];

export default function Payment() {
  const { toast } = useToast();
  const [utr, setUtr]         = useState("");
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(() => {
    const u = localStorage.getItem("nexura_user");
    if (!u) return false;
    try { return JSON.parse(u).isPremium === true; } catch { return false; }
  });

  const handleActivate = async () => {
    if (!utr.trim()) return;
    setLoading(true);
    const token = localStorage.getItem("nexura_token");
    try {
      const res = await fetch(`${BASE}/api/auth/activate-premium`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ utrNumber: utr }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        setActivated(true);
        const stored = localStorage.getItem("nexura_user");
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, unknown>;
          localStorage.setItem("nexura_user", JSON.stringify({ ...parsed, isPremium: true }));
        }
        toast({ title: "🎉 Premium Activated!", description: "Enjoy unlimited chats on NEXURA!" });
      } else {
        toast({ title: "Error", description: data.error ?? "Failed to activate", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error. Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto relative">
      <LogoBackground />

      <div className="relative z-10 max-w-sm mx-auto w-full p-4 space-y-4 py-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-400/20 border border-yellow-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Crown className="w-7 h-7 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">
            NEXURA Premium
          </h1>
          <p className="text-muted-foreground text-sm">Unlock unlimited AI power for just ₹10</p>
        </div>

        <AnimatePresence mode="wait">
          {activated ? (
            <motion.div
              key="activated"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center space-y-4"
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
              <div>
                <h3 className="text-xl font-bold text-green-400">You're Premium! 🎉</h3>
                <p className="text-sm text-muted-foreground mt-1">Enjoy unlimited AI chats and all premium features.</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-yellow-400 bg-yellow-500/10 rounded-xl px-4 py-2 border border-yellow-500/20">
                <Crown className="w-4 h-4" />
                <span className="text-sm font-semibold">NEXURA Premium Active</span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="upgrade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

              {/* Price */}
              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-400/10 border border-yellow-500/30 rounded-2xl p-5 text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-display font-bold text-white">₹10</span>
                  <span className="text-muted-foreground">/lifetime</span>
                </div>
                <p className="text-xs text-yellow-400/70 mt-1">One time · No hidden charges</p>
              </div>

              {/* Features comparison */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-3 text-xs font-semibold text-center border-b border-white/10">
                  <div className="py-2.5 px-2 text-muted-foreground">Feature</div>
                  <div className="py-2.5 px-2 text-white/50">Free</div>
                  <div className="py-2.5 px-2 text-yellow-400 bg-yellow-500/5">Premium</div>
                </div>
                {FEATURES.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="grid grid-cols-3 text-xs border-b border-white/5 last:border-0">
                      <div className="py-3 px-3 flex items-center gap-1.5 text-white/60">
                        <Icon className="w-3 h-3 flex-shrink-0" />
                        <span className="leading-tight">{f.label}</span>
                      </div>
                      <div className="py-3 px-2 flex items-center justify-center">
                        {f.free === false
                          ? <span className="text-white/20">✕</span>
                          : <span className="text-white/50">{f.free}</span>}
                      </div>
                      <div className="py-3 px-2 flex items-center justify-center bg-yellow-500/5">
                        {f.premium === true
                          ? <Check className="w-3.5 h-3.5 text-green-400" />
                          : <span className="text-yellow-400 font-semibold">{f.premium}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* QR Code */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <p className="text-center text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  Step 1 — Scan & Pay ₹10
                </p>
                <a href={UPI_URI} className="block">
                  <div className="bg-white rounded-2xl p-3 mx-auto w-fit shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-shadow">
                    <img
                      src="/upi-qr.jpeg"
                      alt="UPI QR Code — Mohammed Aslam"
                      className="w-48 h-48 object-contain rounded-xl"
                    />
                  </div>
                </a>
                <div className="text-center space-y-0.5">
                  <p className="text-yellow-400 font-mono font-bold text-lg">₹10.00</p>
                  <p className="text-xs text-muted-foreground">UPI: {UPI_ID}</p>
                  <p className="text-xs text-muted-foreground">Mohammed Aslam</p>
                </div>
                <a
                  href={UPI_URI}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-bold text-sm hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                >
                  <Sparkles className="w-4 h-4" /> Pay ₹10 via GPay / UPI
                </a>
              </div>

              {/* UTR input */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider text-center">
                  Step 2 — Enter Transaction ID
                </p>
                <Input
                  value={utr}
                  onChange={e => setUtr(e.target.value)}
                  placeholder="UPI Transaction ID / UTR Number"
                  className="bg-black/40 border-white/10 focus-visible:border-yellow-500/50 focus-visible:ring-0 text-center tracking-wider rounded-xl"
                  onKeyDown={e => e.key === "Enter" && handleActivate()}
                />
                <button
                  onClick={handleActivate}
                  disabled={!utr.trim() || loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 text-white font-semibold text-sm transition-all disabled:opacity-50"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Activating...</>
                    : <><Crown className="w-4 h-4 text-yellow-400" /> Activate Premium</>
                  }
                </button>
                <p className="text-xs text-center text-white/25">
                  Your account will be upgraded instantly after submission
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
