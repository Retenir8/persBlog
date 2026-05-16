"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clamp,
  hexToRgb,
  hsvToRgb,
  rgbEqual,
  rgbToCss,
  rgbToHex,
  rgbToHsv,
  type Hsv,
  type Rgb,
} from "@/lib/theme/colorUtils";
import { applySurfaceTheme } from "@/lib/theme/surfaceTheme";
import { useSurfaceTheme } from "./ThemeProvider";

type Channel = "r" | "g" | "b";

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3c-4.5 0-8 3.2-8 7.5 0 2.2 1.1 4.1 2.9 5.3.6.4 1.1 1 1.1 1.7v.5c0 .8.7 1.5 1.5 1.5h1c.8 0 1.5-.7 1.5-1.5 0-.6.4-1.1.9-1.4 2.5-1.4 4.1-4 4.1-7.1C17 6.2 14.8 3 12 3z"
      />
      <circle cx="8.5" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ResetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 12a8 8 0 0 1 13.5-5.7M20 7V4m0 0h-3m3 0-3.5 3.5M20 12a8 8 0 0 1-13.5 5.7M4 17v3m0 0h3m-3 0 3.5-3.5"
      />
    </svg>
  );
}

function ChannelInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <input
        type="number"
        min={0}
        max={255}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value) || 0, 0, 255))}
        className="w-full rounded-xl border border-zinc-200/80 bg-white px-2 py-1.5 text-center text-sm tabular-nums text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
    </label>
  );
}

function applyPreviewTheme(rgb: Rgb) {
  applySurfaceTheme({ rgb, isCustom: true });
}

