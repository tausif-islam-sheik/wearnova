"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, ShieldCheck, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAdminAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      await login(data.email, data.password);
      toast.success("Welcome, Admin!");
      router.push("/admin/overview");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid credentials");
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-[420px]">
      <Card className="border-t-4 border-t-brand-primary shadow-lg p-8 bg-white">
        <CardHeader className="text-center px-0 pt-0">
          <ShieldCheck className="mx-auto size-7 text-brand-primary mb-2" />
          <CardTitle className="text-2xl font-bold tracking-tight">
            Admin Portal
          </CardTitle>
          <CardDescription className="text-foreground-muted">
            Sign in to the admin dashboard
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
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="email" className="text-sm font-medium mb-0">Admin Email</FieldLabel>
              </div>
              <Input
                id="email"
                type="email"
                placeholder="admin@wearnova.com"
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
                  placeholder="Admin password"
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
                "Sign in to Admin"
              )}
            </Button>

            <p className="text-center text-sm text-foreground-muted mt-6">
                <Link href="/" className="inline-flex items-center gap-1.5 text-brand-primary hover:underline transition-colors">
                <ArrowLeft className="size-3.5" />
                Back to home
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
