"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface HeroSlide {
  media: string;
  mediaType: "image" | "video";
  headline: string;
  subtext: string;
  ctaPrimary?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
}

interface BannerDto {
  id: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  order: number;
  active: boolean;
  createdAt: string;
}

const defaultSlides: HeroSlide[] = [
  {
    media: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80",
    mediaType: "image",
    headline: '"IT WAS AN INVESTMENT."',
    subtext:
      "Emotionally. We\u2019re where it goes next. Join our growing community of members buying and selling pre-loved fashion.",
    ctaPrimary: { label: "Sign up now", href: "/signup" },
    ctaSecondary: { label: "Sell now", href: "/sell" },
  },
  {
    media: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&q=80",
    mediaType: "image",
    headline: '"EVERY PIECE HAS A STORY."',
    subtext:
      "Give your wardrobe a second life. Buy and sell quality fashion with ease.",
    ctaPrimary: { label: "Sign up now", href: "/signup" },
    ctaSecondary: { label: "Sell now", href: "/sell" },
  },
  {
    media: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80",
    mediaType: "image",
    headline: '"SUSTAINABLE STYLE STARTS HERE."',
    subtext:
      "Discover unique finds from real people. Fashion that\u2019s kind to your closet and the planet.",
    ctaPrimary: { label: "Sign up now", href: "/signup" },
    ctaSecondary: { label: "Sell now", href: "/sell" },
  },
];

const AUTO_ADVANCE_MS = 6000;

function detectMediaType(url: string): "image" | "video" {
  return /\.(mp4|webm|ogg|mov)$/i.test(url) ? "video" : "image";
}

function bannerToSlide(banner: BannerDto): HeroSlide {
  return {
    media: banner.imageUrl ?? "",
    mediaType: banner.imageUrl ? detectMediaType(banner.imageUrl) : "image",
    headline: banner.title,
    subtext: banner.body ?? "",
    ctaPrimary: { label: "Sign up now", href: "/signup" },
    ctaSecondary: { label: "Sell now", href: "/sell" },
  };
}

export function CarouselHero() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fade, setFade] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [bannerSlides, setBannerSlides] = useState<HeroSlide[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    api.get<BannerDto[]>("/banners")
      .then((banners) => {
        const active = banners.filter((b) => b.active && b.imageUrl?.trim());
        if (active.length > 0) {
          setBannerSlides(active.map(bannerToSlide));
        }
      })
      .catch(() => {});
  }, []);

  const slides = bannerSlides.length > 0 ? bannerSlides : defaultSlides;

  const goTo = useCallback(
    (index: number) => {
      setFade(false);
      setTimeout(() => {
        setCurrent(index);
        setFade(true);
      }, 50);
    },
    []
  );

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
        setFade(true);
      }, 50);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, slides.length]);

  const slide = slides[current];

  return (
    <section
      className="group/hero relative w-full overflow-hidden rounded-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[50vh] min-h-[380px] max-h-[600px] md:h-[62vh] md:min-h-[460px]">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 ${mounted ? "transition-opacity duration-1000 ease-in-out" : ""}`}
            style={{ opacity: i === current && fade ? 1 : 0 }}
          >
            {s.mediaType === "video" ? (
              <video
                src={s.media}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={s.media}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                className="h-full w-full object-cover"
              />
            )}
          </div>
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center sm:px-8">
          <h1
            className="max-w-4xl text-5xl leading-tight tracking-wide text-white text-balance md:text-7xl lg:text-8xl"
            style={{ fontFamily: "var(--font-display)", transition: "opacity 0.5s ease", opacity: fade ? 1 : 0 }}
          >
            {slide.headline}
          </h1>
          <p
            className="mt-6 max-w-2xl text-base font-light leading-relaxed text-white/75 md:text-lg"
            style={{ transition: "opacity 0.5s ease 0.15s", opacity: fade ? 1 : 0 }}
          >
            {slide.subtext}
          </p>
          <div
            className="mt-8 flex w-full max-w-[280px] gap-3 sm:mt-10 sm:max-w-md sm:gap-4 lg:max-w-xs"
            style={{ transition: "opacity 0.5s ease 0.3s", opacity: fade ? 1 : 0 }}
          >
            <Link href={slide.ctaPrimary?.href ?? "/signup"} className="flex-1">
              <Button className="w-full rounded bg-brand-primary px-4 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.03] hover:bg-brand-primary-hover hover:shadow-xl md:px-6 md:py-5 md:text-base">
                {slide.ctaPrimary?.label ?? "Sign up now"}
              </Button>
            </Link>
            <Link href={slide.ctaSecondary?.href ?? "/sell"} className="flex-1">
              <Button className="w-full rounded border border-white/20 bg-white/10 px-4 py-4 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-[1.03] hover:bg-white/20 hover:shadow-xl md:px-6 md:py-5 md:text-base">
                {slide.ctaSecondary?.label ?? "List an item"}
              </Button>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-3 sm:flex">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="-m-2 p-2"
              aria-label={`Go to slide ${i + 1}`}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === current
                    ? "h-2.5 w-7 bg-white"
                    : "h-2.5 w-2.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
