"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "viewedPosts";
const VIEW_COUNT_KEY = "viewedPostCounts";

function getViewedCounts(): Record<string, number> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(VIEW_COUNT_KEY);
  return stored ? JSON.parse(stored) : {};
}

function setViewedCount(postId: string, count: number): void {
  if (typeof window === "undefined") return;
  const counts = getViewedCounts();
  counts[postId] = count;
  localStorage.setItem(VIEW_COUNT_KEY, JSON.stringify(counts));
}

function hasViewedInSession(postId: string): boolean {
  if (typeof window === "undefined") return false;
  const sessionViewed = sessionStorage.getItem(STORAGE_KEY);
  if (sessionViewed) {
    const parsed: string[] = JSON.parse(sessionViewed);
    return parsed.includes(postId);
  }
  return false;
}

function markViewedInSession(postId: string): void {
  if (typeof window === "undefined") return;
  const sessionViewed = sessionStorage.getItem(STORAGE_KEY);
  const parsed: string[] = sessionViewed ? JSON.parse(sessionViewed) : [];
  if (!parsed.includes(postId)) {
    parsed.push(postId);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  }
}

export function ViewCount({ postId, initialCount, isDetailPage = false }: { postId: string; initialCount: number; isDetailPage?: boolean }) {
  const [viewCount, setViewCount] = useState(initialCount);
  const mounted = useRef(false);

  useEffect(() => {
    if (!isDetailPage) {
      const cachedCount = getViewedCounts()[postId];
      if (cachedCount !== undefined) {
        setViewCount(cachedCount);
      }
      return;
    }

    if (mounted.current) return;
    mounted.current = true;

    if (hasViewedInSession(postId)) {
      const cachedCount = getViewedCounts()[postId];
      if (cachedCount !== undefined) {
        setViewCount(cachedCount);
      }
      return;
    }

    markViewedInSession(postId);

    fetch(`/api/posts/${postId}/view`, {
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.viewCount !== undefined) {
          setViewedCount(postId, data.viewCount);
          setViewCount(data.viewCount);
        }
      })
      .catch(() => {
        mounted.current = false;
      });
  }, [postId, isDetailPage]);

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + "万";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  return (
    <span className="flex items-center gap-1 text-zinc-500">
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      {formatNumber(viewCount)}
    </span>
  );
}