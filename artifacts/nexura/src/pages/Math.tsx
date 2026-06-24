import { useState, useRef, useEffect } from "react";
import { useSolveMath } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Calculator, Camera, Loader2, X, ScanLine,
  CheckCircle, Upload, RotateCcw, Lightbulb, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoBackground } from "@/components/LogoBackground";
import Tesseract from "tesseract.js";

/* ── helpers ── */
function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(",")[1] ?? "";
}

function ScanOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* dim surround */}
      <div className="absolute inset-0 bg-black/40" />
      {/* scan window */}
      <div className="relative w-[78%] h-44 z-10">
        {/* animated scan line */}
        <motion.div
          className="absolute inset-x-0 h-0.5 bg-primary/80 shadow-[0_0_8px_rgba(0,212,255,0.9)]"
          animate={{ top: ["10%", "90%", "10%"] }}
          transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
        />
        {/* corner marks */}
        {[
          "top-0 left-0 border-t-2 border-l-2",
          "top-0 right-0 border-t-2 border-r-2",
          "bottom-0 left-0 border-b-2 border-l-2",
          "bottom-0 right-0 border-b-2 border-r-2",
        ].map((cls, i) => (
          <div key={i} className={`absolute w-5 h-5 border-primary ${cls}`} />
        ))}
      </div>
      {/* label */}
      <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-primary/90 font-mono tracking-wider z-10">
        POINT AT QUESTION · TAP CAPTURE
      </p>
    </div>
  );
}

