"use client";

import { useState, useEffect, useCallback } from "react";
import { ONBOARDING_STORAGE_KEYS, TutorialVideoId } from "./content";
import { LATEST_CHANGELOG_ENTRY, LATEST_CHANGELOG_VERSION } from "@/lib/changelog";

export type OnboardingSurface = "none" | "intro" | "release" | "tip" | "video" | "whats-new";

function safeGetItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function safeSetItem(key: string, value: string): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Ignore storage quota or private-mode errors
    }
}

interface UseOnboardingOptions {
    /** True when WelcomeScreen, InteractiveTour, or another blocking modal/drawer is open */
    isBlocked?: boolean;
}

export function useOnboarding(options: UseOnboardingOptions = {}) {
    const { isBlocked = false } = options;

    const [hydrated, setHydrated] = useState(false);
    const [introSeen, setIntroSeen] = useState(true);
    const [tipSeen, setTipSeen] = useState(true);
    const [seenVersion, setSeenVersion] = useState<string | null>(null);

    const [activeVideoId, setActiveVideoId] = useState<TutorialVideoId | null>(null);
    const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
    const [isIntroReady, setIsIntroReady] = useState(false);
    const [isReleaseReady, setIsReleaseReady] = useState(false);
    const [isTipQueued, setIsTipQueued] = useState(false);

    useEffect(() => {
        setIntroSeen(safeGetItem(ONBOARDING_STORAGE_KEYS.introSeen) === "1");
        setTipSeen(safeGetItem(ONBOARDING_STORAGE_KEYS.tipAdvancedSeen) === "1");
        setSeenVersion(safeGetItem(ONBOARDING_STORAGE_KEYS.seenVersion));
        setHydrated(true);
    }, []);

    // Show intro card ~2.5s after workspace mounts (only once, when unblocked)
    useEffect(() => {
        if (!hydrated || introSeen || isBlocked) {
            setIsIntroReady(false);
            return;
        }
        const timer = window.setTimeout(() => {
            setIsIntroReady(true);
        }, 2500);
        return () => window.clearTimeout(timer);
    }, [hydrated, introSeen, isBlocked]);

    // Show release announcement card for returning visitors when latest entry has announce: true
    useEffect(() => {
        if (
            !hydrated ||
            !introSeen ||
            !LATEST_CHANGELOG_ENTRY?.announce ||
            seenVersion === LATEST_CHANGELOG_VERSION ||
            isBlocked
        ) {
            setIsReleaseReady(false);
            return;
        }
        const timer = window.setTimeout(() => {
            setIsReleaseReady(true);
        }, 2500);
        return () => window.clearTimeout(timer);
    }, [hydrated, introSeen, seenVersion, isBlocked]);

    const markIntroSeen = useCallback(() => {
        setIntroSeen(true);
        setIsIntroReady(false);
        safeSetItem(ONBOARDING_STORAGE_KEYS.introSeen, "1");
    }, []);

    const markTipSeen = useCallback(() => {
        setTipSeen(true);
        setIsTipQueued(false);
        safeSetItem(ONBOARDING_STORAGE_KEYS.tipAdvancedSeen, "1");
    }, []);

    const markVersionSeen = useCallback((version: string) => {
        setSeenVersion(version);
        setIsReleaseReady(false);
        safeSetItem(ONBOARDING_STORAGE_KEYS.seenVersion, version);
    }, []);

    const openVideo = useCallback((id: TutorialVideoId) => {
        setIsWhatsNewOpen(false);
        setActiveVideoId(id);
    }, []);

    const closeVideo = useCallback(() => {
        setActiveVideoId(null);
    }, []);

    const openWhatsNew = useCallback(() => {
        setActiveVideoId(null);
        setIsWhatsNewOpen(true);
    }, []);

    const closeWhatsNew = useCallback(() => {
        setIsWhatsNewOpen(false);
    }, []);

    const triggerAdvancedTip = useCallback(() => {
        if (!hydrated || tipSeen) return;
        setIsTipQueued(true);
    }, [hydrated, tipSeen]);

    // Priority order: interactive tour / external modals > video modal > what's new > intro card > release card > tip card
    let activeSurface: OnboardingSurface = "none";
    if (activeVideoId !== null) {
        activeSurface = "video";
    } else if (isWhatsNewOpen) {
        activeSurface = "whats-new";
    } else if (!isBlocked) {
        if (isIntroReady && !introSeen) {
            activeSurface = "intro";
        } else if (
            isReleaseReady &&
            introSeen &&
            LATEST_CHANGELOG_ENTRY?.announce &&
            seenVersion !== LATEST_CHANGELOG_VERSION
        ) {
            activeSurface = "release";
        } else if (isTipQueued && !tipSeen) {
            activeSurface = "tip";
        }
    }

    return {
        hydrated,
        introSeen,
        markIntroSeen,
        tipSeen,
        markTipSeen,
        seenVersion,
        markVersionSeen,
        activeSurface,
        activeVideoId,
        openVideo,
        closeVideo,
        isWhatsNewOpen,
        openWhatsNew,
        closeWhatsNew,
        triggerAdvancedTip,
    };
}
