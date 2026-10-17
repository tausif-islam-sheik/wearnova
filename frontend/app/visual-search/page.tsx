"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImageIcon, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/shared/ListingCard";
import { useListingStore } from "@/stores/useListingStore";

const STORAGE_KEY = "dw-visual-search";

type ColorBucket =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "pink"
  | "brown"
  | "black"
  | "white"
  | "grey";

const COLOR_BUCKET_NAMES: Record<ColorBucket, string> = {
  red: "Red",
  orange: "Orange",
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
  pink: "Pink",
  brown: "Brown",
  black: "Black",
  white: "White",
  grey: "Grey",
};

const LISTING_COLOR_TO_BUCKET: Record<string, ColorBucket> = {
  red: "red",
  burgundy: "red",
  orange: "orange",
  yellow: "yellow",
  gold: "yellow",
  green: "green",
  blue: "blue",
  navy: "blue",
  pink: "pink",
  brown: "brown",
  beige: "brown",
  cream: "brown",
  black: "black",
  white: "white",
  grey: "grey",
  gray: "grey",
  silver: "grey",
};

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      default:
        h = ((r - g) / d + 4) * 60;
    }
  }
  return { h, s, l };
}

function classifyColor(r: number, g: number, b: number): ColorBucket {
  const { h, s, l } = rgbToHsl(r, g, b);
  if (l < 0.13) return "black";
  if (l > 0.86) return "white";
  if (s < 0.12) return l > 0.55 ? "white" : "grey";
  if (h < 15 || h >= 345) return "red";
  if (h < 45) return "orange";
  if (h < 70) return "yellow";
  if (h < 160) return "green";
  if (h < 200) return "blue";
  if (h < 260) return "blue";
  if (h < 290) return "pink";
  return "pink";
}

function listingColorBucket(color: string | null | undefined): ColorBucket | null {
  if (!color) return null;
  return LISTING_COLOR_TO_BUCKET[color.toLowerCase()] ?? null;
}

async function analyzeImageColors(src: string): Promise<ColorBucket[]> {
  const imgEl = document.createElement("img");
  imgEl.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    imgEl.onload = () => resolve();
    imgEl.onerror = () => reject(new Error("image load failed"));
    imgEl.src = src;
  });

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  ctx.drawImage(imgEl, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const counts = new Map<ColorBucket, number>();
  for (let i = 0; i < data.length; i += 4) {
    const bucket = classifyColor(data[i], data[i + 1], data[i + 2]);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([bucket]) => bucket);
}

export default function VisualSearchPage() {
  const listings = useListingStore((s) => s.listings);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [image, setImage] = useState<{ src: string; name: string } | null>(
    () => {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as { src: string; name: string }) : null;
      } catch {
        return null;
      }
    }
  );
  const [detectedColors, setDetectedColors] = useState<ColorBucket[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const matches = useMemo(() => {
    if (!image || detectedColors.length === 0) return null;
    const active = listings.filter((l) => l.status === "active");
    const result = active.filter((l) => {
      const bucket = listingColorBucket(l.color);
      return bucket !== null && detectedColors.includes(bucket);
    });
    return result;
  }, [image, detectedColors, listings]);

  const recent = useMemo(
    () =>
      listings
        .filter((l) => l.status === "active")
        .sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )
        .slice(0, 10),
    [listings]
  );

  const pickPhoto = () => fileInputRef.current?.click();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose an image smaller than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const src = reader.result as string;
      setImage({ src, name: file.name });
      setAnalyzing(true);
      setDetectedColors([]);
      try {
        const colors = await analyzeImageColors(src);
        setDetectedColors(colors);
      } catch {
        // no colors detected
      } finally {
        setAnalyzing(false);
      }
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ src, name: file.name })
        );
      } catch {
        // storage full — keep in-memory only
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-1">
        Visual search
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Upload a photo and we&apos;ll analyze its colors to find matching
        items.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />

      <div className="mb-8">
        {image ? (
          <div className="flex items-start gap-4">
            <div className="relative size-40 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted">
              <Image
                src={image.src}
                alt="Uploaded photo"
                fill
                unoptimized
                className="object-cover"
                sizes="160px"
              />
            </div>
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-foreground-muted break-all">
                {image.name}
              </p>
              {analyzing ? (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Analyzing photo colors...
                </p>
              ) : detectedColors.length > 0 ? (
                <p className="text-sm text-foreground">
                  Detected colors:{" "}
                  <span className="font-medium">
                    {detectedColors
                      .map((c) => COLOR_BUCKET_NAMES[c])
                      .join(", ")}
                  </span>
                </p>
              ) : null}
              <Button variant="outline" className="rounded" onClick={pickPhoto}>
                <Camera className="size-4" />
                Try another photo
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={pickPhoto}
            className="flex w-full max-w-lg flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-surface-muted px-6 py-12 text-foreground-muted transition-colors hover:border-brand-primary/50 hover:text-brand-primary cursor-pointer"
          >
            <ImageIcon className="size-8" />
            <span className="text-sm font-medium">
              Click to upload a photo
            </span>
            <span className="text-xs">JPG or PNG, up to 5MB</span>
          </button>
        )}
      </div>

      {image && !analyzing && matches && matches.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {matches.length} match{matches.length === 1 ? "" : "es"}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {matches.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {image && !analyzing && detectedColors.length > 0 && matches?.length === 0 && (
        <section className="mb-8">
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface-muted px-6 py-10 text-center">
            <SearchX className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No color matches found
            </p>
            <p className="text-xs text-muted-foreground">
              No items are currently listed in{" "}
              {detectedColors
                .map((c) => COLOR_BUCKET_NAMES[c].toLowerCase())
                .join(" or ")}{" "}
              — try another photo or browse recent items below.
            </p>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Recently listed
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {recent.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}
