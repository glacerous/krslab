"use client";

import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Play, X } from "lucide-react";
import type { ChangelogMedia as ChangelogMediaItem } from "@/lib/changelog";
import type { Language } from "@/lib/i18n";

interface ChangelogMediaProps {
    media: ChangelogMediaItem;
    lang: Language;
    mode: "frame" | "thumb" | "card";
    title?: string;
}

const ASPECT_CLASS: Record<ChangelogMediaItem["aspect"], string> = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1.91/1": "aspect-[1.91/1]",
};

function getSaveDataEnabled(): boolean {
    if (typeof navigator === "undefined") return false;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return Boolean(conn?.saveData);
}

export function ChangelogMedia({ media, lang, mode, title }: ChangelogMediaProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
    const [inView, setInView] = useState(false);
    const [videoReady, setVideoReady] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);
    const lastFocusedRef = useRef<HTMLElement | null>(null);

    const alt = media.alt[lang];
    const aspectClass = ASPECT_CLASS[media.aspect];

    // Respect prefers-reduced-motion and Save-Data on mount and media query changes
    useEffect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => {
            setShouldAutoPlay(!mq.matches && !getSaveDataEnabled());
        };
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // Lazy-play inline video only in "frame" mode when >= 50% visible
    useEffect(() => {
        if (mode !== "frame" || media.type !== "video") return;
        const el = containerRef.current;
        if (!el || typeof IntersectionObserver === "undefined") return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                setInView(Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.5));
            },
            { threshold: [0, 0.5, 1] }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [mode, media.type]);

    useEffect(() => {
        if (mode !== "frame" || media.type !== "video") return;
        const v = videoRef.current;
        if (!v) return;

        if (shouldAutoPlay && inView && !lightboxOpen) {
            v.play().catch(() => {
                // Autoplay may be blocked by browser policy; poster remains visible.
            });
        } else {
            v.pause();
        }
    }, [mode, media.type, shouldAutoPlay, inView, lightboxOpen]);

    // Lightbox keyboard handling (Esc + focus trap + focus restore)
    useEffect(() => {
        if (!lightboxOpen) return;
        lastFocusedRef.current = document.activeElement as HTMLElement | null;
        closeBtnRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                setLightboxOpen(false);
                return;
            }
            if (e.key === "Tab" && modalRef.current) {
                const focusables = modalRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, video[controls], [tabindex]:not([tabindex="-1"])'
                );
                if (focusables.length === 0) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === first || !modalRef.current.contains(document.activeElement)) {
                        e.preventDefault();
                        last.focus();
                    }
                } else if (document.activeElement === last || !modalRef.current.contains(document.activeElement)) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            const target = lastFocusedRef.current ?? triggerRef.current;
            target?.focus?.();
        };
    }, [lightboxOpen]);

    const posterSrc = media.type === "video" ? media.poster ?? "" : media.src;
    const openLabel =
        lang === "id"
            ? media.type === "video"
                ? `Putar cuplikan: ${alt}`
                : `Perbesar gambar: ${alt}`
            : media.type === "video"
                ? `Play clip: ${alt}`
                : `Expand image: ${alt}`;

    return (
        <>
            <div
                ref={containerRef}
                className={
                    mode === "thumb"
                        ? "relative w-28 sm:w-32 shrink-0 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900"
                        : "relative w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900"
                }
            >
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    aria-label={openLabel}
                    className={`group relative block w-full ${aspectClass} overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white`}
                >
                    {mode === "frame" && media.type === "video" && shouldAutoPlay ? (
                        <>
                            {!videoReady && posterSrc && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={posterSrc}
                                    alt={alt}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            )}
                            <video
                                ref={videoRef}
                                src={media.src}
                                poster={media.poster}
                                preload="none"
                                muted
                                loop
                                playsInline
                                onLoadedData={() => setVideoReady(true)}
                                aria-label={alt}
                                className="h-full w-full object-cover"
                            />
                        </>
                    ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={posterSrc}
                            alt={alt}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.015]"
                        />
                    )}

                    <span
                        aria-hidden="true"
                        className={
                            mode === "thumb"
                                ? "absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-full bg-neutral-950/75 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
                                : "absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-neutral-950/75 px-2.5 py-1 text-[11px] font-medium text-white opacity-90 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                        }
                    >
                        {media.type === "video" ? (
                            <>
                                <Play className={mode === "thumb" ? "h-2.5 w-2.5 fill-current" : "h-3 w-3 fill-current"} />
                                {mode !== "thumb" && (
                                    <span>
                                        {media.durationSec ? `${media.durationSec}s` : lang === "id" ? "Putar" : "Watch"}
                                    </span>
                                )}
                            </>
                        ) : (
                            <Maximize2 className={mode === "thumb" ? "h-2.5 w-2.5" : "h-3 w-3"} />
                        )}
                    </span>
                </button>
            </div>

            {lightboxOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={title ?? alt}
                    className="fixed inset-0 z-[210] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setLightboxOpen(false);
                    }}
                >
                    <div
                        ref={modalRef}
                        className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-2xl"
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
                            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                {title ?? alt}
                            </p>
                            <button
                                ref={closeBtnRef}
                                type="button"
                                onClick={() => setLightboxOpen(false)}
                                aria-label={lang === "id" ? "Tutup pratinjau" : "Close preview"}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className={`relative w-full ${aspectClass} bg-neutral-950`}>
                            {media.type === "video" ? (
                                <video
                                    src={media.src}
                                    poster={media.poster}
                                    controls
                                    autoPlay={shouldAutoPlay}
                                    loop
                                    playsInline
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={media.src}
                                    alt={alt}
                                    className="h-full w-full object-contain"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
