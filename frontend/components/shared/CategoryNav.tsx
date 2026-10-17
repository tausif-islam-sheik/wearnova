"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { categories } from "@/mocks/categories";
import { Container } from "@/components/layout/container";

export function CategoryNav() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const activeCat = categories.find((c) => c.id === activeCategory);

  const isDesktopMenu = () => window.innerWidth >= 1024;

  const fadeMs = 200;

  const openMenu = useCallback((catId: string) => {
    if (!isDesktopMenu()) return;
    clearTimeout(closeTimer.current!);
    setActiveCategory(catId);
    setActiveSub(null);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setVisible(true))
    );
  }, []);

  const scheduleClose = useCallback(() => {
    clearTimeout(closeTimer.current!);
    closeTimer.current = setTimeout(() => {
      setVisible(false);
      closeTimer.current = setTimeout(() => {
        setActiveCategory(null);
        setActiveSub(null);
      }, fadeMs);
    }, 120);
  }, []);

  const cancelClose = useCallback(() => {
    clearTimeout(closeTimer.current!);
    setVisible(true);
  }, []);

  const closeMenu = useCallback(() => {
    clearTimeout(closeTimer.current!);
    setVisible(false);
    closeTimer.current = setTimeout(() => {
      setActiveCategory(null);
      setActiveSub(null);
    }, fadeMs);
  }, []);

  useEffect(() => {
    return () => clearTimeout(closeTimer.current!);
  }, []);

  return (
    <div
      className="block relative border-t border-border-subtle"
      onMouseLeave={scheduleClose}
    >
      {activeCategory &&
        createPortal(
          <div
            className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ease-out ${
              visible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeMenu}
          />,
          document.body
        )}
      <Container>
        <nav className="flex items-center gap-1 h-10 overflow-x-auto overscroll-x-contain scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/c/${cat.slug}`}
              onMouseEnter={() => openMenu(cat.id)}
              className={`px-3 py-1.5 text-sm whitespace-nowrap rounded transition-colors ${
                activeCategory === cat.id
                  ? "text-brand-primary font-medium border-b-2 border-brand-primary"
                  : "text-foreground-muted hover:text-brand-primary hover:bg-brand-primary/5"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      </Container>

      {/* Mega-menu */}
      {activeCat && (
        <div
          className={`absolute top-full left-0 w-full z-50 transition-[opacity,transform] duration-200 ease-out will-change-[opacity,transform] ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
          }`}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="border-t border-border-subtle bg-background shadow-lg">
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex py-6">
                {/* Left sidebar - subcategory groups */}
                <div className="w-56 shrink-0 border-r border-border-subtle pr-4">
                  <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-3 px-2">
                    {activeCat.name}
                  </p>
                  <div className="space-y-0.5">
                    <Link
                      href={`/c/${activeCat.slug}`}
                      onClick={closeMenu}
                      className="block px-2 py-1.5 text-sm text-foreground hover:bg-brand-primary/5 hover:text-brand-primary rounded-md transition-colors font-medium"
                    >
                      All {activeCat.name}
                    </Link>
                    {activeCat.subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onMouseEnter={() => setActiveSub(sub.id)}
                        onClick={() => {
                          if (sub.subcategories.length === 0) {
                            closeMenu();
                          } else {
                            setActiveSub(sub.id);
                          }
                        }}
                        className={`block w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                          activeSub === sub.id
                            ? "bg-brand-primary/10 text-brand-primary font-medium"
                            : "text-foreground hover:bg-brand-primary/5 hover:text-brand-primary"
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right panel - sub-items of selected subcategory */}
                <div className="flex-1 pl-6">
                  {activeSub ? (
                    (() => {
                      const sub = activeCat.subcategories.find(
                        (s) => s.id === activeSub
                      );
                      if (!sub) return null;
                      return (
                        <div>
                          <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-3">
                            {sub.name}
                          </p>
                          <div className="grid grid-cols-2 gap-1">
                            <Link
                              href={`/c/${activeCat.slug}/${sub.slug}`}
                              onClick={closeMenu}
                              className="px-2 py-1.5 text-sm text-foreground hover:bg-brand-primary/5 hover:text-brand-primary rounded-md transition-colors font-medium"
                            >
                              All {sub.name}
                            </Link>
                            {sub.subcategories.map((item) => (
                              <Link
                                key={item.id}
                                href={`/c/${activeCat.slug}/${sub.slug}/${item.slug}`}
                                onClick={closeMenu}
                                className="px-2 py-1.5 text-sm text-foreground-muted hover:text-brand-primary hover:bg-brand-primary/5 rounded-md transition-colors"
                              >
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-3">
                        Browse {activeCat.name}
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {activeCat.subcategories.map((sub) => (
                          <div key={sub.id}>
                            <Link
                              href={`/c/${activeCat.slug}/${sub.slug}`}
                              onClick={closeMenu}
                              className="block px-2 py-1.5 text-sm text-foreground hover:bg-brand-primary/5 hover:text-brand-primary rounded-md transition-colors font-medium"
                            >
                              {sub.name}
                            </Link>
                            <div className="ml-2">
                              {sub.subcategories.slice(0, 4).map((item) => (
                                <Link
                                  key={item.id}
                                  href={`/c/${activeCat.slug}/${sub.slug}/${item.slug}`}
                                  onClick={closeMenu}
                                  className="block px-2 py-1 text-xs text-foreground-muted hover:text-brand-primary hover:bg-brand-primary/5 rounded-md transition-colors"
                                >
                                  {item.name}
                                </Link>
                              ))}
                              {sub.subcategories.length > 4 && (
                                <Link
                                  href={`/c/${activeCat.slug}/${sub.slug}`}
                                  onClick={closeMenu}
                                  className="block px-2 py-1 text-xs text-brand-primary hover:underline"
                                >
                                  See all
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
