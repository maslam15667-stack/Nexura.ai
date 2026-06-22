import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, LogIn, Mail, Lock, XCircle, Users, Crown,
  Trash2, Ban, CheckCircle, Clock, UserCheck, RefreshCw,
  ChevronRight, AlertTriangle, Eye, EyeOff
} from "lucide-react";
import nexuraLogo from "@assets/ChatGPT_Image_Jun_11,_2026,_09_45_11_AM_1781152668994.png";

const BASE          = import.meta.env.BASE_URL.replace(/\/$/, "");
const ALLOWED_EMAIL = "maslam15667@gmail.com";
const ADMIN_KEY     = "nexura-admin-2024";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  isBlocked: boolean;
  isAdmin: boolean;
  dailyChatCount: number;
  lastChatDate: string;
  createdAt: string;
};

function adminFetch(path: string, opts?: RequestInit) {
  return fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: { "x-admin-key": ADMIN_KEY, "Content-Type": "application/json", ...opts?.headers },
  }).then(r => r.json());
}

function TabButton({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active ? "bg-primary/20 border border-primary/40 text-primary" : "text-white/40 hover:text-white/70"
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? "bg-primary/30 text-primary" : "bg-white/10 text-white/40"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function Admin() {
  const [authed, setAuthed]   = useState(false);
  const [email, setEmail]     = useState("");
  const [pw, setPw]           = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState("");
  const [tab, setTab]         = useState<"users" | "payments">("users");

  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [actionId, setActionId]     = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    const data = await adminFetch("/admin/users") as AdminUser[];
    setUsers(Array.isArray(data) ? data : []);
    setUsersLoading(false);
  }, []);

  useEffect(() => { if (authed) fetchUsers(); }, [authed, fetchUsers]);

  const handleLogin = () => {
    setError("");
    if (email.trim().toLowerCase() !== ALLOWED_EMAIL) {
      setError("Access denied. This email is not authorised.");
      return;
    }
    if (pw !== ADMIN_KEY) {
      setError("Incorrect password.");
      return;
    }
    setAuthed(true);
  };

  const handleBlock = async (u: AdminUser) => {
    setActionId(u.id);
    await adminFetch(`/admin/users/${u.id}/${u.isBlocked ? "unblock" : "block"}`, { method: "POST" });
    await fetchUsers();
    setActionId(null);
  };

  const handleDelete = async (u: AdminUser) => {
    setActionId(u.id);
    setConfirmDelete(null);
    await adminFetch(`/admin/users/${u.id}`, { method: "DELETE" });
    await fetchUsers();
    setActionId(null);
  };

  /* ── Login screen ── */
  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050510] relative overflow-hidden p-4">
        <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/8 rounded-full blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Card */}
          <div className="bg-black/60 border border-white/10 rounded-3xl p-7 backdrop-blur-xl shadow-2xl space-y-6">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-primary/30 shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                <img src={nexuraLogo} alt="NEXURA" className="w-full h-full object-cover" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-display font-bold text-white">Admin Panel</h1>
                <p className="text-xs text-white/30 mt-0.5 font-mono">NEXURA · PRIVATE ACCESS</p>
              </div>
            </div>

            {/* Restricted notice */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/20">
              <Shield className="w-4 h-4 text-accent flex-shrink-0" />
              <p className="text-xs text-white/60">Restricted to authorised admin only</p>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="Admin email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary/50 text-white text-sm placeholder:text-white/20 focus:outline-none transition-colors"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                <input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={e => { setPw(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="Password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary/50 text-white text-sm placeholder:text-white/20 focus:outline-none transition-colors"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2.5"
                  >
                    <XCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleLogin}
                disabled={!email || !pw}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
              >
                <LogIn className="w-4 h-4" /> Sign In to Admin
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Dashboard ── */
  const totalUsers    = users.length;
  const premiumUsers  = users.filter(u => u.isPremium).length;
  const blockedUsers  = users.filter(u => u.isBlocked).length;

  return (
    <div className="min-h-screen bg-[#050510] text-white relative">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_15px_rgba(0,212,255,0.3)]">
              <img src={nexuraLogo} alt="NEXURA" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold" style={{ textShadow: "0 0 10px rgba(0,212,255,0.5)" }}>
                Admin Dashboard
              </h1>
              <p className="text-xs text-white/35 font-mono">
                Signed in as <span className="text-primary/70">{ALLOWED_EMAIL}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => { setAuthed(false); setEmail(""); setPw(""); }}
            className="text-xs px-3 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Users",    value: totalUsers,   color: "#00D4FF", icon: Users },
            { label: "Premium Active", value: premiumUsers, color: "#F59E0B", icon: Crown },
            { label: "Blocked",        value: blockedUsers, color: "#EF4444", icon: Ban },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <Icon className="w-5 h-5 mx-auto mb-2 opacity-60" style={{ color }} />
              <p className="text-2xl font-display font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-white/35 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <TabButton label="Users" active={tab === "users"} onClick={() => setTab("users")} count={totalUsers} />
          <TabButton label="Payments" active={tab === "payments"} onClick={() => setTab("payments")} />
        </div>

        {/* Users tab */}
        {tab === "users" && (
          <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">All Users</span>
                <span className="text-xs text-white/30">({totalUsers})</span>
              </div>
              <button
                onClick={fetchUsers}
                disabled={usersLoading}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {usersLoading ? (
              <div className="p-12 text-center text-white/30">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-white/30">No users registered yet.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {users.map((u, i) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`px-5 py-4 flex items-center justify-between gap-4 flex-wrap ${u.isBlocked ? "opacity-50" : ""}`}
                  >
                    {/* User info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 border ${
                        u.isAdmin
                          ? "bg-primary/20 border-primary/40 text-primary"
                          : u.isBlocked
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : u.isPremium
                              ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                              : "bg-white/5 border-white/10 text-white/60"
                      }`}>
                        {u.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-white truncate">{u.name}</span>
                          {u.isAdmin && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary">ADMIN</span>
                          )}
                          {u.isPremium && !u.isAdmin && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400">
                              <Crown className="w-2.5 h-2.5 inline mr-0.5" />PREMIUM
                            </span>
                          )}
                          {u.isBlocked && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400">BLOCKED</span>
                          )}
                        </div>
                        <p className="text-xs text-white/35 truncate">{u.email}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-white/20 font-mono">ID #{u.id}</span>
                          <span className="text-[10px] text-white/20">·</span>
                          <span className="text-[10px] text-white/20">{u.dailyChatCount} chats today</span>
                          <span className="text-[10px] text-white/20">·</span>
                          <span className="text-[10px] text-white/20">Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                        {u.isPremium && u.premiumExpiresAt && (
                          <p className="text-[10px] text-yellow-400/50 mt-0.5">
                            Premium expires: {new Date(u.premiumExpiresAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions — disabled for admin */}
                    {!u.isAdmin && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleBlock(u)}
                          disabled={actionId === u.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            u.isBlocked
                              ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                              : "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                          } disabled:opacity-50`}
                        >
                          {u.isBlocked
                            ? <><UserCheck className="w-3 h-3" /> Unblock</>
                            : <><Ban className="w-3 h-3" /> Block</>
                          }
                        </button>
                        <button
                          onClick={() => setConfirmDelete(u)}
                          disabled={actionId === u.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                    {u.isAdmin && (
                      <div className="flex items-center gap-1.5 text-xs text-primary/40 font-mono">
                        <Shield className="w-3 h-3" /> Protected
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payments tab */}
        {tab === "payments" && (
          <PaymentsPanel />
        )}
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0a1a] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-[0_0_40px_rgba(239,68,68,0.2)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Delete User?</p>
                  <p className="text-xs text-white/40">This cannot be undone</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-sm font-semibold text-white">{confirmDelete.name}</p>
                <p className="text-xs text-white/40">{confirmDelete.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
                >
                  Delete User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaymentsPanel() {
  const [payments, setPayments]   = useState<Array<{ id: number; utrNumber: string; status: string; approvedAt: string | null; expiresAt: string | null; createdAt: string }>>([]);
  const [loading, setLoading]     = useState(true);
  const [actionId, setActionId]   = useState<number | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const data = await adminFetch("/admin/payments");
    setPayments(Array.isArray(data) ? [...data].reverse() : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const act = async (id: number, action: "approve" | "reject") => {
    setActionId(id);
    await adminFetch(`/admin/payments/${id}/${action}`, { method: "POST" });
    await fetchPayments();
    setActionId(null);
  };

  const STATUS_STYLE: Record<string, string> = {
    pending:  "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    approved: "text-green-400 bg-green-400/10 border-green-400/30",
    rejected: "text-red-400 bg-red-400/10 border-red-400/30",
    expired:  "text-white/30 bg-white/5 border-white/10",
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Payment Submissions</span>
        </div>
        <button onClick={fetchPayments} disabled={loading} className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1">
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>
      {loading ? (
        <div className="p-12 text-center text-white/30"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Loading...</div>
      ) : payments.length === 0 ? (
        <div className="p-12 text-center text-white/30">No payments yet.</div>
      ) : (
        <div className="divide-y divide-white/5">
          {payments.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-mono font-bold text-sm">{p.utrNumber}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${STATUS_STYLE[p.status] ?? STATUS_STYLE.pending}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-white/30">Submitted: {new Date(p.createdAt).toLocaleString()}</p>
                {p.approvedAt && <p className="text-xs text-green-400/60">Approved: {new Date(p.approvedAt).toLocaleString()}</p>}
                {p.expiresAt  && <p className="text-xs text-yellow-400/50">Expires: {new Date(p.expiresAt).toLocaleString()}</p>}
              </div>
              {p.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => act(p.id, "approve")} disabled={actionId === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50">
                    <CheckCircle className="w-3 h-3" /> Approve
                  </button>
                  <button onClick={() => act(p.id, "reject")} disabled={actionId === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
