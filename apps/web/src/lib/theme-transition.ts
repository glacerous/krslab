import type React from "react";

/** Switches light/dark theme with a radial View Transition from the clicked control when supported. */
export function switchThemeWithTransition(
    nextTheme: "light" | "dark",
    currentTheme: string | undefined,
    setTheme: (theme: string) => void,
    e?: React.MouseEvent<HTMLElement>
): void {
    if (currentTheme === nextTheme) return;

    const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };

    if (prefersReducedMotion || typeof doc.startViewTransition !== "function") {
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
        root.classList.toggle("dark", nextTheme === "dark");
        setTheme(nextTheme);
    });
    transition.finished.finally(() => {
        root.removeAttribute("data-theme-transition");
    });
}
