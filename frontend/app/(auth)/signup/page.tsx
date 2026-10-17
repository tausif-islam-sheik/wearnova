"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, UserPlus, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidPhone } from "@/lib/phone";
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

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    phone: z.string().refine(isValidPhone, "Please enter a valid mobile number for the selected country"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const signup = useAuthStore((s) => s.signup);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingPhoneMasked, setPendingPhoneMasked] = useState<string | undefined>(undefined);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", phone: "" },
  });

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    setError(null);

    try {
      const res = await signup(data.name, data.email, data.password, data.phone);
      setPendingEmail(data.email);
      setPendingPhoneMasked(res.phoneMasked);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    }

    setLoading(false);
  };

  if (pendingEmail) {
    return (
      <div className="w-full max-w-[420px]">
        <Card className="border-t-4 border-t-brand-primary shadow-lg p-8 bg-white">
          <CardContent className="px-0 py-0">
            <PhoneVerification
              email={pendingEmail}
              phoneMasked={pendingPhoneMasked}
              onVerified={() => {
                toast.success("Phone verified! Your account is ready. Welcome!");
                router.push("/");
              }}
            />
            <p className="mt-6 text-center text-sm text-foreground-muted">
              <Link href="/login" className="text-brand-primary hover:underline transition-colors">
                <ArrowLeft className="mr-1 inline size-3.5" />
                Back to login
              </Link>
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
          <UserPlus className="mx-auto size-7 text-brand-primary mb-2" />
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create Account
          </CardTitle>
          <CardDescription className="text-foreground-muted">
            Join the community and start buying or selling
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
              <FieldLabel htmlFor="name" className="text-sm font-medium mb-0">Name</FieldLabel>
              <Input
                id="name"
                placeholder="Your name"
                autoComplete="name"
                className="h-11"
                {...register("name", { required: "Name is required" })}
              />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>

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
              <FieldLabel htmlFor="phone" className="text-sm font-medium mb-0">Mobile Number</FieldLabel>
              <Controller
                control={control}
                name="phone"
                rules={{
                  required: "Mobile number is required",
                  validate: (v) =>
                    isValidPhone(v) || "Please enter a valid mobile number for the selected country",
                }}
                render={({ field }) => (
                  <PhoneInput
                    id="phone"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    defaultCountry="AU"
                    placeholder="412 345 678"
                    invalid={Boolean(errors.phone)}
                    className="h-11"
                  />
                )}
              />
              <FieldError>{errors.phone?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="password" className="text-sm font-medium mb-0">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
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

            <Field>
              <FieldLabel htmlFor="confirmPassword" className="text-sm font-medium mb-0">Confirm Password</FieldLabel>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className="h-11 pr-10"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <FieldError>{errors.confirmPassword?.message}</FieldError>
            </Field>

            <Button
              type="submit"
              className="w-full rounded-lg py-3 font-medium transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Sending verification code...
                </span>
              ) : (
                "Sign Up"
              )}
            </Button>

            <p className="text-center text-sm text-foreground-muted">
              Already have an account?{" "}
              <Link href="/login" className="inline-flex items-center gap-1.5 text-brand-primary hover:underline transition-colors">
                <ArrowLeft className="size-3.5" />
                Log in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
