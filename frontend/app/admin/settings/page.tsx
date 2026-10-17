"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, ImageIcon, Pencil, Trash2, ArrowUp, ArrowDown, Plus, Check, Loader2, Upload, CreditCard, Truck, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StripeSettings } from "@/components/admin/StripeSettings";
import { BackupSettings } from "@/components/admin/BackupSettings";
import { ShippingSettings } from "@/components/admin/ShippingSettings";
import { useAdminLoading, FormPageSkeleton } from "@/components/admin/PageSkeletons";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface BannerDto {
  id: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  order: number;
  active: boolean;
  createdAt: string;
}

function BannerDialog({
  banner,
  open,
  onOpenChange,
  onSave,
}: {
  banner?: BannerDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  const [title, setTitle] = useState(banner?.title ?? "");
  const [body, setBody] = useState(banner?.body ?? "");
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(banner?.title ?? "");
      setBody(banner?.body ?? "");
      setImageUrl(banner?.imageUrl ?? "");
    }
  }, [open, banner]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/upload?type=banner`,
        { method: "POST", body: formData }
      );
      const json = await res.json();
      if (!res.ok) {
        const errMsg = json?.message ?? json?.data?.message ?? "Upload failed";
        throw new Error(errMsg);
      }
      const url = json.data?.url ?? json.url;
      const isVideo = json.data?.isVideo ?? json.isVideo ?? file.type.startsWith("video/");
      setImageUrl(url);
      toast.success(isVideo ? "Video uploaded" : "Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      if (banner) {
        await api.put(`/banners/${banner.id}`, { title, body: body || "", ...(imageUrl?.trim() ? { imageUrl } : {}) });
        toast.success("Banner updated");
      } else {
        await api.post("/banners", { title, body: body || "", ...(imageUrl?.trim() ? { imageUrl } : {}) });
        toast.success("Banner created");
      }
      onSave();
      onOpenChange(false);
    } catch {
      toast.error(banner ? "Failed to update banner" : "Failed to create banner");
    } finally {
      setSaving(false);
    }
  }, [banner, title, body, imageUrl, onSave, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-md">
          <div className="p-5 space-y-4">
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {banner ? "Edit Banner" : "Add Banner"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {banner ? "Update the banner details." : "Create a new homepage banner."}
              </DialogDescription>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9" placeholder="Summer Sale" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Body</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[60px]" placeholder="Up to 50% off on selected items" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Image</Label>
              {imageUrl?.trim() && (
                imageUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                  <video src={imageUrl} controls className="w-full h-28 rounded-md object-cover bg-muted mb-2" />
                ) : (
                  <img src={imageUrl} alt="Preview" className="w-full h-28 rounded-md object-cover bg-muted mb-2" />
                )
              )}
              <label className="flex items-center justify-center gap-2 h-24 rounded-md border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 cursor-pointer text-muted-foreground hover:text-foreground transition-colors text-sm">
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                {uploading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
                <span>{uploading ? "Uploading..." : "Click to upload image or video"}</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <DialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
              <Button size="sm" onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="size-3.5 animate-spin mr-1" />}
                {banner ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

export default function SettingsPage() {
  const loading = useAdminLoading();
  const [platformName, setPlatformName] = useState("Wearnova");
  const [supportEmail, setSupportEmail] = useState("support@Wearnova.com");
  const [commission, setCommission] = useState("8");
  const [savingFee, setSavingFee] = useState(false);
  const [savedGeneral, setSavedGeneral] = useState({ platformName: "Wearnova", supportEmail: "support@Wearnova.com" });
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [banners, setBanners] = useState<BannerDto[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerDto | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<BannerDto | null>(null);

  const loadBanners = useCallback(() => {
    api.get<BannerDto[]>("/banners")
      .then(setBanners)
      .catch(() => toast.error("Failed to load banners"))
      .finally(() => setBannersLoading(false));
  }, []);

  useEffect(() => {
    loadBanners();
    api.get<{ platformFeePercent: number; platformName: string; supportEmail: string }>("/admin/settings")
      .then((res) => {
        setCommission(String(res.platformFeePercent));
        setPlatformName(res.platformName);
        setSupportEmail(res.supportEmail);
        setSavedGeneral({ platformName: res.platformName, supportEmail: res.supportEmail });
      })
      .catch(() => toast.error("Couldn't load the saved settings"));
  }, [loadBanners]);

  const generalDirty =
    platformName !== savedGeneral.platformName ||
    supportEmail !== savedGeneral.supportEmail;

  const handleSaveGeneral = useCallback(async () => {
    if (platformName.trim().length < 2) {
      toast.error("Platform name must be at least 2 characters");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail.trim())) {
      toast.error("Enter a valid support email address");
      return;
    }
    setSavingGeneral(true);
    try {
      const saved = await api.put<typeof savedGeneral>("/admin/settings/general", {
        platformName: platformName.trim(),
        supportEmail: supportEmail.trim(),
      });
      setPlatformName(saved.platformName);
      setSupportEmail(saved.supportEmail);
      setSavedGeneral(saved);
      toast.success("General settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save general settings");
    } finally {
      setSavingGeneral(false);
    }
  }, [platformName, supportEmail]);

  const handleSaveFee = useCallback(async () => {
    const percent = Number(commission);
    if (Number.isNaN(percent) || percent < 0 || percent > 50) {
      toast.error("Commission rate must be between 0 and 50%");
      return;
    }
    setSavingFee(true);
    try {
      await api.put<{ platformFeePercent: number }>("/admin/settings/platform-fee", {
        platformFeePercent: percent,
      });
      toast.success("Platform commission saved");
    } catch {
      toast.error("Failed to save commission rate");
    }
    setSavingFee(false);
  }, [commission]);

  const handleDelete = useCallback(async () => {
    if (!deletingBanner) return;
    try {
      await api.delete(`/banners/${deletingBanner.id}`);
      toast.success("Banner deleted");
      setDeletingBanner(null);
      loadBanners();
    } catch {
      toast.error("Failed to delete banner");
    }
  }, [deletingBanner, loadBanners]);

  const handleReorder = useCallback(async (banner: BannerDto, direction: "up" | "down") => {
    try {
      await api.patch(`/banners/${banner.id}/reorder`, { direction });
      toast.success(`Moved ${direction}`);
      loadBanners();
    } catch {
      toast.error(`Failed to move ${direction}`);
    }
  }, [loadBanners]);

  const handleToggle = useCallback(async (banner: BannerDto) => {
    try {
      await api.patch(`/banners/${banner.id}/toggle`);
      toast.success(banner.active ? "Banner deactivated" : "Banner activated");
      loadBanners();
    } catch {
      toast.error("Failed to toggle banner");
    }
  }, [loadBanners]);

  const openEditDialog = useCallback((banner: BannerDto) => {
    setEditingBanner(banner);
    setDialogOpen(true);
  }, []);

  const openAddDialog = useCallback(() => {
    setEditingBanner(null);
    setDialogOpen(true);
  }, []);

  if (loading) return <FormPageSkeleton tabs={5} />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your platform configuration</p>
      </div>

      <Tabs
        defaultValue="general"
        orientation="vertical"
        className="flex-col gap-6 md:flex-row md:items-start md:gap-8"
      >
        <TabsList
          variant="line"
          aria-label="Settings sections"
          className="w-full shrink-0 flex-row items-stretch justify-start gap-1 overflow-x-auto p-0 md:sticky md:top-20 md:w-56 md:flex-col md:overflow-visible"
        >
          <TabsTrigger
            value="general"
            className="h-9 flex-none justify-start gap-2.5 rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors duration-150 after:hidden hover:bg-muted hover:text-foreground data-active:!bg-muted data-active:!text-foreground data-active:!shadow-none md:w-full"
          >
            <Settings className="size-4" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="h-9 flex-none justify-start gap-2.5 rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors duration-150 after:hidden hover:bg-muted hover:text-foreground data-active:!bg-muted data-active:!text-foreground data-active:!shadow-none md:w-full"
          >
            <CreditCard className="size-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger
            value="shipping"
            className="h-9 flex-none justify-start gap-2.5 rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors duration-150 after:hidden hover:bg-muted hover:text-foreground data-active:!bg-muted data-active:!text-foreground data-active:!shadow-none md:w-full"
          >
            <Truck className="size-4" />
            Shipping
          </TabsTrigger>
          <TabsTrigger
            value="banners"
            className="h-9 flex-none justify-start gap-2.5 rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors duration-150 after:hidden hover:bg-muted hover:text-foreground data-active:!bg-muted data-active:!text-foreground data-active:!shadow-none md:w-full"
          >
            <ImageIcon className="size-4" />
            Banners
          </TabsTrigger>
          <TabsTrigger
            value="backup"
            className="h-9 flex-none justify-start gap-2.5 rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors duration-150 after:hidden hover:bg-muted hover:text-foreground data-active:!bg-muted data-active:!text-foreground data-active:!shadow-none md:w-full"
          >
            <Database className="size-4" />
            Backup
          </TabsTrigger>
        </TabsList>

        <div className="min-w-0 flex-1">
        <TabsContent value="general">
          <Card className="border border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">General Settings</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Basic platform information and preferences</p>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Platform Name</Label>
                <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Support Email</Label>
                <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="h-9" />
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handleSaveGeneral} disabled={!generalDirty || savingGeneral} className="h-9">
                  {savingGeneral && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                  Save changes
                </Button>
                {generalDirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
              </div>
              <div className="space-y-2 border-t border-border/50 pt-4">
                <Label className="text-sm font-medium text-foreground">Platform Commission Rate (%)</Label>
                <div className="flex items-center gap-3">
                  <Input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} className="h-9 w-32" min={0} max={50} step={0.5} />
                  <Button onClick={handleSaveFee} disabled={savingFee} className="h-9">
                    {savingFee && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage deducted from each sale and applied to new escrow payments. Range: 0–50%.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <ShippingSettings />
        </TabsContent>

        <TabsContent value="payments">
          <StripeSettings />
        </TabsContent>

        <TabsContent value="backup">
          <BackupSettings />
        </TabsContent>

        <TabsContent value="banners">
          <Card className="border border-border/50">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">Homepage Banners</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Hero slider images and videos shown on the homepage</p>
              </div>
              <Button size="sm" onClick={openAddDialog}>
                <Plus className="size-3.5 mr-1" />
                Add Banner
              </Button>
            </CardHeader>
            {bannersLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading banners...</div>
            ) : banners.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No banners yet. Click &ldquo;Add Banner&rdquo; to create one.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground px-4 py-2.5">Preview</th>
                      <th className="text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground px-4 py-2.5">Content</th>
                      <th className="text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground px-4 py-2.5">Status</th>
                      <th className="text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground px-4 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.map((banner, idx) => (
                      <tr key={banner.id} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          {banner.imageUrl?.trim() ? (
                            banner.imageUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                              <video src={banner.imageUrl} className="w-24 h-16 rounded-md object-cover bg-muted" />
                            ) : (
                              <img src={banner.imageUrl} alt={banner.title} className="w-24 h-16 rounded-md object-cover bg-muted" />
                            )
                          ) : (
                            <div className="w-24 h-16 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">No image</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{banner.title}</p>
                          {banner.body && <p className="text-xs text-muted-foreground truncate max-w-[240px]">{banner.body}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {banner.active && <Check className="size-3.5 text-emerald-500" />}
                            <button onClick={() => handleToggle(banner)} className="focus:outline-none">
                              <Badge className={`text-[10px] font-medium px-2 py-0.5 rounded-full cursor-pointer ${banner.active ? "bg-emerald-500/10 text-emerald-700 border border-emerald-200 dark:text-emerald-300 dark:border-emerald-500/30" : "bg-muted text-muted-foreground border-border"}`}>
                                {banner.active ? "Active" : "Inactive"}
                              </Badge>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon-sm" disabled={idx === 0} onClick={() => handleReorder(banner, "up")} className="text-muted-foreground hover:text-foreground">
                              <ArrowUp className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" disabled={idx === banners.length - 1} onClick={() => handleReorder(banner, "down")} className="text-muted-foreground hover:text-foreground">
                              <ArrowDown className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(banner)} className="text-muted-foreground hover:text-brand-primary hover:bg-brand-primary/10">
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => setDeletingBanner(banner)} className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10">
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
        </div>
      </Tabs>

      <AlertDialog open={!!deletingBanner} onOpenChange={(open) => !open && setDeletingBanner(null)}>
        <AlertDialogPortal>
          <AlertDialogOverlay />
          <AlertDialogContent size="sm">
            <AlertDialogTitle className="text-base font-semibold text-center">Delete banner?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground text-center">
              Are you sure you want to delete &ldquo;{deletingBanner?.title}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
            <AlertDialogFooter className="grid grid-cols-2 gap-2 mt-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>

      <BannerDialog
        banner={editingBanner}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={loadBanners}
      />
    </div>
  );
}
