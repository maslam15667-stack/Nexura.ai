import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Crown, MessageSquare, Mail, User, Star, ArrowRight, Shield, LogOut, Timer, AlertCircle } from "lucide-react";
import { LogoBackground } from "@/components/LogoBackground";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type UserInfo = {
  name: string;
  email: string;
  id: number;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  chatsToday: number;
  chatLimit: number;
};

function useCountdown(expiresAt: string | null) {
  const calc = useCallback(() => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s, totalMs: diff };
  }, [expiresAt]);

  const [timeLeft, setTimeLeft] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);

  return timeLeft;
}

function CountdownBadge({ expiresAt }: { expiresAt: string }) {
  const t = useCountdown(expiresAt);
  if (!t) return (
    <div className="flex items-center gap-1.5 text-xs text-red-400/80 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-1.5">
      <AlertCircle className="w-3 h-3" /> Premium expired
    </div>
  );

  const urgency = t.totalMs < 3600000; // under 1 hour
  return (
    <div className={`flex items-center gap-2 text-xs font-mono rounded-xl px-3 py-2 border ${
      urgency
        ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
        : "text-green-400 bg-green-500/10 border-green-500/30"
    }`}>
      <Timer className="w-3.5 h-3.5" />
      <span>
        Expires in{" "}
        <strong>
          {String(t.h).padStart(2, "0")}:{String(t.m).padStart(2, "0")}:{String(t.s).padStart(2, "0")}
        </strong>
      </span>
    </div>
  );
}

export default function Profile() {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(() => {
    const token = localStorage.getItem("nexura_token");
    if (!token) { navigate("/login"); return; }
    fetch(`${BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: UserInfo) => { setUser(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [navigate]);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const handleLogout = () => {
    if (confirm("Log out of NEXURA?")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const chatsRemaining = user.isPremium ? "∞" : Math.max(0, user.chatLimit - user.chatsToday);
  const usagePercent   = user.isPremium ? 0 : Math.min(100, (user.chatsToday / user.chatLimit) * 100);
  const expiryDate     = user.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto relative">
      <LogoBackground />

      <div className="relative z-10 max-w-md mx-auto w-full p-4 space-y-4 pt-6">

        {/* Avatar card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center relative overflow-hidden"
        >
          {user.isPremium && (
            <div className="absolute top-3 right-3">
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 text-black">
                <Crown className="w-3 h-3" /> PREMIUM
              </span>
            </div>
          )}

          <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold border-2 ${
            user.isPremium
              ? "bg-gradient-to-br from-yellow-500/20 to-amber-400/20 border-yellow-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              : "bg-gradient-to-br from-primary/20 to-accent/20 border-primary/40 shadow-[0_0_20px_rgba(0,212,255,0.2)]"
          }`}>
            {user.name[0].toUpperCase()}
          </div>

          <h2 className="text-xl font-display font-bold text-white">{user.name}</h2>
          <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />{user.email}
          </p>

          <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
            user.isPremium
              ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
              : "bg-white/5 border border-white/10 text-white/50"
          }`}>
            {user.isPremium ? <><Crown className="w-3 h-3" /> NEXURA Premium</> : <><User className="w-3 h-3" /> Free Account</>}
          </div>

          {/* Countdown timer */}
          {user.isPremium && user.premiumExpiresAt && (
            <div className="mt-3 flex justify-center">
              <CountdownBadge expiresAt={user.premiumExpiresAt} />
            </div>
          )}
        </motion.div>

        {/* Premium expiry info */}
        {user.isPremium && expiryDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-400">Premium Active — 24 Hour Pass</span>
            </div>
            <p className="text-xs text-white/50 pl-6">
              Activated: {new Date(expiryDate.getTime() - 86400000).toLocaleString()}
            </p>
            <p className="text-xs text-white/50 pl-6">
              Expires: <span className="text-yellow-400/80">{expiryDate.toLocaleString()}</span>
            </p>
            <button
              onClick={() => navigate("/payment")}
              className="ml-6 text-xs text-yellow-400/60 hover:text-yellow-400 underline transition-colors"
            >
              Renew after expiry →
            </button>
          </motion.div>
        )}

        {/* Usage stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-white">Today's Chat Usage</span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-display font-bold text-white">{user.chatsToday}</span>
              <span className="text-muted-foreground text-sm ml-1">/ {user.isPremium ? "∞" : user.chatLimit} chats</span>
            </div>
            <span className={`text-sm font-semibold ${user.isPremium ? "text-yellow-400" : "text-primary"}`}>
              {chatsRemaining} remaining
            </span>
          </div>

          {!user.isPremium && (
            <div className="space-y-1.5">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${usagePercent >= 80 ? "bg-red-500" : usagePercent >= 50 ? "bg-yellow-500" : "bg-primary"}`}
                />
              </div>
              <p className="text-xs text-muted-foreground">Resets daily at midnight</p>
            </div>
          )}

          {user.isPremium && (
            <div className="flex items-center gap-2 text-yellow-400/70 text-xs">
              <Star className="w-3 h-3" />
              <span>Unlimited chats — Premium active for 24 hours</span>
            </div>
          )}
        </motion.div>

        {/* Upgrade card (free users only) */}
        {!user.isPremium && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            onClick={() => navigate("/payment")}
            className="w-full bg-gradient-to-r from-yellow-500/10 to-amber-400/10 border border-yellow-500/30 rounded-2xl p-5 text-left hover:from-yellow-500/20 hover:to-amber-400/20 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Get Premium — 24 Hours</p>
                  <p className="text-xs text-yellow-400/70 mt-0.5">Unlimited chats · Just ₹10</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-yellow-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        )}

        {/* Renew card (premium users — show near expiry or always) */}
        {user.isPremium && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            onClick={() => navigate("/payment")}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left hover:bg-white/8 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-sm font-semibold text-white">Renew Premium</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Extend for another 24 hours · ₹10</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        )}

        {/* Account info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-white">Account Info</span>
          </div>
          <div className="divide-y divide-white/5">
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-muted-foreground">User ID</span>
              <span className="text-sm text-white font-mono">#{user.id}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className={`text-sm font-semibold ${user.isPremium ? "text-yellow-400" : "text-white/60"}`}>
                {user.isPremium ? "Premium (24h)" : "Free"}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-muted-foreground">Daily limit</span>
              <span className="text-sm text-white">{user.isPremium ? "Unlimited" : `${user.chatLimit} chats`}</span>
            </div>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all group"
        >
          <div>
            <p className="font-semibold text-red-400 text-sm text-left">Sign Out</p>
            <p className="text-xs text-red-400/50 mt-0.5">Clear session and return to login</p>
          </div>
          <LogOut className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        <p className="text-center text-xs text-white/15 font-mono pb-4">NEXURA v1.0 · A NXT GEN AI</p>
      </div>
    </div>
  );
}
