"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  X,
  GripVertical,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useAuthStore } from "@/stores/useAuthStore";
import { useListingStore } from "@/stores/useListingStore";
import { api } from "@/lib/api";
import { categories } from "@/mocks/categories";
import { toast } from "sonner";
import type { Condition, Listing } from "@/types";

const steps = ["Photos", "Details", "Price & Shipping", "Review"];

const detailsSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  brand: z.string().min(1, "Brand is required"),
  size: z.string().min(1, "Size is required"),
  condition: z.string().min(1, "Condition is required"),
  color: z.string().optional(),
  material: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
});

const priceSchema = z.object({
  price: z.number().min(1, "Price must be at least $1"),
  shippingFree: z.boolean(),
});

type DetailsFormData = z.infer<typeof detailsSchema>;
type PriceFormData = z.infer<typeof priceSchema>;

const conditionOptions: { value: Condition; label: string }[] = [
  { value: "new_with_tags", label: "New with tags" },
  { value: "new_without_tags", label: "New without tags" },
  { value: "very_good", label: "Very good" },
  { value: "good", label: "Good" },
  { value: "satisfactory", label: "Satisfactory" },
];

const popularBrands = [
  "Zara", "H&M", "Nike", "Adidas", "Levi's", "Uniqlo", "COS",
  "Gucci", "Louis Vuitton", "Prada", "New Balance", "The North Face",
];

function SellContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const addListing = useListingStore((s) => s.addListing);
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [details, setDetails] = useState<Partial<DetailsFormData>>({});
  const [priceData, setPriceData] = useState<PriceFormData>({
    price: 0,
    shippingFree: true,
  });
  const [stripeReady, setStripeReady] = useState(true);

  useEffect(() => {
    api.get<{ onboardingComplete: boolean; payoutsEnabled: boolean }>("/stripe/connect/status")
      .then((res) => setStripeReady(Boolean(res.onboardingComplete && res.payoutsEnabled)))
      .catch(() => {});
  }, []);

  const detailsForm = useForm<DetailsFormData>({
    defaultValues: {
      title: "",
      description: "",
      brand: "",
      size: "",
      condition: "",
      color: "",
      material: "",
      categoryId: "",
      ...details,
    },
  });

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      const remaining = 20 - images.length;
      const newImages = Array.from(files)
        .slice(0, remaining)
        .map((f) => URL.createObjectURL(f));
      setImages((prev) => [...prev, ...newImages].slice(0, 20));
    },
    [images.length]
  );

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceedStep0 = images.length >= 1;

  const handlePublish = () => {
    if (!user) return;
    if (!stripeReady) {
      toast.error("Set up your payout account before publishing a listing.");
      return;
    }

    const flatCat = categories
      .flatMap((c) => [c, ...c.subcategories.flatMap((s) => [s, ...s.subcategories])]);
    const cat = flatCat.find((c) => c.id === details.categoryId);

    const newListing: Listing = {
      id: `listing-${Date.now()}`,
      title: details.title ?? "",
      description: details.description ?? "",
      price: priceData.price,
      brand: details.brand ?? "",
      size: details.size ?? "",
      condition: (details.condition as Condition) ?? "good",
      material: details.material || undefined,
      color: details.color || undefined,
      images: images.length > 0 ? images : ["/listings/placeholder.jpg"],
      sellerId: user.id,
      categoryId: details.categoryId ?? "",
      categoryPath: cat ? [cat.name] : ["Other"],
      likesCount: 0,
      uploadedAt: new Date().toISOString(),
      status: "active",
      shippingFree: priceData.shippingFree,
    };

    addListing(newListing);
    toast.success("Listing published!");
    router.push(`/products/${newListing.id}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {!stripeReady && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Set up payouts before publishing
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect your bank account via Stripe so buyers can pay you when
                your items sell.
              </p>
            </div>
          </div>
          <Link
            href="/settings/payments"
            className="shrink-0 text-sm font-medium text-brand-primary hover:underline"
          >
            Set up payouts
          </Link>
        </div>
      )}
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                i < step
                  ? "bg-brand-primary text-white"
                  : i === step
                    ? "bg-brand-primary text-white"
                    : "bg-surface-muted text-foreground-muted"
              }`}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </div>
            <span
              className={`text-xs hidden sm:inline ${
                i === step ? "text-foreground font-medium" : "text-foreground-muted"
              }`}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 ${
                  i < step ? "bg-brand-primary" : "bg-border-subtle"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Photos */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Add photos</h2>
          <p className="text-sm text-foreground-muted">
            Upload up to 20 photos. The first photo will be the cover.
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-surface-muted group">
                <img
                  src={img}
                  alt={`Upload ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-3 text-white" />
                </button>
                {i === 0 && (
                  <Badge className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white border-0">
                    Cover
                  </Badge>
                )}
              </div>
            ))}
            {images.length < 20 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-border-subtle flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-colors">
                <Upload className="size-6 text-foreground-faint mb-1" />
                <span className="text-[10px] text-foreground-faint">
                  Add photo
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>
          {images.length === 0 && (
            <p className="text-xs text-destructive">
              Please add at least 1 photo
            </p>
          )}
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Add details</h2>

          <Field>
            <FieldLabel>Title</FieldLabel>
            <Input
              placeholder="e.g. Zara Satin Midi Dress - Emerald Green"
              {...detailsForm.register("title", {
                required: "Title is required",
                minLength: { value: 5, message: "Min 5 characters" },
              })}
            />
            <FieldError>{detailsForm.formState.errors.title?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel>Brand</FieldLabel>
            <Input
              placeholder="Brand name"
              list="brands-list"
              {...detailsForm.register("brand", {
                required: "Brand is required",
              })}
            />
            <datalist id="brands-list">
              {popularBrands.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
            <FieldError>{detailsForm.formState.errors.brand?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel>Size</FieldLabel>
            <Input
              placeholder="e.g. M, 10 US, 42 EU"
              {...detailsForm.register("size", {
                required: "Size is required",
              })}
            />
            <FieldError>{detailsForm.formState.errors.size?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel>Condition</FieldLabel>
            <RadioGroup
              value={detailsForm.watch("condition")}
              onValueChange={(val) =>
                detailsForm.setValue("condition", val, {
                  shouldValidate: true,
                })
              }
              className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            >
              {conditionOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    detailsForm.watch("condition") === opt.value
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-border-subtle hover:bg-surface-muted"
                  }`}
                >
                  <RadioGroupItem value={opt.value} />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </RadioGroup>
            <FieldError>
              {detailsForm.formState.errors.condition?.message}
            </FieldError>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Color (optional)</FieldLabel>
              <Input
                placeholder="e.g. Blue"
                {...detailsForm.register("color")}
              />
            </Field>
            <Field>
              <FieldLabel>Material (optional)</FieldLabel>
              <Input
                placeholder="e.g. Cotton"
                {...detailsForm.register("material")}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel>Category</FieldLabel>
            <Select
              value={detailsForm.watch("categoryId") ?? ""}
              onValueChange={(val) =>
                detailsForm.setValue("categoryId", val ?? "", {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectGroup key={cat.id}>
                    <SelectLabel>{cat.name}</SelectLabel>
                    {cat.subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <FieldError>
              {detailsForm.formState.errors.categoryId?.message}
            </FieldError>
          </Field>

          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              rows={4}
              placeholder="Describe your item, including any flaws, original purchase details, etc."
              {...detailsForm.register("description", {
                required: "Description is required",
                minLength: { value: 20, message: "Min 20 characters" },
              })}
            />
            <div className="flex justify-between">
              <FieldError>
                {detailsForm.formState.errors.description?.message}
              </FieldError>
              <span className="text-xs text-foreground-faint">
                {detailsForm.watch("description")?.length ?? 0} characters
              </span>
            </div>
          </Field>
        </div>
      )}

      {/* Step 2: Price & Shipping */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold">Set price & shipping</h2>

          <Field>
            <FieldLabel>Price ($)</FieldLabel>
            <Input
              type="number"
              min={1}
              step={0.5}
              placeholder="0.00"
              value={priceData.price || ""}
              onChange={(e) =>
                setPriceData((p) => ({
                  ...p,
                  price: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </Field>

          {priceData.price > 0 && (
            <Card className="p-4 bg-surface-muted">
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-foreground-muted">Item price</span>
                  <span>${priceData.price.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Buyer pays total</span>
                  <span>
                    ${priceData.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          <div>
            <Label className="text-sm font-medium mb-2 block">Shipping</Label>
            <RadioGroup
              value={priceData.shippingFree ? "free" : "buyer"}
              onValueChange={(val) =>
                setPriceData((p) => ({ ...p, shippingFree: val === "free" }))
              }
              className="grid grid-cols-2 gap-3"
            >
              <label
                className={`p-4 rounded-lg border text-center transition-colors cursor-pointer ${
                  priceData.shippingFree
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-border-subtle hover:bg-surface-muted"
                }`}
              >
                <RadioGroupItem value="free" className="sr-only" />
                <p className="text-sm font-medium">Free shipping</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  You pay the shipping
                </p>
              </label>
              <label
                className={`p-4 rounded-lg border text-center transition-colors cursor-pointer ${
                  !priceData.shippingFree
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-border-subtle hover:bg-surface-muted"
                }`}
              >
                <RadioGroupItem value="buyer" className="sr-only" />
                <p className="text-sm font-medium">Buyer pays shipping</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Buyer covers the cost
                </p>
              </label>
            </RadioGroup>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold">Review your listing</h2>

          <div className="flex gap-4">
            {images[0] && (
              <div className="relative w-20 h-24 rounded-lg overflow-hidden shrink-0">
                <img
                  src={images[0]}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {details.title}
              </p>
              <p className="text-xs text-foreground-muted">
                {details.brand} · {details.size}
              </p>
              <p className="text-sm font-semibold text-foreground mt-1">
                ${priceData.price.toFixed(2)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-foreground-muted">Brand</span>
            <span>{details.brand}</span>
            <span className="text-foreground-muted">Size</span>
            <span>{details.size}</span>
            <span className="text-foreground-muted">Condition</span>
            <span className="capitalize">
              {details.condition?.replace(/_/g, " ")}
            </span>
            {details.color && (
              <>
                <span className="text-foreground-muted">Color</span>
                <span>{details.color}</span>
              </>
            )}
            {details.material && (
              <>
                <span className="text-foreground-muted">Material</span>
                <span>{details.material}</span>
              </>
            )}
            <span className="text-foreground-muted">Shipping</span>
            <span>{priceData.shippingFree ? "Free" : "Buyer pays"}</span>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-1">Description</h3>
            <p className="text-sm text-foreground-muted whitespace-pre-line">
              {details.description}
            </p>
          </div>

          <div className="text-xs text-foreground-muted">
            {images.length} photo{images.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t">
        <Button
          variant="outline"
          className=""
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          <ChevronLeft className="size-4 mr-1" />
          Back
        </Button>

        {step < steps.length - 1 ? (
          <Button
            className="bg-brand-primary text-white hover:bg-brand-primary-hover"
            disabled={
              (step === 0 && !canProceedStep0) ||
              (step === 2 && priceData.price < 1)
            }
            onClick={() => {
              if (step === 1) {
                detailsForm.handleSubmit(
                  () => setStep(2),
                  () => {}
                )();
              } else {
                setStep((s) => s + 1);
              }
            }}
          >
            Next
            <ChevronRight className="size-4 ml-1" />
          </Button>
        ) : (
          <Button
            className="bg-brand-primary text-white hover:bg-brand-primary-hover"
            onClick={handlePublish}
          >
            Publish listing
          </Button>
        )}
      </div>
    </div>
  );
}

export default function SellPage() {
  return (
    <AuthGuard>
      <SellContent />
    </AuthGuard>
  );
}
