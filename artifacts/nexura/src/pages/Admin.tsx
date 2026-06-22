import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, LogIn, Mail, Lock, XCircle, Users, Crown,
  Trash2, Ban, CheckCircle, RefreshCw, UserCheck,
  AlertTriangle, Eye, EyeOff, Bell, BellRing, UserPlus,
  Sparkles, Clock, MarkAsUnread
} from "lucide-react";
import nexuraLogo from "@assets/ChatGPT_Image_Jun_11,_2026,_09_45_11_AM_1781152668994.png";

const BASE          = import.meta.env.BASE_URL.replace(/\/$/, "");
const ALLOWED_EMAIL = "maslam15667@gmail.com";
const ADMIN_KEY     = "nexura-admin-2024";
const POLL_MS       = 15000;

type AdminUser = {
  id: number; name: string; email: string;
  isPremium: boolean; premiumExpiresAt: string | null;
  isBlocked: boolean; isAdmin: boolean;
  dailyChatCount: number; lastChatDate: string; createdAt: string;
};

type Notification = {
  id: number; type: string; title: string; body: string;
  isRead: boolean; createdAt: string;
};

type Payment = {
  id: number; utrNumber: string; status: string;
  approvedAt: string | null; expiresAt: string | null; createdAt: string;
};

function adminFetch(path: string, opts?: RequestInit) {
  return fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: { "x-admin-key": ADMIN_KEY, "Content-Type": "application/json", ...opts?.headers },
  }).then(r => r.json());
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── Notification bell button ── */
function NotifBell({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
    >
      {count > 0
        ? <BellRing className="w-4 h-4 text-yellow-400 animate-[wiggle_0.5s_ease-in-out_infinite]" />
        : <Bell className="w-4 h-4 text-white/40" />
      }
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1 shadow-[0_0_8px_rgba(239,68,68,0.6)]">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

/* ── Notifications drawer ── */
function NotifsDrawer({
  notifs, onClose, onReadAll, onRead,
}: {
  notifs: Notification[];
  onClose: () => void;
  onReadAll: () => void;
  onRead: (id: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ type: "spring", bounce: 0, duration: 0.35 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm h-full bg-[#070712] border-l border-white/10 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold text-white text-sm">Notifications</span>
            <span className="text-xs text-white/30">({notifs.filter(n => !n.isRead).length} unread)</span>
          </div>
          <button
            onClick={onReadAll}
            className="text-xs text-primary/60 hover:text-primary transition-colors"
          >
            Mark all read
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-white/20">
              <Bell className="w-8 h-8" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifs.map(n => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`px-5 py-4 cursor-pointer transition-colors ${n.isRead ? "opacity-50" : "hover:bg-white/5"}`}
                  onClick={() => !n.isRead && onRead(n.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                      n.type === "premium"
                        ? "bg-yellow-500/20 border-yellow-500/30"
                        : "bg-primary/20 border-primary/30"
                    }`}>
                      {n.type === "premium"
                        ? <Crown className="w-4 h-4 text-yellow-400" />
                        : <UserPlus className="w-4 h-4 text-primary" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-semibold ${n.isRead ? "text-white/40" : "text-white"}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 shadow-[0_0_6px_rgba(0,212,255,0.8)]" />
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-white/20 mt-1 font-mono">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Payments panel ── */
function PaymentsPanel() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const data = await adminFetch("/admin/payments") as Payment[];
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
          {payments.map(p => (
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

/* ══════════════════════════════════════ Main component ══════════════════════════════════════ */
export default function Admin() {
  const [authed, setAuthed]   = useState(false);
  const [email, setEmail]     = useState("");
  const [pw, setPw]           = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loginErr, setLoginErr] = useState("");

  const [tab, setTab]         = useState<"users" | "payments">("users");
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

  const [notifs, setNotifs]       = useState<Notification[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    const data = await adminFetch("/admin/users") as AdminUser[];
    setUsers(Array.isArray(data) ? data : []);
    setUsersLoading(false);
  }, []);

  const fetchNotifs = useCallback(async () => {
    const data = await adminFetch("/admin/notifications") as Notification[];
    setNotifs(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchUsers();
    fetchNotifs();
    pollRef.current = setInterval(fetchNotifs, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [authed, fetchUsers, fetchNotifs]);

  const handleLogin = () => {
    setLoginErr("");
    if (email.trim().toLowerCase() !== ALLOWED_EMAIL) { setLoginErr("Access denied. This email is not authorised."); return; }
    if (pw !== ADMIN_KEY) { setLoginErr("Incorrect password."); return; }
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

  const handleReadAll = async () => {
    await adminFetch("/admin/notifications/read-all", { method: "POST" });
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleRead = async (id: number) => {
    await adminFetch(`/admin/notifications/${id}/read`, { method: "POST" });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const unreadCount = notifs.filter(n => !n.isRead).length;

  /* ── Login screen ── */
  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050510] relative overflow-hidden p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/8 rounded-full blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-sm">
          <div className="bg-black/60 border border-white/10 rounded-3xl p-7 backdrop-blur-xl shadow-2xl space-y-5">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-primary/30 shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                <img src={nexuraLogo} alt="NEXURA" className="w-full h-full object-cover" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-display font-bold text-white">Admin Panel</h1>
                <p className="text-xs text-white/30 mt-0.5 font-mono">NEXURA · PRIVATE ACCESS</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/20">
              <Shield className="w-4 h-4 text-accent flex-shrink-0" />
              <p className="text-xs text-white/60">Restricted to authorised admin only</p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setLoginErr(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Admin email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary/50 text-white text-sm placeholder:text-white/20 focus:outline-none transition-colors" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                <input type={showPw ? "text" : "password"} value={pw} onChange={e => { setPw(e.target.value); setLoginErr(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary/50 text-white text-sm placeholder:text-white/20 focus:outline-none transition-colors" />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <AnimatePresence>
                {loginErr && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2.5">
                    <XCircle className="w-3.5 h-3.5 flex-shrink-0" /> {loginErr}
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={handleLogin} disabled={!email || !pw}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                <LogIn className="w-4 h-4" /> Sign In to Admin
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Dashboard ── */
  const totalUsers   = users.length;
  const premiumUsers = users.filter(u => u.isPremium).length;
  const blockedUsers = users.filter(u => u.isBlocked).length;

  return (
    <div className="min-h-screen bg-[#050510] text-white relative">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_15px_rgba(0,212,255,0.3)]">
              <img src={nexuraLogo} alt="NEXURA" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold" style={{ textShadow: "0 0 10px rgba(0,212,255,0.5)" }}>Admin Dashboard</h1>
              <p className="text-xs text-white/35 font-mono">Signed in as <span className="text-primary/70">{ALLOWED_EMAIL}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotifBell count={unreadCount} onClick={() => setDrawerOpen(true)} />
            <button onClick={() => { setAuthed(false); setEmail(""); setPw(""); }}
              className="text-xs px-3 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
              Sign Out
            </button>
          </div>
        </div>

        {/* Recent notification strip */}
        {notifs.find(n => !n.isRead) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer ${
              notifs.find(n => !n.isRead)?.type === "premium"
                ? "bg-yellow-500/10 border-yellow-500/30"
                : "bg-primary/10 border-primary/30"
            }`}
            onClick={() => setDrawerOpen(true)}
          >
            {notifs.find(n => !n.isRead)?.type === "premium"
              ? <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              : <UserPlus className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{notifs.find(n => !n.isRead)?.title}</p>
              <p className="text-xs text-white/40 truncate">{notifs.find(n => !n.isRead)?.body}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-white/30">{timeAgo(notifs.find(n => !n.isRead)!.createdAt)}</span>
              {unreadCount > 1 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10 text-white/40">+{unreadCount - 1} more</span>
              )}
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Users",    value: totalUsers,   color: "#00D4FF", Icon: Users },
            { label: "Premium Active", value: premiumUsers, color: "#F59E0B", Icon: Crown },
            { label: "Blocked",        value: blockedUsers, color: "#EF4444", Icon: Ban },
          ].map(({ label, value, color, Icon }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <Icon className="w-5 h-5 mx-auto mb-2 opacity-60" style={{ color }} />
              <p className="text-2xl font-display font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-white/35 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["users", "payments"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
                tab === t ? "bg-primary/20 border border-primary/40 text-primary" : "text-white/40 hover:text-white/70"
              }`}
            >
              {t === "users" ? `Users (${totalUsers})` : "Payments"}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === "users" && (
          <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">All Users</span>
              </div>
              <button onClick={fetchUsers} disabled={usersLoading}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>

            {usersLoading ? (
              <div className="p-12 text-center text-white/30"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-white/30">No users registered yet.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {users.map((u, i) => (
                  <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className={`px-5 py-4 flex items-center justify-between gap-4 flex-wrap ${u.isBlocked ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 border ${
                        u.isAdmin ? "bg-primary/20 border-primary/40 text-primary"
                          : u.isBlocked ? "bg-red-500/10 border-red-500/20 text-red-400"
                          : u.isPremium ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                          : "bg-white/5 border-white/10 text-white/60"
                      }`}>
                        {u.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-white">{u.name}</span>
                          {u.isAdmin    && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary">ADMIN</span>}
                          {u.isPremium && !u.isAdmin && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400"><Crown className="w-2.5 h-2.5 inline mr-0.5" />PREMIUM</span>}
                          {u.isBlocked  && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400">BLOCKED</span>}
                        </div>
                        <p className="text-xs text-white/35 truncate">{u.email}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-white/20 font-mono">#{u.id}</span>
                          <span className="text-[10px] text-white/15">·</span>
                          <span className="text-[10px] text-white/20">{u.dailyChatCount} chats today</span>
                          <span className="text-[10px] text-white/15">·</span>
                          <span className="text-[10px] text-white/20">Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                        {u.isPremium && u.premiumExpiresAt && (
                          <p className="text-[10px] text-yellow-400/50 mt-0.5">Premium expires: {new Date(u.premiumExpiresAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    {!u.isAdmin ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleBlock(u)} disabled={actionId === u.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border disabled:opacity-50 ${
                            u.isBlocked
                              ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                              : "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                          }`}>
                          {u.isBlocked ? <><UserCheck className="w-3 h-3" /> Unblock</> : <><Ban className="w-3 h-3" /> Block</>}
                        </button>
                        <button onClick={() => setConfirmDelete(u)} disabled={actionId === u.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    ) : (
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

        {tab === "payments" && <PaymentsPanel />}

        {/* Live indicator */}
        <p className="text-center text-xs text-white/15 font-mono">
          Live · Refreshes every {POLL_MS / 1000}s · NEXURA Admin
        </p>
      </div>

      {/* Notifications drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <NotifsDrawer
            notifs={notifs}
            onClose={() => setDrawerOpen(false)}
            onReadAll={handleReadAll}
            onRead={handleRead}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0a1a] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
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
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">
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
