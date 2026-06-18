"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * A thin, glowing progress bar pinned to the very top of the viewport that
 * fires the instant a navigation starts (link click or programmatic push) and
 * completes when the new route's pathname commits.
 *
 * It does not take over the screen — it's just a cheeky little "yep, heard you"
 * for every navigation, including the back button and router.push().
 */
export const TopLoader = () => {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
    // Jump to a visible head start, then trickle towards (but never reach) 90%.
    setProgress((p) => (p > 0 && p < 90 ? p : 10));
    if (trickle.current) clearInterval(trickle.current);
    trickle.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.max((90 - p) * 0.1, 0.4)));
    }, 200);
  }, []);

  const done = useCallback(() => {
    if (trickle.current) clearInterval(trickle.current);
    setProgress(100);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, []);

  // Trigger on internal link clicks + programmatic navigation (router.push/replace).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;

      const anchor = (e.target as HTMLElement)?.closest?.("a");
      const href = anchor?.getAttribute("href");
      if (!anchor || !href || href.startsWith("#")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        // Same page → no navigation, so no loader.
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        )
          return;
      } catch {
        return;
      }
      start();
    };

    document.addEventListener("click", onClick, true);

    // Patch history so programmatic navigations also light up the bar.
    const origPush = history.pushState;
    history.pushState = function (...args) {
      start();
      return origPush.apply(this, args as Parameters<typeof origPush>);
    };

    return () => {
      document.removeEventListener("click", onClick, true);
      history.pushState = origPush;
    };
  }, [start]);

  // Complete whenever the committed pathname changes.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    done();
  }, [pathname, done]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5"
      style={{ paddingTop: "var(--safe-area-inset-top)" }}
    >
      <div
        className="h-full rounded-r-full bg-primary transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          boxShadow:
            "0 0 10px var(--primary), 0 0 6px var(--primary)",
        }}
      />
    </div>
  );
};