export default function MathSolver() {
  const [problem, setProblem]           = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera]     = useState(false);
  const [autoSolving, setAutoSolving]   = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);

  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const solveMath = useSolveMath();

  /* auto-solve immediately after image is captured */
  useEffect(() => {
    if (!capturedImage || !autoSolving) return;
    performOCR(capturedImage);
  }, [capturedImage, autoSolving]);

  const performOCR = async (base64Image: string) => {
    setOcrLoading(true);
    setOcrText("");
    try {
      const result = await Tesseract.recognize(
        `data:image/jpeg;base64,${base64Image}`,
        "eng"
      );
      const detectedText = result.data.text.trim();
      
      if (!detectedText) {
        setOcrText("No question detected. Upload clear image");
        setOcrLoading(false);
        return;
      }
      
      setOcrText(detectedText);
      solveMath.reset();
      setAutoSolving(false);
      
      // Auto-solve the detected question
      solveMath.mutate({
        data: { problem: detectedText },
      });
    } catch {
      setOcrText("Error reading image. Please try again.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSolveText = () => {
    if (!problem.trim()) return;
    solveMath.reset();
    solveMath.mutate({ data: { problem } });
  };

  const openCamera = async () => {
    setShowCamera(true);
    solveMath.reset();
    setOcrText("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
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
    const base64 = dataUrlToBase64(canvas.toDataURL("image/jpeg", 0.92));
    setCapturedImage(base64);
    setAutoSolving(true);
    closeCamera();
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      alert("Please upload JPG/PNG");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrlToBase64(dataUrl);
      setCapturedImage(base64);
      setAutoSolving(true);
      solveMath.reset();
      setOcrText("");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearAll = () => {
    setCapturedImage(null);
    setProblem("");
    setOcrText("");
    solveMath.reset();
  };

  const isSolving = solveMath.isPending || ocrLoading;

  return (
    <div className="flex flex-col h-full relative overflow-y-auto">
      <LogoBackground />

      <div className="relative z-10 max-w-2xl mx-auto w-full px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30 shadow-[0_0_12px_rgba(0,212,255,0.2)]">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold glow-text">Math Doubt Solver</h1>
            <p className="text-xs text-muted-foreground">Upload photo · OCR detects · Auto solves</p>
          </div>
        </div>

        {/* Camera view */}
        <AnimatePresence>
          {showCamera && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative rounded-2xl overflow-hidden border border-primary/40 shadow-[0_0_20px_rgba(0,212,255,0.15)] bg-black"
            >
              <video ref={videoRef} autoPlay playsInline className="w-full aspect-video object-cover" />
              <ScanOverlay />
              <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3 z-20">
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-white border-4 border-primary shadow-[0_0_20px_rgba(0,212,255,0.7)] hover:scale-105 transition-transform flex items-center justify-center"
                >
                  <Camera className="w-7 h-7 text-primary" />
                </button>
                <button
                  onClick={closeCamera}
                  className="self-end mb-1 px-4 py-2 rounded-full bg-black/60 border border-red-400/40 text-red-400 text-sm hover:bg-red-400/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <canvas ref={canvasRef} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

        {/* Captured image preview */}
        <AnimatePresence>
          {capturedImage && !showCamera && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative rounded-2xl overflow-hidden border border-primary/30 bg-black"
            >
              <img
                src={`data:image/jpeg;base64,${capturedImage}`}
                alt="Captured math problem"
                className="w-full max-h-56 object-contain"
              />
              {/* status overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 flex items-center justify-between">
                {isSolving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs text-primary font-semibold">Reading question from photo...</span>
                  </div>
                ) : solveMath.data ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400 font-semibold">Question detected & solved!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ScanLine className="w-4 h-4 text-primary" />
                    <span className="text-xs text-primary">Photo ready</span>
                  </div>
                )}
                <button onClick={clearAll} className="text-white/50 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detected question from OCR */}
        <AnimatePresence>
          {ocrText && !isSolving && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4"
            >
              <div className="flex items-start gap-2">
                <ScanLine className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-yellow-400/70 font-semibold mb-1">Detected Question:</p>
                  <p className="text-sm text-white leading-relaxed">{ocrText}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area — only shown when no camera */}
        {!showCamera && (
          <div className="space-y-3">
            {!capturedImage && (
              <Textarea
                value={problem}
                onChange={e => setProblem(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleSolveText(); }}
                placeholder="Type any math problem… e.g. 2x + 5 = 15, integrate x², find area of circle r=7…"
                className="text-sm bg-input/50 border-primary/30 glow-border rounded-xl resize-none min-h-[90px] placeholder:text-white/20"
              />
            )}

            <div className="flex gap-2">
              {/* Solve text button — only shown when no image */}
              {!capturedImage && (
                <Button
                  onClick={handleSolveText}
                  disabled={!problem.trim() || isSolving}
                  className="flex-1 bg-primary hover:bg-primary/80 text-black font-bold py-6 text-sm"
                >
                  {isSolving
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Solving...</>
                    : <><Calculator className="w-4 h-4 mr-2" /> Solve Step by Step</>
                  }
                </Button>
              )}

              {/* Re-solve button when image present but already solved */}
              {capturedImage && !isSolving && (
                <Button
                  onClick={() => performOCR(capturedImage)}
                  className="flex-1 bg-primary hover:bg-primary/80 text-black font-bold py-5 text-sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Re-scan
                </Button>
              )}

              {/* Camera */}
              <Button
                onClick={openCamera}
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10 py-6 px-5"
                title="Take photo of problem"
              >
                <Camera className="w-5 h-5" />
              </Button>

              {/* Upload from gallery */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="border-white/15 text-white/50 hover:bg-white/5 py-6 px-4"
                title="Upload image from gallery"
              >
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Solving skeleton */}
        <AnimatePresence>
          {isSolving && !capturedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl border border-primary/20 p-5 space-y-3"
            >
              {[80, 60, 90, 50].map((w, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-5 h-5 rounded-full bg-primary/20 animate-pulse flex-shrink-0" />
                  <div className={`h-3 rounded-full bg-white/10 animate-pulse`} style={{ width: `${w}%` }} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Solution */}
        <AnimatePresence>
          {solveMath.data && !isSolving && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Steps */}
              <div className="glass rounded-2xl border border-primary/25 overflow-hidden">
                <div className="bg-primary/10 px-5 py-3.5 border-b border-primary/20 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <h2 className="text-sm font-bold text-white">Step-by-Step Solution</h2>
                  <span className="ml-auto text-xs text-primary/50 font-mono">{solveMath.data.steps.length} steps</span>
                </div>
                <div className="p-4 space-y-2.5">
                  {solveMath.data.steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex gap-3 p-3 rounded-xl bg-black/40 border border-white/5 group hover:border-primary/20 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-white/85">{step}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Final answer */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-green-500/40 bg-green-500/10 overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-green-500/20 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <h2 className="text-sm font-bold text-green-400">Final Answer</h2>
                </div>
                <div className="px-5 py-4 flex items-center gap-3">
                  <ChevronRight className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <p className="text-xl font-display font-bold text-white" style={{ textShadow: "0 0 12px rgba(74,222,128,0.5)" }}>
                    {solveMath.data.answer}
                  </p>
                </div>
                {solveMath.data.latex && (
                  <div className="px-5 pb-4">
                    <p className="text-xs font-mono text-green-400/50 bg-black/30 rounded-lg px-3 py-2">{solveMath.data.latex}</p>
                  </div>
                )}
              </motion.div>

              {/* Solve another */}
              <button
                onClick={clearAll}
                className="w-full text-xs text-white/30 hover:text-white/60 transition-colors py-2 font-mono"
              >
                ← Solve another problem
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
