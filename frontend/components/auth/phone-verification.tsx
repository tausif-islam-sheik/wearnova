"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";

const RESEND_DELAY_SECONDS = 60;

export function PhoneVerification({
  email,
  phoneMasked: initialPhoneMasked,
  onVerified,
}: {
  email: string;
  phoneMasked?: string;
  onVerified: () => void;
}) {
  const verifyPhone = useAuthStore((s) => s.verifyPhone);
  const resendOtp = useAuthStore((s) => s.resendOtp);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_DELAY_SECONDS);
  const [phoneMasked, setPhoneMasked] = useState(initialPhoneMasked ?? "");

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    setError(null);
    try {
      const res = await resendOtp(email);
      setPhoneMasked(res.phoneMasked);
      setCountdown(RESEND_DELAY_SECONDS);
      setOtp("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to resend code");
    }
    setResending(false);
  };

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verifyPhone(email, otp);
      onVerified();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed");
      setOtp("");
    }
    setLoading(false);
  };

  return (
    <div className="text-center">
      <ShieldCheck className="mx-auto size-7 text-brand-primary mb-2" />
      <h3 className="text-lg font-semibold">Verify your phone number</h3>
      <p className="mt-1 text-sm text-foreground-muted">
        We sent a 6-digit code to {phoneMasked || "your phone"}. Enter it below
        to activate your account.
      </p>

      {error && (
        <Alert variant="destructive" className="mt-4 text-left" role="alert" aria-live="polite">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-5 flex justify-center">
        <InputOTP
          value={otp}
          onChange={(value) => {
            setOtp(value);
            if (value.length === 6) {
              void handleVerify();
            }
          }}
          maxLength={6}
          autoFocus
          inputMode="numeric"
          pattern="[0-9]*"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        type="button"
        onClick={handleVerify}
        className="mt-5 w-full rounded-lg py-3 font-medium"
        disabled={loading || otp.length < 6}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Verifying...
          </span>
        ) : (
          "Verify & Activate Account"
        )}
      </Button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending || countdown > 0}
        className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-primary hover:underline disabled:cursor-not-allowed disabled:text-foreground-muted disabled:no-underline"
      >
        {resending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <RefreshCw className="size-3.5" />
        )}
        {countdown > 0
          ? `Resend code in ${countdown}s`
          : "Resend code"}
      </button>
    </div>
  );
}