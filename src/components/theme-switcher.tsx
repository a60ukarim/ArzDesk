"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useClientReady } from "@/lib/use-client-ready";
import { useTheme } from "./theme-provider";
export function ThemeSwitcher() {
  const ready = useClientReady();
  const { resolved, setTheme } = useTheme();
  const pendant = useRef<HTMLSpanElement>(null);
  const cord = useRef<HTMLSpanElement>(null);
  const animations = useRef<Animation[]>([]);
  useEffect(() => () => animations.current.forEach((a) => a.cancel()), []);
  function pull() {
    setTheme(resolved === "dark" ? "light" : "dark");
    // Changing appearance still works if the browser cannot animate elements.
    if (!pendant.current?.animate || !cord.current?.animate) return;
    // Cancel and replay on every activation, including rapid repeated clicks.
    animations.current.forEach((a) => a.cancel());
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const movement = reduced
      ? [
          { transform: "translateY(0)" },
          { transform: "translateY(6px)", offset: 0.4 },
          { transform: "translateY(0)" },
        ]
      : [
          { transform: "translateY(0) rotate(0deg)" },
          { transform: "translateY(21px) rotate(-7deg)", offset: 0.23 },
          { transform: "translateY(-2px) rotate(15deg)", offset: 0.43 },
          { transform: "translateY(1px) rotate(-10deg)", offset: 0.64 },
          { transform: "translateY(0) rotate(5deg)", offset: 0.82 },
          { transform: "translateY(0) rotate(0deg)" },
        ];
    const stretch = reduced
      ? [
          { transform: "scaleY(1)" },
          { transform: "scaleY(1.375)", offset: 0.4 },
          { transform: "scaleY(1)" },
        ]
      : [
          { transform: "scaleY(1) rotate(0deg)" },
          { transform: "scaleY(2.3) rotate(-7deg)", offset: 0.23 },
          { transform: "scaleY(.9) rotate(15deg)", offset: 0.43 },
          { transform: "scaleY(1.06) rotate(-10deg)", offset: 0.64 },
          { transform: "scaleY(1) rotate(5deg)", offset: 0.82 },
          { transform: "scaleY(1) rotate(0deg)" },
        ];
    const options = { duration: reduced ? 220 : 1200, easing: "ease-out" };
    animations.current = [
      pendant.current!.animate(movement, options),
      cord.current!.animate(stretch, options),
    ];
  }
  return (
    <div className="cedar-switch">
      <span className="cedar-fixture" aria-hidden="true" />
      <span ref={cord} className="cedar-cord" aria-hidden="true" />
      <span ref={pendant} className="cedar-pendant">
        <button
          type="button"
          className="cedar-trigger"
          disabled={!ready}
          aria-busy={!ready}
          aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
          title={`Pull for ${resolved === "dark" ? "light" : "dark"} mode`}
          aria-pressed={resolved === "dark"}
          onClick={pull}
        >
          <Image
            src="/arzcore-company-icon-v3.png"
            width={36}
            height={36}
            alt=""
          />
        </button>
      </span>
    </div>
  );
}
