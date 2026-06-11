import { useState } from "react";
import { useAdminListPayments, useAdminApprovePayment, useAdminRejectPayment, getAdminListPaymentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Shield, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import nexuraLogo from "@assets/ChatGPT_Image_Jun_11,_2026,_09_45_11_AM_1781152668994.png";

const ADMIN_PASSWORD = "nexura-admin-2024";

const STATUS_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
  pending:  { color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",  icon: <Clock className="w-4 h-4" /> },
  approved: { color: "text-green-400 border-green-400/30 bg-green-400/5",     icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { color: "text-red-400 border-red-400/30 bg-red-400/5",           icon: <XCircle className="w-4 h-4" /> },
  expired:  { color: "text-slate-400 border-slate-400/30 bg-slate-400/5",     icon: <Clock className="w-4 h-4" /> },
};

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useAdminListPayments({
    query: { queryKey: getAdminListPaymentsQueryKey(), enabled: authed }
  });

  const approve = useAdminApprovePayment();
  const reject  = useAdminRejectPayment();

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0A0A0F] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm p-8 glass rounded-2xl border border-primary/30 glow-border space-y-6"
        >
          <div className="flex flex-col items-center gap-3">
            <img src={nexuraLogo} alt="NEXURA" className="w-16 h-16 object-contain" />
            <div className="text-center">
              <h1 className="text-2xl font-display font-bold glow-text">Admin Panel</h1>
              <p className="text-muted-foreground text-sm">NEXURA Management</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Shield className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest">Secure Access</span>
            </div>
            <input
              type="password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setPwError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Admin password..."
              className={`w-full px-4 py-3 rounded-xl bg-black/40 border ${pwError ? "border-red-400/60" : "border-primary/30"} text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all`}
              data-testid="input-admin-password"
            />
            {pwError && <p className="text-red-400 text-xs">Incorrect password.</p>}
            <Button
              onClick={handleLogin}
              className="w-full bg-primary hover:bg-primary/80 text-black font-bold py-5"
              data-testid="button-admin-login"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Enter Admin Panel
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-6 relative">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={nexuraLogo} alt="NEXURA" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-2xl font-display font-bold glow-text">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">Manage UPI payment approvals</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setAuthed(false)}
            className="border-red-400/30 text-red-400 hover:bg-red-400/10 text-xs"
          >
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending",  count: payments.filter(p => p.status === "pending").length,  color: "text-yellow-400 border-yellow-400/30" },
            { label: "Approved", count: payments.filter(p => p.status === "approved").length, color: "text-green-400 border-green-400/30" },
            { label: "Total",    count: payments.length,                                       color: "text-primary border-primary/30" },
          ].map(({ label, count, color }) => (
            <div key={label} className={`glass rounded-xl border ${color} p-4 text-center`}>
              <p className={`text-3xl font-bold font-display ${color.split(" ")[0]}`}>{count}</p>
              <p className="text-muted-foreground text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Payments table */}
        <div className="glass rounded-2xl border border-primary/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-primary/10 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="font-display font-bold text-primary">Payment Submissions</h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No payments yet.</div>
          ) : (
            <div className="divide-y divide-border/30">
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
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono font-bold">{payment.utrNumber}</span>
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${style.color}`}>
                          {style.icon}
                          {payment.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
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
