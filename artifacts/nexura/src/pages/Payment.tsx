import React, { useState } from "react";
import { useSubmitPayment, useGetPaymentStatus, getGetPaymentStatusQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, QrCode, CheckCircle, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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
    <div className="flex flex-col items-center justify-center h-full relative overflow-y-auto p-4 md:p-8">
      <div className="max-w-md w-full">
        <Card className="glass border-primary/30 glow-border text-center overflow-hidden">
          <div className="bg-primary/10 py-6 border-b border-primary/20">
            <CreditCard className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-3xl font-display glow-text">NEXURA Premium</CardTitle>
            <CardDescription className="text-lg mt-2 text-primary/80">₹10 Daily Pass</CardDescription>
          </div>
          
          <CardContent className="p-8 space-y-8">
            {status === "approved" ? (
              <div className="space-y-4 py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-2xl font-bold text-green-500">Access Granted</h3>
                <p className="text-muted-foreground">Your daily pass is active.</p>
              </div>
            ) : status === "pending" ? (
              <div className="space-y-4 py-8">
                <Clock className="w-16 h-16 text-yellow-500 mx-auto animate-pulse" />
                <h3 className="text-2xl font-bold text-yellow-500">Verification Pending</h3>
                <p className="text-muted-foreground">Admin is reviewing your UTR number.</p>
              </div>
            ) : (
              <>
                <div className="aspect-square max-w-[200px] mx-auto bg-white rounded-xl p-4 flex items-center justify-center relative">
                  {/* Placeholder for QR Code */}
                  <QrCode className="w-full h-full text-black opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-black text-xl">
                    SCAN QR
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-medium text-muted-foreground">UTR Reference Number</label>
                    <Input
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="Enter 12-digit UTR..."
                      className="bg-black/40 border-primary/30 text-center tracking-widest text-lg"
                    />
                  </div>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!utr.trim() || submitPayment.isPending}
                    className="w-full bg-primary hover:bg-primary/80 text-black font-bold py-6 text-lg"
                  >
                    Submit Payment
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
