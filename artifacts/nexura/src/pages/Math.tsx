import React, { useState } from "react";
import { useSolveMath } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function MathSolver() {
  const [problem, setProblem] = useState("");
  const solveMath = useSolveMath();

  const handleSolve = () => {
    if (!problem.trim()) return;
    solveMath.mutate({ data: { problem } });
  };

  return (
    <div className="flex flex-col h-full relative overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold glow-text flex items-center gap-3">
            <Calculator className="w-8 h-8 text-primary" />
            Math Solver
          </h1>
          <p className="text-muted-foreground mt-2">Enter a mathematical equation or problem</p>
        </div>

        <div className="flex gap-4">
          <Input
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSolve()}
            placeholder="e.g. solve 2x + 5 = 15"
            className="text-lg py-6 bg-input/50 border-primary/30 glow-border"
          />
          <Button
            onClick={handleSolve}
            disabled={!problem.trim() || solveMath.isPending}
            className="h-auto px-8 bg-primary hover:bg-primary/80 text-black font-semibold text-lg"
          >
            {solveMath.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Solve"}
          </Button>
        </div>

        {solveMath.data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass border-primary/30">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Solution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Steps</h3>
                  <div className="space-y-3">
                    {solveMath.data.steps.map((step, i) => (
                      <div key={i} className="flex gap-4 p-3 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-primary/50 font-mono">{i + 1}.</span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border/50">
                  <h3 className="font-semibold text-muted-foreground uppercase tracking-wider text-xs mb-2">Final Answer</h3>
                  <p className="text-2xl font-bold text-white glow-text">{solveMath.data.answer}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
