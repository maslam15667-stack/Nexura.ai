import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Sparkles, User, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import nexuraLogo from "@assets/ChatGPT_Image_Jun_11,_2026,_09_45_11_AM_1781152668994.png";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, body: object) {
  const res = await fetch(`${BASE}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data as { token: string; name: string; email: string; id: number };
}

export default function Login() {
  const [, navigate] = useLocation();
  const [tab, setTab]           = useState<"login" | "signup">("login");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const data = tab === "login"
        ? await apiFetch("/auth/login", { email, password })
        : await apiFetch("/auth/register", { name, email, password });
      localStorage.setItem("nexura_token", data.token);
      localStorage.setItem("nexura_user", JSON.stringify({ name: data.name, email: data.email, id: data.id }));
      navigate("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#050510]">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[80px]" />
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-primary/30 shadow-[0_0_30px_rgba(0,212,255,0.3)] mb-4">
            <img src={nexuraLogo} alt="NEXURA" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-display font-bold" style={{ color: "#00D4FF", textShadow: "0 0 20px rgba(0,212,255,0.5)" }}>
            NEXURA
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono tracking-widest uppercase">A NXT GEN AI</p>
        </div>

        {/* Card */}
        <div className="bg-black/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
          {/* Tab switch */}
          <div className="flex bg-white/5 rounded-2xl p-1 mb-6">
            {(["login", "signup"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? "bg-primary text-black shadow-[0_0_15px_rgba(0,212,255,0.4)]"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {t === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: tab === "login" ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {tab === "signup" && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="pl-10 bg-white/5 border-white/10 focus-visible:border-primary/60 focus-visible:ring-0 rounded-xl"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="pl-10 bg-white/5 border-white/10 focus-visible:border-primary/60 focus-visible:ring-0 rounded-xl"
                  onKeyDown={e => e.key === "Enter" && submit()}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="pl-10 pr-10 bg-white/5 border-white/10 focus-visible:border-primary/60 focus-visible:ring-0 rounded-xl"
                  onKeyDown={e => e.key === "Enter" && submit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button
                onClick={submit}
                disabled={loading || !email || !password || (tab === "signup" && !name)}
                className="w-full h-12 rounded-xl font-semibold text-sm bg-primary hover:bg-primary/80 text-black shadow-[0_0_20px_rgba(0,212,255,0.3)]"
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><Sparkles className="w-4 h-4 mr-2" />{tab === "login" ? "Sign In" : "Create Account"}</>
                }
              </Button>
            </motion.div>
          </AnimatePresence>

          <p className="text-center text-xs text-white/25 mt-6 font-mono">
            {tab === "login" ? "New here?" : "Already have an account?"}{" "}
            <button className="text-primary/70 hover:text-primary underline" onClick={() => setTab(tab === "login" ? "signup" : "login")}>
              {tab === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-white/10 mt-6 font-mono">NEXURA · AI COMPANION · ALL RIGHTS RESERVED</p>
      </motion.div>
    </div>
  );
}
