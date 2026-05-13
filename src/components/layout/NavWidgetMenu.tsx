"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { WIDGET_REGISTRY } from "@/lib/widgets/registry";

const itemClass =
  "block rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800";

const triggerClass =
  "rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50";

const triggerOpenClass =
  "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50";

export function NavWidgetMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={`${triggerClass} ${open ? triggerOpenClass : ""}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        小组件
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[11rem] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
          {WIDGET_REGISTRY.map((w) => (
            <Link
              key={w.key}
              role="menuitem"
              href={`/widgets/preview/${w.key}`}
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              {w.title}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
