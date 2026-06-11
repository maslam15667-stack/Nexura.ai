import React from "react";
import { Sidebar } from "./Sidebar";
import { Link, useLocation } from "wouter";
import { Home, MessageSquare, Mic, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30 text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col relative min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-full h-full flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border/50 glass z-50 flex items-center justify-around px-4">
          <MobileNavLink href="/" icon={<Home className="w-5 h-5" />} active={location === "/"} />
          <MobileNavLink href="/chat" icon={<MessageSquare className="w-5 h-5" />} active={location === "/chat"} />
          <MobileNavLink href="/voice" icon={<Mic className="w-5 h-5" />} active={location === "/voice"} />
          <MobileNavLink href="/settings" icon={<User className="w-5 h-5" />} active={location === "/settings"} />
        </div>
      </main>
    </div>
  );
}

function MobileNavLink({ href, icon, active }: { href: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link href={href}>
      <div className={`p-3 rounded-full flex items-center justify-center transition-all ${
        active ? "bg-primary/20 text-primary glow-text" : "text-muted-foreground"
      }`}>
        {icon}
      </div>
    </Link>
  );
}
