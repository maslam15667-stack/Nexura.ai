import React, { useState } from "react";
import { useWebSearch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, ExternalLink, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { LogoBackground } from "@/components/LogoBackground";
import nexuraLogo from "@assets/ChatGPT_Image_Jun_11,_2026,_09_45_11_AM_1781152668994.png";

export default function Search() {
  const [query, setQuery] = useState("");
  const webSearch = useWebSearch();

  const handleSearch = () => {
    if (!query.trim()) return;
    webSearch.mutate({ data: { query } });
  };

  return (
    <div className="flex flex-col h-full relative overflow-y-auto">
      <LogoBackground />

      <div className="relative z-10 flex flex-col h-full">
        {/* Main content area */}
        {!webSearch.data ? (
          /* Search home screen */
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
            <div className="max-w-2xl w-full space-y-8">
              {/* Logo and branding */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden">
                    <img src={nexuraLogo} alt="Nexura" className="w-10 h-10 object-contain" />
                  </div>
                  <h1 className="text-3xl font-display font-bold glow-text">NEXURA</h1>
                </div>
                <p className="text-muted-foreground text-base">Web Search powered by AI</p>
              </motion.div>

              {/* Search bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative max-w-2xl mx-auto w-full"
              >
                <div className="relative rounded-full border border-white/20 bg-white/5 hover:bg-white/10 hover:border-primary/40 transition-all shadow-lg focus-within:shadow-[0_0_30px_rgba(0,212,255,0.2)] focus-within:border-primary/60">
                  <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search the web..."
                    className="pl-14 pr-6 py-4 text-base bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-white/40"
                  />
                </div>
              </motion.div>

              {/* Search buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3 justify-center flex-wrap"
              >
                <Button
                  onClick={handleSearch}
                  disabled={!query.trim() || webSearch.isPending}
                  className="bg-primary hover:bg-primary/80 text-black font-semibold px-8 py-5 rounded-full text-base shadow-lg"
                >
                  {webSearch.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <SearchIcon className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setQuery("")}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5 px-8 py-5 rounded-full text-base"
                  disabled={!query}
                >
                  Clear
                </Button>
              </motion.div>

              {/* Quick search suggestions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center space-y-3"
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Trending searches</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["AI news", "web3 updates", "tech trends", "latest AI models"].map((term, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuery(term);
                        webSearch.mutate({ data: { query: term } });
                      }}
                      className="px-4 py-2 rounded-full text-xs font-medium text-muted-foreground hover:text-white bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/30 transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* Results screen */
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Results header */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-1">Search results for:</p>
                    <h2 className="text-2xl font-bold text-white truncate">{query}</h2>
                  </div>
                  <button
                    onClick={() => setQuery("")}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all"
                  >
                    New Search
                  </button>
                </div>
              </motion.div>

              {/* Results list */}
              <div className="space-y-4">
                {webSearch.data?.results.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg">No results found for "{query}"</p>
                    <p className="text-sm mt-1">Try different keywords</p>
                  </motion.div>
                ) : (
                  webSearch.data?.results.map((result, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <Card className="glass border-white/10 group-hover:border-primary/40 transition-all group-hover:shadow-[0_0_20px_rgba(0,212,255,0.1)]">
                          <CardContent className="p-4 md:p-5">
                            <p className="text-xs text-muted-foreground font-mono mb-1 flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {result.url.split("/")[2]}
                            </p>
                            <h3 className="text-lg font-bold text-primary group-hover:underline flex items-center gap-2 mb-2">
                              {result.title}
                              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{result.snippet}</p>
                          </CardContent>
                        </Card>
                      </a>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Loading state */}
              {webSearch.isPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-8"
                >
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="ml-3 text-muted-foreground">Searching the web...</span>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
