"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight } from "lucide-react";
import { getTutorialVideo, TutorialVideoId, VIDEOS } from "@/lib/onboarding/content";
import { getTranslation, Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface VideoModalProps {
    videoId: TutorialVideoId | null;
    language: Language;
    onClose: () => void;
    onSelectVideo: (id: TutorialVideoId) => void;
}

function formatSeconds(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoModal({
    videoId,
    language,
    onClose,
    onSelectVideo,
}: VideoModalProps) {
    const isOpen = videoId !== null;
    const video = videoId ? getTutorialVideo(videoId) : null;
    const t = getTranslation(language);

    const dialogRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const [currentTime, setCurrentTime] = useState(0);

    const releaseVideo = useCallback(() => {
        const el = videoRef.current;
        if (!el) return;
        el.pause();
        el.removeAttribute("src");
        el.load();
    }, []);

    const handleClose = useCallback(() => {
        releaseVideo();
        onClose();
    }, [releaseVideo, onClose]);

    // Capture and restore focus
    useEffect(() => {
        if (!isOpen) return;
        previousFocusRef.current = document.activeElement as HTMLElement | null;
        const raf = window.requestAnimationFrame(() => {
            closeBtnRef.current?.focus();
        });
        return () => {
            window.cancelAnimationFrame(raf);
            releaseVideo();
            previousFocusRef.current?.focus?.();
        };
    }, [isOpen, releaseVideo]);

    // Reset time and autoplay (if reduced motion is not preferred) when videoId changes
    useEffect(() => {
        if (!videoId || !video) return;
        setCurrentTime(0);
        const el = videoRef.current;
        if (!el) return;
        el.src = video.src;
        el.load();

        const prefersReduced =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!prefersReduced) {
            el.play().catch(() => {
                // Browser may block unmuted autoplay; user can click play in controls
            });
        }
    }, [videoId, video]);

    // Esc closes + Tab focus trap
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
                return;
            }
            if (e.key === "Tab" && dialogRef.current) {
                const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [href], video, [tabindex]:not([tabindex="-1"])'
                );
                if (focusables.length === 0) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown, true);
        return () => window.removeEventListener("keydown", handleKeyDown, true);
    }, [isOpen, handleClose]);

    if (!isOpen || !video || typeof document === "undefined") return null;

    let activeChapterIdx = -1;
    for (let i = 0; i < video.chapters.length; i++) {
        if (currentTime + 0.5 >= video.chapters[i].at) {
            activeChapterIdx = i;
        }
    }

    const handleSeekChapter = (at: number) => {
        const el = videoRef.current;
        if (!el) return;
        el.currentTime = at;
        setCurrentTime(at);
        el.play().catch(() => {});
    };

    return createPortal(
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-3 sm:p-5">
            <div
                className="absolute inset-0 bg-neutral-900/45 backdrop-blur-sm"
                onClick={handleClose}
                aria-hidden="true"
            />

            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="video-modal-title"
                className="relative z-10 w-full max-w-5xl max-h-[92vh] bg-[#f9f9f8] dark:bg-[#141418] border border-[#e6e6e3] dark:border-[#26262e] rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_300px] animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left: Flush Video Stage (no nested box or header/footer bars) */}
                <div className="flex flex-col justify-between bg-[#f9f9f8] dark:bg-[#141418] min-w-0">
                    <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <span className="font-doodle text-[16px] font-bold text-[#5b82a6] dark:text-[#7dd3fc] block leading-none mb-1">
                                {video.id === "start" ? "01 · getting started" : "02 · advanced workflow"}
                            </span>
                            <h2
                                id="video-modal-title"
                                className="text-[16px] sm:text-[17px] font-semibold text-[#141413] dark:text-[#f4f4f6] tracking-tight truncate"
                            >
                                {video.title[language]}
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            aria-label={t.closeVideo}
                            title={t.closeVideo}
                            className="lg:hidden min-w-[44px] min-h-[44px] p-2 rounded-lg text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:bg-neutral-200/60 dark:hover:bg-white/[0.08] transition-colors flex items-center justify-center shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="w-full aspect-video bg-black/5 dark:bg-black/40 overflow-hidden">
                        <video
                            ref={videoRef}
                            controls
                            playsInline
                            preload="metadata"
                            poster={video.poster}
                            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                            className="w-full h-full block object-cover"
                        />
                    </div>
                </div>

                {/* Right: Chapters Rail */}
                <div className="flex flex-col min-h-0 bg-white dark:bg-[#18181c] border-t lg:border-t-0 lg:border-l border-[#e6e6e3] dark:border-[#26262e]">
                    <div className="px-4 pt-3.5 pb-3 flex items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#f3f3f0] dark:bg-[#202024] border border-[#e6e6e3] dark:border-[#2e2e34]">
                            {VIDEOS.map((v, i) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => onSelectVideo(v.id)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors",
                                        v.id === video.id
                                            ? "bg-white dark:bg-[#2a2a30] text-[#141413] dark:text-[#f4f4f6] shadow-xs"
                                            : "text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6]"
                                    )}
                                >
                                    {i === 0
                                        ? language === "id"
                                            ? "01 Mulai"
                                            : "01 Start"
                                        : language === "id"
                                          ? "02 Lanjutan"
                                          : "02 Advanced"}
                                </button>
                            ))}
                        </div>

                        <button
                            ref={closeBtnRef}
                            type="button"
                            onClick={handleClose}
                            aria-label={t.closeVideo}
                            title={t.closeVideo}
                            className="hidden lg:flex p-1.5 rounded-lg text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors items-center justify-center"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-baseline justify-between px-4 pb-2 shrink-0">
                        <span className="font-doodle text-[16px] font-bold text-[#5b82a6] dark:text-[#7dd3fc]">
                            {t.videoChapters.toLowerCase()}
                        </span>
                        <span className="font-mono text-[11px] text-[#8a8a94] dark:text-[#71717a]">
                            {formatSeconds(video.durationSec)}
                        </span>
                    </div>

                    <div className="flex-1 divide-y divide-[#e6e6e3] dark:divide-[#26262e] border-t border-[#e6e6e3] dark:border-[#26262e] overflow-y-auto max-h-[240px] lg:max-h-none custom-scrollbar">
                        {video.chapters.map((ch, idx) => {
                            const isActive = idx === activeChapterIdx;
                            return (
                                <button
                                    key={`${video.id}-${ch.at}`}
                                    type="button"
                                    onClick={() => handleSeekChapter(ch.at)}
                                    className={cn(
                                        "w-full min-h-[44px] sm:min-h-0 px-4 py-2.5 text-left flex items-baseline gap-2.5 transition-colors text-[12.5px]",
                                        isActive
                                            ? "bg-[#f9f9f8] dark:bg-[#1e1e24] text-[#141413] dark:text-[#f4f4f6] font-semibold"
                                            : "text-[#6e6e77] dark:text-[#a1a1aa] hover:bg-[#f9f9f8]/70 dark:hover:bg-white/[0.04] hover:text-[#141413] dark:hover:text-[#f4f4f6]"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "font-doodle text-[15px] font-bold w-5 shrink-0",
                                            isActive
                                                ? "text-amber-500"
                                                : "text-[#5b82a6]/70 dark:text-[#7dd3fc]/70"
                                        )}
                                    >
                                        {(idx + 1).toString().padStart(2, "0")}
                                    </span>
                                    <span className="truncate flex-1">{ch.title[language]}</span>
                                    <span
                                        className={cn(
                                            "font-mono text-[11px] shrink-0 tabular-nums",
                                            isActive
                                                ? "text-[#141413] dark:text-[#f4f4f6]"
                                                : "text-[#8a8a94] dark:text-[#71717a]"
                                        )}
                                    >
                                        {formatSeconds(ch.at)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {video.id === "start" && (
                        <div className="p-3 border-t border-[#e6e6e3] dark:border-[#26262e] shrink-0">
                            <button
                                type="button"
                                onClick={() => onSelectVideo("advanced")}
                                className="btn-tactile-dark w-full min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-lg text-[12.5px] font-medium flex items-center justify-center gap-1.5"
                            >
                                <span>{t.nextAdvancedTutorial}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
