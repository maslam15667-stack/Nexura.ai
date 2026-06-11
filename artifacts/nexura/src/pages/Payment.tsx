import { useState } from "react";
import { useSubmitPayment, useGetPaymentStatus, getGetPaymentStatusQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { LogoBackground } from "@/components/LogoBackground";
import { motion } from "framer-motion";

const UPI_ID = "maslam15667@okaxis";
const UPI_NAME = "Mohammed Aslam";
const UPI_URI = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=10&cu=INR&tn=${encodeURIComponent("NEXURA Daily Pass")}`;

export default function Payment() {
  const [utr, setUtr] = useState("");
  const queryClient = useQueryClient();
  const submitPayment = useSubmitPayment();
  const { data: statusData } = useGetPaymentStatus({
    query: { queryKey: getGetPaymentStatusQueryKey() }
  });

  const handleSubmit = () => {
    if (!utr.trim()) return;
    submitPayment.mutate({ data: { utrNumber: utr } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPaymentStatusQueryKey() });
        setUtr("");
      }
    });
  };

  const status = statusData?.status || "none";

  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-y-auto p-4">
      <LogoBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-display font-bold glow-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            NEXURA Premium
          </h1>
          <p className="text-muted-foreground mt-1">Unlock unlimited AI access</p>
        </div>

        <div className="glass rounded-2xl border border-primary/30 glow-border overflow-hidden">
          {/* Price badge */}
          <div className="bg-gradient-to-r from-primary/20 to-accent/20 px-6 py-4 border-b border-primary/20 text-center">
            <span className="text-4xl font-display font-bold text-white">₹10</span>
            <span className="text-muted-foreground ml-2">/ Day</span>
          </div>

          <div className="p-6 space-y-6">
            {status === "approved" ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                <h3 className="text-xl font-bold text-green-400">Access Granted!</h3>
                <p className="text-muted-foreground text-sm">Your daily pass is active.</p>
                {statusData?.expiresAt && (
                  <p className="text-xs text-muted-foreground">
                    Expires: {new Date(statusData.expiresAt).toLocaleString()}
                  </p>
                )}
              </div>
            ) : status === "pending" ? (
              <div className="text-center space-y-3 py-4">
                <Clock className="w-16 h-16 text-yellow-400 mx-auto animate-pulse" />
                <h3 className="text-xl font-bold text-yellow-400">Pending Approval</h3>
                <p className="text-muted-foreground text-sm">Admin is verifying your payment.</p>
                <p className="text-xs text-muted-foreground">UTR: {statusData?.utrNumber}</p>
              </div>
            ) : status === "expired" ? (
              <div className="text-center space-y-3 py-4">
                <XCircle className="w-16 h-16 text-red-400 mx-auto" />
                <h3 className="text-xl font-bold text-red-400">Pass Expired</h3>
                <p className="text-muted-foreground text-sm">Scan again to renew your daily pass.</p>
              </div>
            ) : (
              <>
                {/* QR Code — actual image centred */}
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Scan to Pay ₹10</p>

                  <a href={UPI_URI} className="block">
                    <div className="bg-white rounded-2xl p-3 shadow-[0_0_30px_rgba(0,212,255,0.3)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)] transition-shadow">
                      <img
                        src="/upi-qr.jpeg"
                        alt="UPI QR Code — Mohammed Aslam"
                        className="w-52 h-52 object-contain rounded-xl"
                        data-testid="img-upi-qr"
                      />
                    </div>
                  </a>

                  <div className="text-center">
                    <p className="text-primary font-mono font-bold text-xl">₹10.00</p>
                    <p className="text-xs text-muted-foreground">NEXURA Daily Pass</p>
                    <p className="text-xs text-muted-foreground mt-0.5">UPI: {UPI_ID}</p>
                  </div>

                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-black font-bold py-5 text-base"
                  >
                    <a href={UPI_URI} data-testid="button-pay-upi">
                      Pay ₹10 Now
                    </a>
                  </Button>
                </div>

                <div className="border-t border-border/40 pt-5 space-y-3">
                  <p className="text-xs text-center text-muted-foreground">
                    After payment, enter your UTR reference number
                  </p>
                  <Input
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    placeholder="Enter UTR / Transaction ID..."
                    data-testid="input-utr"
                    className="bg-black/40 border-primary/30 text-center tracking-widest"
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={!utr.trim() || submitPayment.isPending}
                    data-testid="button-submit-utr"
                    className="w-full border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-semibold"
                  >
                    {submitPayment.isPending ? "Submitting..." : "Submit for Approval"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Admin will verify and activate your 24-hour pass
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
