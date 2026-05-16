"use client";

import { useState, useEffect } from "react";

export function LikeButton({ postId, initialCount, initialLiked }: { postId: string; initialCount: number; initialLiked: boolean }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${postId}/like`)
      .then((res) => res.json())
      .then((data) => {
        if (data.liked !== undefined) setLiked(data.liked);
        if (data.count !== undefined) setCount(data.count);
      })
      .catch((error) => {
        console.error("Failed to fetch like status:", error);
      });
  }, [postId]);

  const handleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      
      const data = await response.json();
      if (data.liked !== undefined) setLiked(data.liked);
      if (data.count !== undefined) setCount(data.count);
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + "万";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${
        liked
          ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
      }`}
    >
      <svg
        className={`h-4 w-4 ${liked ? "fill-current" : ""}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {formatNumber(count)}
    </button>
  );
}