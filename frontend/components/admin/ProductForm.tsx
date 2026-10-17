"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Loader2,
  ArrowLeft,
  ChevronsUpDown,
  Check,
  Upload,
  X,
} from "lucide-react";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children: CategoryNode[];
}

interface UserDto {
  id: string;
  name: string;
  email: string;
}

interface ProductFormProps {
  initialData?: {
    title: string;
    description: string;
    price: string;
    brand: string;
    size: string;
    condition: string;
    material: string;
    color: string;
    pattern: string;
    images: string;
    categoryId: string;
    sellerId: string;
    status: string;
    quantity: string;
    shippingFree: boolean;
    isPromoted: boolean;
  };
  listingId?: string;
}

const conditions = [
  { value: "new_with_tags", label: "New with tags" },
  { value: "new_without_tags", label: "New without tags" },
  { value: "very_good", label: "Very good" },
  { value: "good", label: "Good" },
  { value: "satisfactory", label: "Satisfactory" },
];

/** Admins choose whether an item is on sale. "Sold out" and "Reserved" follow from stock and checkouts. */
const statuses = [
  { value: "active", label: "On sale" },
  { value: "deactivated", label: "Deactivated" },
];
const derivedStatusLabels: Record<string, string> = {
  sold: "Sold out (add stock to sell again)",
  reserved: "Reserved (a buyer is checking out)",
};

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.string().min(1, "Price is required").refine(
    (v) => !isNaN(Number(v)) && Number(v) >= 0,
    "Price must be a valid number",
  ),
  brand: z.string().min(1, "Brand is required"),
  size: z.string().min(1, "Size is required"),
  condition: z.string().min(1, "Condition is required"),
  material: z.string(),
  color: z.string(),
  pattern: z.string(),
  images: z.string(),
  categoryId: z.string().min(1, "Category is required"),
  sellerId: z.string().min(1, "Seller is required"),
  status: z.string().min(1, "Status is required"),
  quantity: z
    .string()
    .regex(/^\d+$/, "Enter a whole number")
    .refine((v) => Number(v) <= 9999, "At most 9999"),
  shippingFree: z.boolean(),
  isPromoted: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export function ProductForm({ initialData, listingId }: ProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [flatCats, setFlatCats] = useState<{ id: string; name: string; path: string }[]>([]);
  const [sellers, setSellers] = useState<UserDto[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [catOpen, setCatOpen] = useState(false);
  const [sellerOpen, setSellerOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [sellerSearch, setSellerSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      brand: "",
      size: "",
      condition: "",
      material: "",
      color: "",
      pattern: "",
      images: "",
      categoryId: "",
      sellerId: "",
      status: "active",
      quantity: "1",
      shippingFree: false,
      isPromoted: false,
      ...initialData,
    },
  });

  useEffect(() => {
    Promise.all([
      api.get<CategoryNode[]>("/categories"),
      api.get<{ users: UserDto[] }>("/users/admin/list?limit=100"),
    ])
      .then(([cats, usersRes]) => {
        const flat: { id: string; name: string; path: string }[] = [];
        const names: { id: string; name: string }[] = [];
        const flatten = (nodes: CategoryNode[], prefix = "") => {
          for (const n of nodes) {
            const label = prefix ? `${prefix} > ${n.name}` : n.name;
            flat.push({ id: n.id, name: label, path: label });
            names.push({ id: n.id, name: n.name });
            flatten(n.children, label);
          }
        };
        flatten(cats);
        setFlatCats(flat);
        setCategories(names);
        setSellers(usersRes.users);
      })
      .catch(() => toast.error("Failed to load form data"))
      .finally(() => setDataLoading(false));
  }, []);

  const selectedCatName = flatCats.find(
    (c) => c.id === form.watch("categoryId"),
  )?.name;

  const selectedSeller = sellers.find(
    (s) => s.id === form.watch("sellerId"),
  );

  const filteredCats = flatCats.filter((c) =>
    c.path.toLowerCase().includes(catSearch.toLowerCase()),
  );

  const filteredSellers = sellers.filter(
    (s) =>
      s.name.toLowerCase().includes(sellerSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(sellerSearch.toLowerCase()),
  );

  const imageUrls = (form.watch("images") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const existing = imageUrls;
    const remaining = 20 - existing.length;
    const toUpload = Array.from(files).slice(0, remaining);

    if (toUpload.length === 0) return;

    setUploading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
      const newUrls: string[] = [];

      for (const file of toUpload) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          toast.error(`${file.name} is not a supported image type`);
          continue;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          toast.error(`${file.name} exceeds 5MB`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${apiUrl}/upload?type=product`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message ?? "Upload failed");
        }
        const json = await res.json();
        const url = json.data?.url ?? json.url;
        if (url) newUrls.push(url);
      }

      const allUrls = [...existing, ...newUrls];
      form.setValue("images", allUrls.join(","));
      if (newUrls.length > 0) toast.success(`${newUrls.length} image${newUrls.length > 1 ? "s" : ""} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload images");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const urls = imageUrls.filter((_, i) => i !== index);
    form.setValue("images", urls.join(","));
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    setSaving(true);
    try {
      const body = {
        title: data.title,
        description: data.description,
        price: Number(data.price),
        brand: data.brand,
        size: data.size,
        condition: data.condition,
        material: data.material || undefined,
        color: data.color || undefined,
        pattern: data.pattern || undefined,
        images: data.images
          ? data.images.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        categoryId: data.categoryId,
        sellerId: data.sellerId,
        // Only send the status when it was changed: sold / reserved are derived and must not be echoed back.
        status: data.status === (initialData?.status ?? "active") && listingId ? undefined : data.status,
        quantity: Number(data.quantity),
        shippingFree: data.shippingFree,
        isPromoted: data.isPromoted,
      };
      if (listingId) {
        await api.put(`/listings/${listingId}`, body);
        toast.success("Product updated");
      } else {
        await api.post("/listings", body);
        toast.success("Product created");
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  });

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {listingId ? "Edit Product" : "New Product"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {listingId ? "Update product details" : "Add a new product to the marketplace"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {saving && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 rounded md:col-span-2">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        )}

        {/* ───── Left Column ───── */}
        <Card className="h-full rounded!">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Basic Info
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <Field>
              <FieldLabel>Title *</FieldLabel>
              <Input
                {...form.register("title")}
                placeholder="Product title"
                disabled={saving}
              />
              <FieldError>{form.formState.errors.title?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>Description *</FieldLabel>
              <Textarea
                {...form.register("description")}
                placeholder="Product description"
                rows={4}
                disabled={saving}
              />
              <FieldError>{form.formState.errors.description?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>Category *</FieldLabel>
              <Popover open={catOpen} onOpenChange={setCatOpen}>
                <PopoverTrigger
                  className="flex w-full items-center justify-between rounded border border-input bg-background px-3 py-2 text-sm font-normal shadow-xs outline-hidden disabled:opacity-50"
                  disabled={saving}
                >
                  {selectedCatName ?? "Select category"}
                  <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-[--anchor-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search category..."
                      value={catSearch}
                      onValueChange={setCatSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {filteredCats.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.path}
                            onSelect={() => {
                              form.setValue("categoryId", c.id, {
                                shouldValidate: true,
                              });
                              setCatOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "size-4 mr-2",
                                form.watch("categoryId") === c.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {c.path}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FieldError>{form.formState.errors.categoryId?.message}</FieldError>
            </Field>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Media
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <div className="space-y-3">
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imageUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded overflow-hidden bg-surface-muted border border-border group"
                    >
                      <img
                        src={url.startsWith("http") ? url : `http://localhost:4000${url}`}
                        alt={`Product ${i + 1}`}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        disabled={uploading}
                        className="absolute top-1 right-1 size-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                      >
                        <X className="size-3 text-white" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-black/60 text-white">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                  {imageUrls.length < 20 && (
                    <label className="relative aspect-square rounded border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                      {uploading ? (
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="size-5 text-muted-foreground mb-1" />
                          <span className="text-[10px] text-muted-foreground">
                            Add photo
                          </span>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              )}

              {imageUrls.length === 0 && (
                <label className="flex flex-col items-center justify-center rounded border-2 border-dashed border-border py-8 cursor-pointer hover:border-primary/50 transition-colors">
                  {uploading ? (
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="size-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground font-medium">
                        Click to upload images
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, WebP, GIF, AVIF up to 5MB each
                      </span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ───── Right Column ───── */}
        <Card className="h-full rounded!">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pricing &amp; Condition
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Price ($) *</FieldLabel>
                <Input
                  type="number"
                  {...form.register("price")}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  disabled={saving}
                />
                <FieldError>{form.formState.errors.price?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel>Condition *</FieldLabel>
                <Select
                  value={form.watch("condition")}
                  onValueChange={(v) =>
                    form.setValue("condition", v ?? "", { shouldValidate: true })
                  }
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{form.formState.errors.condition?.message}</FieldError>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Status</FieldLabel>
                {derivedStatusLabels[form.watch("status")] ? (
                  <Input value={derivedStatusLabels[form.watch("status")]} disabled readOnly />
                ) : (
                  <Select
                    value={form.watch("status")}
                    onValueChange={(v) => form.setValue("status", v ?? "active")}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="quantity">Stock</FieldLabel>
                <Input
                  id="quantity"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={9999}
                  step={1}
                  disabled={saving}
                  {...form.register("quantity")}
                />
                <FieldError>{form.formState.errors.quantity?.message}</FieldError>
              </Field>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Attributes
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Brand *</FieldLabel>
                <Input
                  {...form.register("brand")}
                  placeholder="e.g. Gucci"
                  disabled={saving}
                />
                <FieldError>{form.formState.errors.brand?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel>Size *</FieldLabel>
                <Input
                  {...form.register("size")}
                  placeholder="e.g. M, 10, 38"
                  disabled={saving}
                />
                <FieldError>{form.formState.errors.size?.message}</FieldError>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Material</FieldLabel>
                <Input
                  {...form.register("material")}
                  placeholder="e.g. Cotton, Leather"
                  disabled={saving}
                />
              </Field>

              <Field>
                <FieldLabel>Color</FieldLabel>
                <Input
                  {...form.register("color")}
                  placeholder="e.g. Black, Red"
                  disabled={saving}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Pattern</FieldLabel>
              <Input
                {...form.register("pattern")}
                placeholder="e.g. Floral, Striped"
                disabled={saving}
              />
            </Field>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Listing Settings
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <Field>
              <FieldLabel>Seller *</FieldLabel>
              <Popover open={sellerOpen} onOpenChange={setSellerOpen}>
                <PopoverTrigger
                  className="flex w-full items-center justify-between rounded border border-input bg-background px-3 py-2 text-sm font-normal shadow-xs outline-hidden disabled:opacity-50"
                  disabled={saving}
                >
                  {selectedSeller ? (
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex size-5 items-center justify-center rounded-full text-[10px] font-medium",
                          avatarColor(selectedSeller.name),
                        )}
                      >
                        {getInitials(selectedSeller.name)}
                      </span>
                      {selectedSeller.name} ({selectedSeller.email})
                    </span>
                  ) : (
                    "Select seller"
                  )}
                  <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-[--anchor-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search seller..."
                      value={sellerSearch}
                      onValueChange={setSellerSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No seller found.</CommandEmpty>
                      <CommandGroup>
                        {filteredSellers.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={`${s.name} ${s.email}`}
                            onSelect={() => {
                              form.setValue("sellerId", s.id, {
                                shouldValidate: true,
                              });
                              setSellerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "size-4 mr-2",
                                form.watch("sellerId") === s.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span
                              className={cn(
                                "inline-flex size-5 items-center justify-center rounded-full text-[10px] font-medium mr-2 shrink-0",
                                avatarColor(s.name),
                              )}
                            >
                              {getInitials(s.name)}
                            </span>
                            <span className="truncate">{s.name}</span>
                            <span className="text-muted-foreground ml-auto text-xs shrink-0">
                              {s.email}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FieldError>{form.formState.errors.sellerId?.message}</FieldError>
            </Field>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="shippingFree"
                  checked={form.watch("shippingFree")}
                  onCheckedChange={(v) =>
                    form.setValue("shippingFree", v === true)
                  }
                  disabled={saving}
                  className="mt-0.5"
                />
                <div>
                  <Label
                    htmlFor="shippingFree"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Free shipping
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    The seller covers shipping costs
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="isPromoted"
                  checked={form.watch("isPromoted")}
                  onCheckedChange={(v) =>
                    form.setValue("isPromoted", v === true)
                  }
                  disabled={saving}
                  className="mt-0.5"
                />
                <div>
                  <Label
                    htmlFor="isPromoted"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Promoted
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Featured in search results and homepage
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ───── Actions (span both columns) ───── */}
        <div className="flex items-center justify-between gap-3 md:col-span-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="min-w-[160px]">
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            {listingId ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
