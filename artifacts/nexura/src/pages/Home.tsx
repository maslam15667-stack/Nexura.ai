import React from "react";
import { motion } from "framer-motion";
import nexuraLogo from "@assets/ChatGPT_Image_Jun_11,_2026,_09_45_11_AM_1781152668994.png";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative p-4">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/20 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          animate={{
            filter: [
              "drop-shadow(0 0 15px rgba(0,212,255,0.4))",
              "drop-shadow(0 0 30px rgba(0,212,255,0.8))",
              "drop-shadow(0 0 15px rgba(0,212,255,0.4))",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src={nexuraLogo}
            alt="NEXURA Logo"
            className="w-[35vw] max-w-[280px] object-contain"
          />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 text-xl md:text-2xl font-display font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-wider text-center"
        >
          Your Next Gen AI Companion
        </motion.h2>
      </motion.div>
    </div>
  );
}
