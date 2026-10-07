"use client";

import { useEffect, useRef } from "react";

// The brand name set very large: a faint outline that is always there, and a
// second copy on top that only shows where a blue light falls inside the
// letters. The light glides after the pointer and drifts on its own until
// the pointer moves. Decoration only, so screen readers skip it.
export function GlowWordmark({ children }: { children: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let onScreen = false;
    let pointer: { x: number; y: number } | null = null;
    let x = 50;
    let y = 45;

    // Eases 7% of the way to the target each frame, so it never snaps.
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const targetX = pointer ? pointer.x : 50 + 36 * Math.sin(now / 2600);
      const targetY = pointer ? pointer.y : 45;
      x += (targetX - x) * 0.07;
      y += (targetY - y) * 0.07;
      el.style.setProperty("--gx", `${x.toFixed(2)}%`);
      el.style.setProperty("--gy", `${y.toFixed(2)}%`);
    };

    // Runs only while the wordmark is on screen and motion is allowed.
    const restart = () => {
      cancelAnimationFrame(frame);
      if (onScreen && !still.matches) frame = requestAnimationFrame(tick);
    };

    const move = (event: PointerEvent) => {
      if (!onScreen) return;
      const box = el.getBoundingClientRect();
      pointer = {
        x: ((event.clientX - box.left) / box.width) * 100,
        y: ((event.clientY - box.top) / box.height) * 100,
      };
    };

    const watcher = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      restart();
    });
    watcher.observe(el);
    window.addEventListener("pointermove", move, { passive: true });
    still.addEventListener("change", restart);

    return () => {
      cancelAnimationFrame(frame);
      watcher.disconnect();
      window.removeEventListener("pointermove", move);
      still.removeEventListener("change", restart);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="wordmark">
      <span className="wordmark-outline">{children}</span>
      <span className="wordmark-light">{children}</span>
    </div>
  );
}
