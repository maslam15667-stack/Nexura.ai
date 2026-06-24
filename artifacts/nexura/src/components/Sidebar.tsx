import React from "react";
import { Link, useLocation } from "wouter";
import {
  MessageSquare, Home, Sparkles, Plus, Image as ImageIcon, Search,
  Calculator, Mic, CreditCard, Settings, TerminalSquare, Zap, Menu, X, User, Crown, Phone
} from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

const SIDEBAR_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/anime", label: "Anime Mode", icon: Sparkles },
  { href: "/math", label: "Math Solver", icon: Calculator },
  { href: "/search", label: "Web Search", icon: Search },
  { href: "/image", label: "Image Gen", icon: ImageIcon },
  { href: "/ai-call", label: "AI Call", icon: Phone },
  { href: "/voice", label: "Voice Chat", icon: Mic },
  { href: "/payment", label: "Premium ₹10", icon: Crown },
  { href: "/prompts", label: "Prompt Lab", icon: TerminalSquare },
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" className="glass border-primary/30" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      <AnimatePresence>
        {(isOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border flex flex-col ${isOpen ? "flex" : "hidden md:flex"}`}
          >
            <div className="p-4 pt-16 md:pt-4 border-b border-sidebar-border/50 flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary/20 border border-primary/50 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <span className="font-display font-bold text-xl tracking-wider glow-text text-white">NEXURA</span>
            </div>

            <ScrollArea className="flex-1 py-4">
              <div className="space-y-1 px-2">
                {SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-200 group ${
                          active
                            ? "bg-primary/10 text-primary border border-primary/30 glow-border"
                            : "text-sidebar-foreground hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? "text-primary" : "group-hover:text-primary transition-colors"}`} />
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-sidebar-border/50">
              <Link href="/chat">
                <Button className="w-full bg-primary hover:bg-primary/80 text-black font-semibold shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
