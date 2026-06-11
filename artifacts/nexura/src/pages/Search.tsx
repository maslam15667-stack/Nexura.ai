import React, { useState } from "react";
import { useWebSearch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search as SearchIcon, Loader2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function Search() {
  const [query, setQuery] = useState("");
  const webSearch = useWebSearch();

  const handleSearch = () => {
    if (!query.trim()) return;
    webSearch.mutate({ data: { query } });
  };

  return (
    <div className="flex flex-col h-full relative overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold glow-text inline-flex items-center gap-3">
            <SearchIcon className="w-10 h-10 text-primary" />
            Web Search
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">Query the global network</p>
        </div>

        <div className="relative max-w-2xl mx-auto">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter search query..."
            className="text-lg py-8 pl-6 pr-16 bg-input/50 border-primary/50 glow-border rounded-full shadow-2xl"
          />
          <Button
            size="icon"
            onClick={handleSearch}
            disabled={!query.trim() || webSearch.isPending}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-primary hover:bg-primary/80 text-black"
          >
            {webSearch.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <SearchIcon className="w-5 h-5" />}
          </Button>
        </div>

        <div className="space-y-4 mt-12">
          {webSearch.data?.results.map((result, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="block group">
                <Card className="glass border-border/50 group-hover:border-primary/50 transition-colors">
                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold text-primary group-hover:underline flex items-center gap-2">
                      {result.title}
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-green-400/70 mt-1 mb-3 font-mono truncate">{result.url}</p>
                    <p className="text-muted-foreground leading-relaxed">{result.snippet}</p>
                  </CardContent>
                </Card>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
