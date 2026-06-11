import { useState } from "react";
import { useAdminListPayments, useAdminApprovePayment, useAdminRejectPayment, getAdminListPaymentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Shield, LogIn, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import nexuraLogo from "@assets/ChatGPT_Image_Jun_11,_2026,_09_45_11_AM_1781152668994.png";

const ALLOWED_EMAIL   = "maslam15667@gmail.com";
const ADMIN_PASSWORD  = "nexura-admin-2024";

const STATUS_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
  pending:  { color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",  icon: <Clock className="w-4 h-4" /> },
  approved: { color: "text-green-400 border-green-400/30 bg-green-400/5",     icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { color: "text-red-400 border-red-400/30 bg-red-400/5",           icon: <XCircle className="w-4 h-4" /> },
  expired:  { color: "text-slate-400 border-slate-400/30 bg-slate-400/5",     icon: <Clock className="w-4 h-4" /> },
};

export default function Admin() {
  const [authed, setAuthed]       = useState(false);
  const [email, setEmail]         = useState("");
  const [pw, setPw]               = useState("");
  const [emailError, setEmailError] = useState("");
  const [pwError, setPwError]     = useState("");
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useAdminListPayments({
    query: { queryKey: getAdminListPaymentsQueryKey(), enabled: authed }
  });

  const approve = useAdminApprovePayment();
  const reject  = useAdminRejectPayment();

  const handleLogin = () => {
    setEmailError("");
    setPwError("");

    if (email.trim().toLowerCase() !== ALLOWED_EMAIL) {
      setEmailError("Access denied. This admin panel is restricted.");
      return;
    }
    if (pw !== ADMIN_PASSWORD) {
      setPwError("Incorrect password.");
      return;
    }
    setAuthed(true);
  };

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0F] relative overflow-hidden p-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/10 rounded-full blur-[80px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-primary/30 shadow-[0_0_40px_rgba(0,212,255,0.1)] space-y-6"
        >
          {/* Logo & title */}
          <div className="flex flex-col items-center gap-3">
            <motion.img
              src={nexuraLogo}
              alt="NEXURA"
              className="w-16 h-16 object-contain"
              animate={{ filter: ["drop-shadow(0 0 8px rgba(0,212,255,0.4))", "drop-shadow(0 0 18px rgba(0,212,255,0.8))", "drop-shadow(0 0 8px rgba(0,212,255,0.4))"] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="text-center">
              <h1 className="text-2xl font-display font-bold" style={{ textShadow: "0 0 10px rgba(0,212,255,0.5)" }}>
                Admin Panel
              </h1>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>NEXURA Management — Private Access</p>
            </div>
          </div>

          {/* Restricted notice */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20">
            <Shield className="w-4 h-4 shrink-0" style={{ color: "#8B5CF6" }} />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
              Restricted to authorised admin only
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,212,255,0.6)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="your@email.com"
                  autoComplete="email"
                  data-testid="input-admin-email"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border text-white placeholder:text-white/20 focus:outline-none transition-all text-sm ${
                    emailError ? "border-red-400/60 focus:border-red-400/80" : "border-white/10 focus:border-primary/60"
                  }`}
                />
              </div>
              {emailError && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,212,255,0.6)" }} />
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => { setPw(e.target.value); setPwError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  data-testid="input-admin-password"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border text-white placeholder:text-white/30 focus:outline-none transition-all text-sm ${
                    pwError ? "border-red-400/60 focus:border-red-400/80" : "border-white/10 focus:border-primary/60"
                  }`}
                />
              </div>
              {pwError && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> {pwError}
                </p>
              )}
            </div>

            <Button
              onClick={handleLogin}
              data-testid="button-admin-login"
              className="w-full font-bold py-5 text-black"
              style={{ background: "linear-gradient(135deg, #00D4FF, #8B5CF6)" }}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In to Admin
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Dashboard ── */
  return (
    <div className="min-h-screen bg-[#0A0A0F] p-6 relative">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={nexuraLogo} alt="NEXURA" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-2xl font-display font-bold" style={{ textShadow: "0 0 10px rgba(0,212,255,0.5)" }}>
                Admin Dashboard
              </h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                Signed in as <span style={{ color: "#00D4FF" }}>{ALLOWED_EMAIL}</span>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => { setAuthed(false); setEmail(""); setPw(""); }}
            className="border-red-400/30 text-red-400 hover:bg-red-400/10 text-xs"
          >
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending",  count: payments.filter(p => p.status === "pending").length,  color: "#F59E0B" },
            { label: "Approved", count: payments.filter(p => p.status === "approved").length, color: "#22C55E" },
            { label: "Total",    count: payments.length,                                       color: "#00D4FF" },
          ].map(({ label, count, color }) => (
            <div
              key={label}
              className="rounded-xl p-4 text-center bg-white/5 border"
              style={{ borderColor: `${color}30` }}
            >
              <p className="text-3xl font-bold font-display" style={{ color }}>{count}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Payments table */}
        <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10">
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: "#00D4FF" }} />
            <h2 className="font-display font-bold" style={{ color: "#00D4FF" }}>Payment Submissions</h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>No payments yet.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {[...payments].reverse().map((payment) => {
                const style = STATUS_STYLES[payment.status] ?? STATUS_STYLES.pending;
                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
                    data-testid={`row-payment-${payment.id}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-mono font-bold">{payment.utrNumber}</span>
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${style.color}`}>
                          {style.icon} {payment.status}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Submitted: {new Date(payment.createdAt).toLocaleString()}
                      </p>
                      {payment.approvedAt && (
                        <p className="text-xs text-green-400/70">
                          Approved: {new Date(payment.approvedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {payment.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approve.mutate(
                            { id: payment.id },
                            { onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListPaymentsQueryKey() }) }
                          )}
                          disabled={approve.isPending}
                          data-testid={`button-approve-${payment.id}`}
                          className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 text-xs"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reject.mutate(
                            { id: payment.id },
                            { onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListPaymentsQueryKey() }) }
                          )}
                          disabled={reject.isPending}
                          data-testid={`button-reject-${payment.id}`}
                          className="border-red-400/40 text-red-400 hover:bg-red-400/10 text-xs"
                        >
                          <XCircle className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
