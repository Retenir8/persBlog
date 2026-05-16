"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export function PetContextMenu({
  clientX,
  clientY,
  onDismiss,
  onAsk,
  onFeed,
}: {
  clientX: number;
  clientY: number;
  onDismiss: () => void;
  onAsk: () => void;
  onFeed: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: clientX, y: clientY });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let nx = clientX;
    let ny = clientY;
    if (nx + r.width > window.innerWidth - 8) {
      nx = window.innerWidth - r.width - 8;
    }
    if (ny + r.height > window.innerHeight - 8) {
      ny = window.innerHeight - r.height - 8;
    }
    nx = Math.max(8, nx);
    ny = Math.max(8, ny);
    setPos({ x: nx, y: ny });
  }, [clientX, clientY]);

  useEffect(() => {
    let remove: (() => void) | undefined;
    const id = window.setTimeout(() => {
      function handler(e: MouseEvent) {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          onDismiss();
        }
      }
      window.addEventListener("mousedown", handler);
      remove = () => window.removeEventListener("mousedown", handler);
    }, 0);
    return () => {
      clearTimeout(id);
      remove?.();
    };
  }, [onDismiss]);

  useEffect(() => {
    const handler = () => onDismiss();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [onDismiss]);

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-[115] min-w-[10rem] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-600 dark:bg-zinc-900"
      style={{ left: pos.x, top: pos.y }}
    >
      <button
        type="button"
        role="menuitem"
        className="block w-full px-3 py-2 text-left text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
        onClick={() => {
          onFeed();
          onDismiss();
        }}
      >
        给猫咪喂食
      </button>
      <button
        type="button"
        role="menuitem"
        className="block w-full px-3 py-2 text-left text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
        onClick={() => {
          onAsk();
          onDismiss();
        }}
      >
        向猫咪提问
      </button>
    </div>
  );
}
