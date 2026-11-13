"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Play, ArrowRight, Compass } from "lucide-react";
import { getTutorialVideo, TutorialVideoId } from "@/lib/onboarding/content";
import { getTranslation, Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface VideoModalProps {
    videoId: TutorialVideoId | null;
    language: Language;
    onClose: () => void;
    onSelectVideo: (id: TutorialVideoId) => void;
    onOpenTour: () => void;
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
    onOpenTour,
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

    // Active chapter = last chapter whose timestamp <= currentTime + 0.5s
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
                className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
                onClick={handleClose}
                aria-hidden="true"
            />

            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="video-modal-title"
                className="relative z-10 w-full max-w-5xl max-h-[92vh] bg-white dark:bg-[#1c1c1f] border border-[#e6e6e3] dark:border-[#2e2e34] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-3.5 sm:px-6 border-b border-[#e6e6e3] dark:border-[#2e2e34] flex items-center justify-between gap-4 bg-[#fbfbfa] dark:bg-[#18181b] shrink-0">
                    <div className="min-w-0">
                        <h2
                            id="video-modal-title"
                            className="text-[16px] sm:text-[17px] font-semibold text-[#141413] dark:text-[#f4f4f6] tracking-tight truncate"
                        >
                            {video.title[language]}
                        </h2>
                        <p className="text-[12.5px] text-[#6e6e77] dark:text-[#a1a1aa] truncate mt-0.5">
                            {video.blurb[language]}
                        </p>
                    </div>
                    <button
                        ref={closeBtnRef}
                        type="button"
                        onClick={handleClose}
                        aria-label={t.closeVideo}
                        title={t.closeVideo}
                        className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-2 rounded-lg text-[#6e6e77] dark:text-[#a1a1aa] hover:text-[#141413] dark:hover:text-[#f4f4f6] hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors flex items-center justify-center shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body: Video + Chapters */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[1fr_270px] gap-4 custom-scrollbar">
                    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-[#e6e6e3] dark:border-[#2e2e34]">
                        <video
                            ref={videoRef}
                            controls
                            playsInline
                            preload="metadata"
                            poster={video.poster}
                            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <div className="flex flex-col min-h-0">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6e6e77] dark:text-[#a1a1aa] mb-2 px-1">
                            {t.videoChapters}
                        </div>
                        <div className="space-y-1 overflow-y-auto max-h-[240px] lg:max-h-[360px] pr-1 custom-scrollbar">
                            {video.chapters.map((ch, idx) => {
                                const isActive = idx === activeChapterIdx;
                                return (
                                    <button
                                        key={`${video.id}-${ch.at}`}
                                        type="button"
                                        onClick={() => handleSeekChapter(ch.at)}
                                        className={cn(
                                            "w-full min-h-[44px] sm:min-h-0 px-2.5 py-2 rounded-lg text-left flex items-center gap-2.5 transition-colors text-[12.5px]",
                                            isActive
                                                ? "bg-[#f3f3f0] dark:bg-[#27272a] text-[#141413] dark:text-[#f4f4f6] font-semibold"
                                                : "text-[#6e6e77] dark:text-[#a1a1aa] hover:bg-neutral-100/80 dark:hover:bg-white/[0.05] hover:text-[#141413] dark:hover:text-[#f4f4f6]"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "font-mono text-[11px] px-1.5 py-0.5 rounded shrink-0 tabular-nums",
                                                isActive
                                                    ? "bg-[#141413] text-white dark:bg-[#f4f4f0] dark:text-[#141413]"
                                                    : "bg-neutral-100 dark:bg-[#242422] text-[#6e6e77] dark:text-[#a1a1aa]"
                                            )}
                                        >
                                            {formatSeconds(ch.at)}
                                        </span>
                                        <span className="truncate flex-1">{ch.title[language]}</span>
                                        {isActive && <Play className="w-3 h-3 shrink-0 fill-current" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 sm:px-6 border-t border-[#e6e6e3] dark:border-[#2e2e34] bg-[#fbfbfa] dark:bg-[#18181b] flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            handleClose();
                            onOpenTour();
                        }}
                        className="btn-tactile-light min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-lg text-[12.5px] font-medium flex items-center gap-1.5"
                    >
                        <Compass className="w-3.5 h-3.5 text-[#5b82a6] dark:text-[#7dd3fc]" />
                        <span>{t.openInteractiveTour}</span>
                    </button>

                    {video.id === "start" && (
                        <button
                            type="button"
                            onClick={() => onSelectVideo("advanced")}
                            className="btn-tactile-dark min-h-[44px] sm:min-h-0 px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium flex items-center gap-1.5"
                        >
                            <span>{t.nextAdvancedTutorial}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
