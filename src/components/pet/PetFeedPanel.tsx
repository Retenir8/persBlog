"use client";

import { useEffect, useId, useState } from "react";
import {
  clampStat,
  loadPetVitality,
  savePetVitality,
  type PetVitality,
} from "@/lib/petVitality";
import { PET_FOODS, petFoodImageSrc } from "./petFoods";

function StatBar({
  label,
  value,
  barClass,
}: {
  label: string;
  value: number;
  barClass: string;
}) {
  const v = clampStat(value);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
        <span>{label}</span>
        <span className="tabular-nums font-medium text-zinc-800 dark:text-zinc-200">
          {v}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
        role="meter"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${barClass}`}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

export function PetFeedPanel({
  open,
  onClose,
  onFed,
}: {
  open: boolean;
  onClose: () => void;
  /** 喂食成功时触发（例如主界面猫咪摇头） */
  onFed?: () => void;
}) {
  const titleId = useId();
  const [vitality, setVitality] = useState<PetVitality>(() => ({
    fullness: 72,
    mood: 68,
    updatedAt: 0,
  }));

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setVitality(loadPetVitality());
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      setVitality(loadPetVitality());
    }, 45_000);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function feed(item: (typeof PET_FOODS)[number]) {
    setVitality((prev) => {
      const now = Date.now();
      const next: PetVitality = {
        fullness: clampStat(prev.fullness + item.hunger),
        mood: clampStat(prev.mood + item.mood),
        updatedAt: now,
      };
      savePetVitality(next);
      queueMicrotask(() => onFed?.());
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[min(92vh,36rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          给猫咪喂食
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          点击食物即可喂食。
        </p>

        <div className="mt-4 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950/80">
          <StatBar
            label="饱食度"
            value={vitality.fullness}
            barClass="bg-amber-500 dark:bg-amber-400"
          />
          <StatBar
            label="心情值"
            value={vitality.mood}
            barClass="bg-pink-500 dark:bg-pink-400"
          />
        </div>

        <p className="mt-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          选择食物
        </p>
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PET_FOODS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => feed(item)}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-2 text-center transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
                aria-label={`喂食${item.label}，饱食度加${item.hunger}，心情加${item.mood}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- public 小图标 */}
                <img
                  src={petFoodImageSrc(item.file)}
                  alt=""
                  width={56}
                  height={56}
                  className="size-14 object-contain"
                  draggable={false}
                />
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-100">
                  {item.label}
                </span>
                <span className="text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
                  饱食 +{item.hunger} · 心情 +{item.mood}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
