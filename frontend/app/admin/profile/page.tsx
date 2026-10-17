"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Calendar,
  Camera,
  Check,
  Clock,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import type { AdminUser } from "@/types";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";
import { api } from "@/lib/api";
import { cn, resolveMediaUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BIO_MAX = 300;
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name is too long"),
  bio: z.string().max(BIO_MAX, `Bio must be ${BIO_MAX} characters or fewer`),
  phone: z
    .string()
    .max(30, "Phone number is too long")
    .refine((v) => v === "" || /^[+\d][\d\s().-]{5,}$/.test(v), "Enter a valid phone number"),
  location: z.string().max(80, "Location is too long"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "New password must be different from the current one",
    path: ["newPassword"],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function timeAgo(value?: string) {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff)) return "—";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/** Reads the `exp` claim (ms) from the JWT so we can show how long the session lasts. */
function tokenExpiry(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "Expired";
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Upper & lowercase letters", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "A number", test: (p: string) => /\d/.test(p) },
  { label: "A symbol", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH = [
  { label: "Too weak", bar: "bg-destructive", text: "text-destructive" },
  { label: "Weak", bar: "bg-destructive", text: "text-destructive" },
  { label: "Fair", bar: "bg-warning", text: "text-warning" },
  { label: "Good", bar: "bg-success", text: "text-success" },
  { label: "Strong", bar: "bg-success", text: "text-success" },
];

/* ── Header ── */

function ProfileHeader({ admin }: { admin: AdminUser }) {
  const { updateAdmin } = useAdminAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const avatarSrc = resolveMediaUrl(admin.avatarUrl);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setFile(null);
    setPreview(null);
  }, []);

  const pickFile = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (f.size > AVATAR_MAX_BYTES) {
      toast.error("Image must be 5 MB or smaller");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const saveAvatar = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { url } = await api.upload<{ url: string }>("/upload?type=avatar", formData);
      await api.put("/auth/admin/profile", { avatarUrl: url });
      updateAdmin({ avatarUrl: url });
      toast.success("Profile photo updated");
      closeDialog();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upload photo");
    } finally {
      setBusy(false);
    }
  };

  const removeAvatar = async () => {
    setBusy(true);
    try {
      await api.put("/auth/admin/profile", { avatarUrl: null });
      updateAdmin({ avatarUrl: null });
      toast.success("Profile photo removed");
      closeDialog();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove photo");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded p-0">
      <div className="h-24 bg-gradient-to-r from-brand-primary/30 via-brand-primary/10 to-transparent sm:h-28" />
      <CardContent className="px-5 pb-5 sm:px-6">
        <div className="-mt-12 flex flex-col items-center gap-4 sm:-mt-14 sm:flex-row sm:items-end">
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            aria-label="Change profile photo"
            className="group relative shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Avatar className="!size-24 ring-4 ring-background sm:!size-28">
              {avatarSrc && <AvatarImage src={avatarSrc} alt={admin.name} className="object-cover" />}
              <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">
                {getInitials(admin.name)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera className="size-5 text-white" />
            </span>
          </button>

          <div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="truncate text-xl font-bold text-foreground">{admin.name}</h2>
              <Badge className="gap-1 bg-brand-primary text-primary-foreground hover:bg-brand-primary">
                <Shield className="size-3" />
                Admin
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{admin.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Member since {formatDate(admin.createdAt)}
              </span>
              {admin.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {admin.location}
                </span>
              )}
            </div>
          </div>
        </div>
        {admin.bio && (
          <p className="mt-4 max-w-2xl whitespace-pre-line text-center text-sm text-muted-foreground sm:text-left">
            {admin.bio}
          </p>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(o) => (o ? setDialogOpen(true) : closeDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile photo</DialogTitle>
            <DialogDescription>JPG, PNG, WebP or GIF, up to 5 MB.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <Avatar className="!size-28">
              {(preview ?? avatarSrc) && (
                <AvatarImage src={preview ?? avatarSrc} alt="Preview" className="object-cover" />
              )}
              <AvatarFallback className="bg-muted text-muted-foreground">
                <Camera className="size-8" />
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Camera className="size-4" />
              {file ? "Choose a different photo" : "Choose photo"}
            </Button>
            {file && <p className="max-w-full truncate text-xs text-muted-foreground">{file.name}</p>}
          </div>
          <DialogFooter className="sm:justify-between">
            {admin.avatarUrl ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={removeAvatar}
                disabled={busy}
              >
                <Trash2 className="size-4" />
                Remove photo
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <DialogClose render={<Button variant="outline" disabled={busy} />}>Cancel</DialogClose>
              <Button onClick={saveAvatar} disabled={!file || busy}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                Save photo
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ── Profile tab ── */

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Copy email"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Could not copy email");
        }
      }}
    >
      {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
    </Button>
  );
}

function ProfileTab({ admin }: { admin: AdminUser }) {
  const { updateAdmin } = useAdminAuthStore();

  const values = useMemo<ProfileValues>(
    () => ({
      name: admin.name ?? "",
      bio: admin.bio ?? "",
      phone: admin.phone ?? "",
      location: admin.location ?? "",
    }),
    [admin.name, admin.bio, admin.phone, admin.location],
  );

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: values,
    values,
  });
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = form;

  const bioLength = (useWatch({ control, name: "bio" }) ?? "").length;

  const onSubmit = async (data: ProfileValues) => {
    try {
      const updated = await api.put<Partial<AdminUser>>("/auth/admin/profile", {
        name: data.name.trim(),
        bio: data.bio.trim(),
        phone: data.phone.trim(),
        location: data.location.trim(),
      });
      updateAdmin({
        name: data.name.trim(),
        bio: data.bio.trim() || null,
        phone: data.phone.trim() || null,
        location: data.location.trim() || null,
        ...(updated ?? {}),
      });
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card className="rounded">
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>This is how you appear across the admin panel.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="size-3.5 text-muted-foreground" />
              Full name
            </Label>
            <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="size-3.5 text-muted-foreground" />
              Email address
            </Label>
            <div className="flex items-center gap-1">
              <Input id="email" value={admin.email} readOnly disabled className="flex-1" />
              <CopyEmail email={admin.email} />
            </div>
            <p className="text-xs text-muted-foreground">Email is your sign-in and can&apos;t be changed here.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="size-3.5 text-muted-foreground" />
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+1 555 000 0000"
              aria-invalid={!!errors.phone}
              {...register("phone")}
            />
            <FieldError message={errors.phone?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="size-3.5 text-muted-foreground" />
              Location
            </Label>
            <Input
              id="location"
              autoComplete="address-level2"
              placeholder="City, Country"
              aria-invalid={!!errors.location}
              {...register("location")}
            />
            <FieldError message={errors.location?.message} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Bio</Label>
              <span
                className={cn(
                  "text-xs tabular-nums text-muted-foreground",
                  bioLength > BIO_MAX && "text-destructive",
                )}
              >
                {bioLength}/{BIO_MAX}
              </span>
            </div>
            <Textarea
              id="bio"
              rows={4}
              placeholder="A short note about your role…"
              aria-invalid={!!errors.bio}
              {...register("bio")}
            />
            <FieldError message={errors.bio?.message} />
          </div>
        </CardContent>
      </Card>

      <div
        className={cn(
          "sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded border border-border bg-background/95 px-4 py-3 shadow-sm backdrop-blur transition-opacity",
          !isDirty && "pointer-events-none opacity-0",
        )}
        aria-hidden={!isDirty}
      >
        <span className="mr-auto text-sm text-muted-foreground">You have unsaved changes</span>
        <Button type="button" variant="outline" onClick={() => reset(values)} disabled={isSubmitting}>
          Discard
        </Button>
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}

/* ── Security tab ── */

function PasswordInput({
  id,
  label,
  error,
  autoComplete,
  registration,
}: {
  id: string;
  label: string;
  error?: string;
  autoComplete: string;
  registration: ReturnType<ReturnType<typeof useForm<PasswordValues>>["register"]>;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className="pr-10"
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <FieldError message={error} />
    </div>
  );
}

function SessionCard() {
  const router = useRouter();
  const { accessToken, logout } = useAdminAuthStore();
  const expiry = useMemo(() => tokenExpiry(accessToken), [accessToken]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <Card className="rounded">
      <CardHeader>
        <CardTitle>Current session</CardTitle>
        <CardDescription>Admin sessions expire automatically for your safety.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded border border-border px-3 py-2.5 text-sm">
          <Clock className="size-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium">This device</p>
            <p className="text-xs text-muted-foreground">
              {expiry ? `Expires ${new Date(expiry).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Active"}
            </p>
          </div>
          {expiry && (
            <Badge variant="outline" className={cn(expiry - now < 15 * 60000 && "text-warning")}>
              {formatRemaining(expiry - now)}
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            logout();
            router.push("/admin");
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </CardContent>
    </Card>
  );
}

function SecurityTab() {
  const [changing, setChanging] = useState(false);
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const { register, handleSubmit, reset, control, formState: { errors } } = form;

  const newPassword = useWatch({ control, name: "newPassword" }) ?? "";
  const passed = PASSWORD_RULES.filter((r) => r.test(newPassword)).length;
  const strength = newPassword ? STRENGTH[passed] : null;

  const onSubmit = async (data: PasswordValues) => {
    setChanging(true);
    try {
      await api.put("/auth/admin/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password updated");
      reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update password");
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4" />
            Change password
          </CardTitle>
          <CardDescription>Use a long, unique password you don&apos;t use anywhere else.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 md:grid-cols-2" noValidate>
            <div className="space-y-4">
              <PasswordInput
                id="currentPassword"
                label="Current password"
                autoComplete="current-password"
                error={errors.currentPassword?.message}
                registration={register("currentPassword")}
              />
              <PasswordInput
                id="newPassword"
                label="New password"
                autoComplete="new-password"
                error={errors.newPassword?.message}
                registration={register("newPassword")}
              />
              <PasswordInput
                id="confirmPassword"
                label="Confirm new password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                registration={register("confirmPassword")}
              />
              <Button type="submit" disabled={changing}>
                {changing && <Loader2 className="size-4 animate-spin" />}
                Update password
              </Button>
            </div>

            <div className="space-y-3 rounded border border-border/60 bg-muted/30 p-4 text-sm" aria-live="polite">
              <div className="flex items-center justify-between">
                <span className="font-medium">Password strength</span>
                <span className={cn("text-xs font-medium", strength?.text ?? "text-muted-foreground")}>
                  {strength?.label ?? "Enter a password"}
                </span>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full bg-muted transition-colors",
                      newPassword && i < passed && strength?.bar,
                    )}
                  />
                ))}
              </div>
              <ul className="space-y-1.5 pt-1">
                {PASSWORD_RULES.map((rule) => {
                  const ok = rule.test(newPassword);
                  return (
                    <li
                      key={rule.label}
                      className={cn(
                        "flex items-center gap-2 text-xs",
                        ok ? "text-success" : "text-muted-foreground",
                      )}
                    >
                      <Check className={cn("size-3.5", !ok && "opacity-30")} />
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>

      <SessionCard />
    </div>
  );
}

/* ── Page ── */

export default function AdminProfilePage() {
  const { admin, updateAdmin } = useAdminAuthStore();

  // Pull the latest profile (bio, phone, last seen…) — the persisted copy can be stale.
  useEffect(() => {
    let cancelled = false;
    api
      .get<Partial<AdminUser>>("/auth/admin/me")
      .then((me) => !cancelled && me && updateAdmin(me))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [updateAdmin]);

  if (!admin) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account details and security
          {admin.lastSeen ? ` · Last active ${timeAgo(admin.lastSeen)}` : ""}
        </p>
      </div>

      <ProfileHeader admin={admin} />

      <Tabs defaultValue="profile" className="gap-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="size-4" />
            Security
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileTab admin={admin} />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
