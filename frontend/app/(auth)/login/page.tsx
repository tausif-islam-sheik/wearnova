"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, User, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PhoneVerification } from "@/components/auth/phone-verification";
import { useAuthStore } from "@/stores/useAuthStore";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      router.push(redirect);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 403) {
        setNeedsVerification(true);
        setError(null);
      } else {
        setError(err instanceof ApiError ? err.message : "Invalid email or password");
      }
    }

    setLoading(false);
  };

  if (needsVerification) {
    return (
      <div className="w-full max-w-[420px]">
        <Card className="border-t-4 border-t-brand-primary shadow-lg p-8 bg-white">
          <CardContent className="px-0 py-0">
            <PhoneVerification
              email={getValues("email")}
              onVerified={() => {
                toast.success("Phone verified! Welcome back!");
                router.push(redirect);
              }}
            />
            <p className="mt-6 text-center text-sm text-foreground-muted">
              <button
                type="button"
                onClick={() => setNeedsVerification(false)}
                className="inline-flex items-center gap-1.5 text-brand-primary hover:underline transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                Back to login
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px]">
      <Card className="border-t-4 border-t-brand-primary shadow-lg p-8 bg-white">
        <CardHeader className="text-center px-0 pt-0">
          <User className="mx-auto size-7 text-brand-primary mb-2" />
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-foreground-muted">
            Sign in to your Wearnova account
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {error && (
            <Alert variant="destructive" className="mb-4" role="alert" aria-live="polite">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Field>
              <FieldLabel htmlFor="email" className="text-sm font-medium mb-0">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                autoComplete="username"
                className="h-11"
                {...register("email", { required: "Email is required" })}
              />
              <FieldError>{errors.email?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="password" className="text-sm font-medium mb-0">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="h-11 pr-10"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Min 6 characters" },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <FieldError>{errors.password?.message}</FieldError>
            </Field>

            <Button
              type="submit"
              className="w-full rounded-lg py-3 font-medium transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>

            <p className="text-center text-sm text-foreground-muted mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="inline-flex items-center gap-1.5 text-brand-primary hover:underline transition-colors">
                Sign up
                <ArrowRight className="size-3.5" />
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-12 text-center text-sm text-foreground-muted">
            Loading...
          </CardContent>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
