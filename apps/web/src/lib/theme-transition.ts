import type React from "react";
import { flushSync } from "react-dom";

type ViewTransitionDoc = Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

function canAnimateViewTransition(): ViewTransitionDoc | null {
    if (typeof window === "undefined") return null;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
    const doc = document as ViewTransitionDoc;
    return typeof doc.startViewTransition === "function" ? doc : null;
}

/** Switches light/dark theme with a radial View Transition from the clicked control when supported. */
export function switchThemeWithTransition(
    nextTheme: "light" | "dark",
    currentTheme: string | undefined,
    setTheme: (theme: string) => void,
    e?: React.MouseEvent<HTMLElement>
): void {
    if (currentTheme === nextTheme) return;

    const doc = canAnimateViewTransition();
    if (!doc?.startViewTransition) {
        setTheme(nextTheme);
        return;
    }

    const rect = e?.currentTarget?.getBoundingClientRect();
    const x = e?.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth / 2);
    const y = e?.clientY || (rect ? rect.top + rect.height / 2 : window.innerHeight / 2);
    const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
    );

    const root = document.documentElement;
    root.style.setProperty("--theme-x", `${x}px`);
    root.style.setProperty("--theme-y", `${y}px`);
    root.style.setProperty("--theme-r", `${radius}px`);
    root.setAttribute("data-theme-transition", nextTheme);

    const transition = doc.startViewTransition(() => {
        flushSync(() => {
            root.classList.toggle("dark", nextTheme === "dark");
            setTheme(nextTheme);
        });
    });
    transition.finished.finally(() => {
        root.removeAttribute("data-theme-transition");
    });
}

/** Switches EN/ID language with a directional editorial crossfade View Transition when supported. */
export function switchLanguageWithTransition(
    nextLang: "en" | "id",
    currentLang: "en" | "id",
    setLanguage: (lang: "en" | "id") => void
): void {
    if (currentLang === nextLang) return;

    const doc = canAnimateViewTransition();
    if (!doc?.startViewTransition) {
        setLanguage(nextLang);
        return;
    }

    const root = document.documentElement;
    root.setAttribute("data-lang-transition", nextLang);

    const transition = doc.startViewTransition(() => {
        flushSync(() => {
            setLanguage(nextLang);
        });
    });
    transition.finished.finally(() => {
        root.removeAttribute("data-lang-transition");
    });
}
