import { useState, useRef } from "react";
import { useSolveMath } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, Camera, Loader2, X, Image } from "lucide-react";
import { motion } from "framer-motion";
import { LogoBackground } from "@/components/LogoBackground";

export default function MathSolver() {
  const [problem, setProblem] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const solveMath = useSolveMath();

  const handleSolve = () => {
    const payload = capturedImage
      ? { problem: problem || "Solve this math problem from the image", imageBase64: capturedImage }
      : { problem };
    if (!payload.problem && !capturedImage) return;
    solveMath.mutate({ data: payload });
  };

  const openCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setShowCamera(false);
      alert("Camera not available or permission denied.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const base64  = dataUrl.split(",")[1];
    setCapturedImage(base64);
    closeCamera();
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  };

  const clearImage = () => {
    setCapturedImage(null);
    solveMath.reset();
  };

  const canSolve = (problem.trim() || !!capturedImage) && !solveMath.isPending;

  return (
    <div className="flex flex-col h-full relative overflow-y-auto p-4 md:p-8">
      <LogoBackground />

      <div className="relative z-10 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold glow-text">Math Solver</h1>
            <p className="text-muted-foreground text-sm">Type a problem or take a photo</p>
          </div>
        </div>

        {/* Camera view */}
        {showCamera && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative glass rounded-2xl overflow-hidden border border-primary/30"
          >
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <Button
                onClick={capturePhoto}
                data-testid="button-capture-photo"
                className="bg-primary hover:bg-primary/80 text-black font-bold px-8 py-3 rounded-full shadow-[0_0_20px_rgba(0,212,255,0.6)]"
              >
                <Image className="w-5 h-5 mr-2" />
                Capture
              </Button>
              <Button
                variant="outline"
                onClick={closeCamera}
                className="border-red-400/50 text-red-400 hover:bg-red-400/10 rounded-full px-6"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* Captured image preview */}
        {capturedImage && !showCamera && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative glass rounded-2xl overflow-hidden border border-primary/30"
          >
            <img
              src={`data:image/jpeg;base64,${capturedImage}`}
              alt="Captured math problem"
              className="w-full max-h-64 object-contain rounded-2xl"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1.5 transition-all"
              data-testid="button-clear-image"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 bg-black/60 rounded-lg px-2 py-1">
              <p className="text-xs text-primary">Photo captured — ready to solve</p>
            </div>
          </motion.div>
        )}

        {/* Input row */}
        {!showCamera && (
          <div className="space-y-3">
            <Textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder={capturedImage ? "Optional: describe the problem or leave blank..." : "e.g. solve 2x + 5 = 15, or integrate x² dx..."}
              data-testid="input-math-problem"
              className="text-base bg-input/50 border-primary/30 glow-border rounded-xl resize-none min-h-[80px]"
            />
            <div className="flex gap-3">
              <Button
                onClick={handleSolve}
                disabled={!canSolve}
                data-testid="button-solve-math"
                className="flex-1 bg-primary hover:bg-primary/80 text-black font-bold py-6 text-base"
              >
                {solveMath.isPending ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Solving...</>
                ) : (
                  <><Calculator className="w-5 h-5 mr-2" /> Solve Step by Step</>
                )}
              </Button>
              <Button
                onClick={openCamera}
                variant="outline"
                data-testid="button-open-camera"
                className="border-primary/30 text-primary hover:bg-primary/10 py-6 px-5"
                title="Take photo of problem"
              >
                <Camera className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Solution */}
        {solveMath.data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass rounded-2xl border border-primary/30 overflow-hidden">
              <div className="bg-primary/10 px-6 py-4 border-b border-primary/20">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                  <Calculator className="w-5 h-5" /> Solution
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Steps</h3>
                  {solveMath.data.steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-4 p-3 rounded-xl bg-black/40 border border-white/5"
                    >
                      <span className="text-primary/60 font-mono text-sm shrink-0">{i + 1}.</span>
                      <p className="text-sm leading-relaxed">{step}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="pt-4 border-t border-border/30">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Answer</h3>
                  <p className="text-2xl font-bold text-white glow-text">{solveMath.data.answer}</p>
                  {solveMath.data.latex && (
                    <p className="text-sm text-muted-foreground mt-2 font-mono">{solveMath.data.latex}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
