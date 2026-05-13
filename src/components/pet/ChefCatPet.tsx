"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PetAskPanel } from "./PetAskPanel";
import { PetContextMenu } from "./PetContextMenu";
import "./pet-animations.css";

/** 高兴摇头用透明 GIF（片源见 `public/pet/chef-cat-shake.gif`） */
export const CHEF_CAT_SHAKE_GIF_SRC = "/pet/chef-cat-shake.gif";

export type ChefCatPetMotion = "idle" | "jump" | "happy";

const JUMP_MS = 720;
const SHAKE_GIF_DURATION_MS = 2400;
const SHAKE_HARD_CAP_MS = 30_000;
const INITIAL_EDGE_PX = 24;
const VIEWPORT_PAD_PX = 8;
const DRAG_THRESHOLD_PX = 8;

export function ChefCatPet() {
  const [motion, setMotion] = useState<ChefCatPetMotion>("idle");
  const motionRef = useRef(motion);
  useEffect(() => {
    motionRef.current = motion;
  }, [motion]);

  const [shakeKey, setShakeKey] = useState(0);
  const [edgeOffset, setEdgeOffset] = useState({
    right: INITIAL_EDGE_PX,
    bottom: INITIAL_EDGE_PX,
  });
  const [contextMenu, setContextMenu] = useState<{
    clientX: number;
    clientY: number;
  } | null>(null);
  const [askOpen, setAskOpen] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hardCapRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startRight: number;
    startBottom: number;
    dragged: boolean;
  } | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearHardCap = useCallback(() => {
    if (hardCapRef.current) {
      clearTimeout(hardCapRef.current);
      hardCapRef.current = null;
    }
  }, []);

  const endHappy = useCallback(() => {
    clearTimer();
    clearHardCap();
    setMotion("idle");
  }, [clearTimer, clearHardCap]);

  const playJump = useCallback(() => {
    if (motionRef.current !== "idle") return;
    clearTimer();
    clearHardCap();
    setMotion("jump");
    timerRef.current = setTimeout(() => {
      setMotion("idle");
      timerRef.current = null;
    }, JUMP_MS);
  }, [clearTimer, clearHardCap]);

  const playHappy = useCallback(() => {
    if (motionRef.current !== "idle") return;
    clearTimer();
    clearHardCap();
    setShakeKey((k) => k + 1);
    setMotion("happy");
  }, [clearTimer, clearHardCap]);

  const playJumpRef = useRef(playJump);
  const playHappyRef = useRef(playHappy);
  useEffect(() => {
    playJumpRef.current = playJump;
  }, [playJump]);
  useEffect(() => {
    playHappyRef.current = playHappy;
  }, [playHappy]);

  useEffect(() => {
    if (motion !== "happy") return;
    let cancelled = false;
    clearTimer();
    clearHardCap();
    timerRef.current = setTimeout(() => {
      if (!cancelled) endHappy();
    }, SHAKE_GIF_DURATION_MS);
    hardCapRef.current = setTimeout(() => {
      if (!cancelled) endHappy();
    }, SHAKE_HARD_CAP_MS);
    return () => {
      cancelled = true;
      clearTimer();
      clearHardCap();
    };
  }, [motion, shakeKey, clearTimer, clearHardCap, endHappy]);

  const clampEdgeOffset = useCallback(
    (right: number, bottom: number) => {
      const el = panelRef.current;
      if (!el) return { right, bottom };
      const { width: w, height: h } = el.getBoundingClientRect();
      const iw = window.innerWidth;
      const ih = window.innerHeight;
      const p = VIEWPORT_PAD_PX;
      const maxR = Math.max(p, iw - w - p);
      const maxB = Math.max(p, ih - h - p);
      return {
        right: Math.min(Math.max(right, p), maxR),
        bottom: Math.min(Math.max(bottom, p), maxB),
      };
    },
    [],
  );

  const onCatPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      setContextMenu(null);
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startRight: edgeOffset.right,
        startBottom: edgeOffset.bottom,
        dragged: false,
      };
    },
    [edgeOffset.right, edgeOffset.bottom],
  );

  const onCatPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      const th = DRAG_THRESHOLD_PX;
      if (!d.dragged) {
        if (dx * dx + dy * dy < th * th) return;
        dragRef.current = { ...d, dragged: true };
      }
      const cur = dragRef.current!;
      setEdgeOffset(
        clampEdgeOffset(
          cur.startRight - (e.clientX - cur.startX),
          cur.startBottom - (e.clientY - cur.startY),
        ),
      );
    },
    [clampEdgeOffset],
  );

  const onCatPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (d && e.pointerId === d.pointerId && e.button === 0) {
        if (!d.dragged && motionRef.current === "idle") {
          if (Math.random() < 0.5) {
            playJumpRef.current();
          } else {
            playHappyRef.current();
          }
        }
      }
      if (dragRef.current?.pointerId === e.pointerId) {
        dragRef.current = null;
      }
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* 未 capture 时忽略 */
      }
    },
    [],
  );

  const onCatLostPointerCapture = useCallback(() => {
    dragRef.current = null;
  }, []);

  const onCatContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      setContextMenu({ clientX: e.clientX, clientY: e.clientY });
    },
    [],
  );

  useEffect(() => {
    const onResize = () => {
      setEdgeOffset((prev) => clampEdgeOffset(prev.right, prev.bottom));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampEdgeOffset]);

  const imgClass =
    motion === "jump"
      ? "chef-cat-pet__sprite chef-cat-pet__sprite--jump"
      : "chef-cat-pet__sprite";

  const shakeSrc = `${CHEF_CAT_SHAKE_GIF_SRC}?p=${shakeKey}`;

  return (
    <>
      <div
        ref={panelRef}
        className="pointer-events-auto fixed z-[100] flex select-none flex-col items-center bg-transparent"
        style={{
          right: edgeOffset.right,
          bottom: edgeOffset.bottom,
          left: "auto",
          top: "auto",
        }}
        aria-label="厨师猫虚拟宠物"
      >
        <div
          className="chef-cat-pet__glow cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={onCatPointerDown}
          onPointerMove={onCatPointerMove}
          onPointerUp={onCatPointerUp}
          onPointerCancel={onCatPointerUp}
          onLostPointerCapture={onCatLostPointerCapture}
          onContextMenu={onCatContextMenu}
        >
          <div className="chef-cat-pet__sprite-wrap">
            {motion === "happy" ? (
              /* eslint-disable-next-line @next/next/no-img-element -- 小贴纸资源，需与 transform 动画同层 */
              <img
                key={shakeKey}
                src={shakeSrc}
                alt="高兴摇头动画"
                className="chef-cat-pet__sprite object-contain outline-none ring-0"
                width={120}
                height={120}
                draggable={false}
                onError={endHappy}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element -- 小贴纸资源，需与 transform 动画同层 */
              <img
                src="/pet/chef-cat.png"
                alt="戴厨师帽的猫咪贴纸"
                className={imgClass}
                width={120}
                height={120}
                draggable={false}
              />
            )}
          </div>
        </div>
      </div>

      {contextMenu ? (
        <PetContextMenu
          clientX={contextMenu.clientX}
          clientY={contextMenu.clientY}
          onDismiss={() => setContextMenu(null)}
          onAsk={() => setAskOpen(true)}
        />
      ) : null}

      <PetAskPanel open={askOpen} onClose={() => setAskOpen(false)} />
    </>
  );
}