export function ColorPickerPanel() {
  const { rgb, isCustom, setColor, reset } = useSurfaceTheme();
  const [open, setOpen] = useState(false);
  const [displayRgb, setDisplayRgb] = useState<Rgb>(rgb);
  const [hsv, setHsv] = useState(() => rgbToHsv(rgb));
  const [hexInput, setHexInput] = useState(() => rgbToHex(rgb));
  const rootRef = useRef<HTMLDivElement>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const hsvRef = useRef<Hsv>(rgbToHsv(rgb));
  const displayRgbRef = useRef<Rgb>(rgb);
  const committedRgbRef = useRef<Rgb>(rgb);
  const draggingRef = useRef(false);

  useEffect(() => {
    displayRgbRef.current = displayRgb;
  }, [displayRgb]);

  useEffect(() => {
    hsvRef.current = hsv;
  }, [hsv]);

  const updateLocalFromRgb = useCallback((next: Rgb) => {
    const nextHsv = rgbToHsv(next);
    hsvRef.current = nextHsv;
    displayRgbRef.current = next;
    setDisplayRgb(next);
    setHsv(nextHsv);
    setHexInput(rgbToHex(next));
  }, []);

  const commitColor = useCallback(
    (next: Rgb) => {
      committedRgbRef.current = next;
      displayRgbRef.current = next;
      setColor(next);
    },
    [setColor],
  );

  const persistColor = useCallback(
    (next: Rgb) => {
      updateLocalFromRgb(next);
      applyPreviewTheme(next);
      commitColor(next);
    },
    [commitColor, updateLocalFromRgb],
  );

  useEffect(() => {
    if (rgbEqual(committedRgbRef.current, rgb)) return;
    committedRgbRef.current = rgb;
    updateLocalFromRgb(rgb);
    if (isCustom) applyPreviewTheme(rgb);
  }, [rgb.r, rgb.g, rgb.b, isCustom, updateLocalFromRgb]);

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

  const previewHsv = useCallback((patch: { h?: number; s?: number; v?: number }) => {
    const merged: Hsv = {
      h: patch.h ?? hsvRef.current.h,
      s: patch.s ?? hsvRef.current.s,
      v: patch.v ?? hsvRef.current.v,
    };
    hsvRef.current = merged;
    setHsv(merged);
    const nextRgb = hsvToRgb(merged);
    displayRgbRef.current = nextRgb;
    setDisplayRgb(nextRgb);
    setHexInput(rgbToHex(nextRgb));
    applyPreviewTheme(nextRgb);
  }, []);

  const finishDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    commitColor(displayRgbRef.current);
  }, [commitColor]);

  const pickSv = useCallback(
    (clientX: number, clientY: number) => {
      const el = svRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const s = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
      const v = clamp(100 - ((clientY - rect.top) / rect.height) * 100, 0, 100);
      previewHsv({ s, v });
    },
    [previewHsv],
  );

  const pickHue = useCallback(
    (clientX: number) => {
      const el = hueRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const h = clamp(((clientX - rect.left) / rect.width) * 360, 0, 360);
      previewHsv({ h });
    },
    [previewHsv],
  );

  const onSvPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    pickSv(e.clientX, e.clientY);
  };

  const onHuePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    pickHue(e.clientX);
  };

  const onSvPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    pickSv(e.clientX, e.clientY);
  };

  const onHuePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    pickHue(e.clientX);
  };

  const updateChannel = (channel: Channel, value: number) => {
    persistColor({ ...displayRgbRef.current, [channel]: value });
  };

  const handleReset = () => {
    draggingRef.current = false;
    reset();
  };

  const hueBg = `hsl(${hsv.h} 100% 50%)`;

  return (
    <div
      ref={rootRef}
      className="pointer-events-auto fixed right-4 top-1/2 z-[60] -translate-y-1/2"
    >
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          title="框体配色"
          aria-expanded={open}
          aria-label="打开框体颜色选择器"
          onClick={() => setOpen((v) => !v)}
          className={`flex h-11 w-11 items-center justify-center rounded-full border bg-white/90 text-zinc-700 shadow-[0_4px_20px_rgb(0_0_0/0.08)] backdrop-blur transition hover:scale-105 dark:bg-zinc-900/90 dark:text-zinc-200 ${
            open || isCustom
              ? "border-zinc-900 ring-2 ring-zinc-900/10 dark:border-zinc-100"
              : "border-zinc-200/80 dark:border-zinc-700"
          }`}
        >
          <PaletteIcon className="h-5 w-5" />
        </button>

        {isCustom ? (
          <button
            type="button"
            title="恢复默认框体颜色"
            aria-label="恢复默认框体颜色"
            onClick={handleReset}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 bg-white/90 text-zinc-500 shadow-sm hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/90 dark:hover:text-zinc-200"
          >
            <ResetIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className="absolute right-full top-0 mr-3 w-[min(18rem,calc(100vw-5rem))] rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-[0_12px_40px_rgb(0_0_0/0.12)] dark:border-zinc-700 dark:bg-zinc-950"
          role="dialog"
          aria-label="框体颜色"
        >
          <p className="mb-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">
            框体底色
          </p>

          <div
            ref={svRef}
            className="relative mb-3 h-40 w-full cursor-crosshair overflow-hidden rounded-2xl"
            style={{ backgroundColor: hueBg }}
            onPointerDown={onSvPointerDown}
            onPointerMove={onSvPointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onLostPointerCapture={finishDrag}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            <span
              className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.25)]"
              style={{
                left: `${hsv.s}%`,
                top: `${100 - hsv.v}%`,
                backgroundColor: rgbToCss(displayRgb),
              }}
            />
          </div>

          <div className="mb-3 flex items-center gap-3">
            <span
              className="h-9 w-9 shrink-0 rounded-full border border-zinc-200/80 shadow-inner dark:border-zinc-600"
              style={{ backgroundColor: rgbToCss(displayRgb) }}
              aria-hidden
            />
            <div
              ref={hueRef}
              className="relative h-3 flex-1 cursor-ew-resize overflow-hidden rounded-full"
              style={{
                background:
                  "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
              }}
              onPointerDown={onHuePointerDown}
              onPointerMove={onHuePointerMove}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
              onLostPointerCapture={finishDrag}
            >
              <span
                className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.2)]"
                style={{ left: `${(hsv.h / 360) * 100}%`, backgroundColor: hueBg }}
              />
            </div>
          </div>

          <div className="mb-3 flex gap-2">
            <ChannelInput
              label="R"
              value={displayRgb.r}
              onChange={(n) => updateChannel("r", n)}
            />
            <ChannelInput
              label="G"
              value={displayRgb.g}
              onChange={(n) => updateChannel("g", n)}
            />
            <ChannelInput
              label="B"
              value={displayRgb.b}
              onChange={(n) => updateChannel("b", n)}
            />
          </div>

          <label className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">HEX</span>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => {
                const v = e.target.value;
                setHexInput(v);
                const parsed = hexToRgb(v.startsWith("#") ? v : `#${v}`);
                if (parsed) persistColor(parsed);
              }}
              onBlur={() => setHexInput(rgbToHex(displayRgbRef.current))}
              className="flex-1 rounded-xl border border-zinc-200/80 bg-zinc-50 px-3 py-1.5 font-mono text-sm uppercase text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              spellCheck={false}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
