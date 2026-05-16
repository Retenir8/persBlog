'use client';

import { useState } from 'react';
import type { RelationStatus } from '@/lib/services/followService';
import {
  pagePrimaryCtaClassName,
  paneEmptyDescClass,
  paneEmptyTitleClass,
  surfacePanelTopClass,
} from '@/lib/surfaceStyles';

interface RelationButtonProps {
  targetUserId: string;
  initialStatus: RelationStatus;
  onStatusChange?: (status: RelationStatus) => void;
}

export default function RelationButton({ targetUserId, initialStatus, onStatusChange }: RelationButtonProps) {
  const [status, setStatus] = useState<RelationStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, action: 'follow' }),
      });
      const data = await response.json();
      if (data.success) {
        setStatus(data.status.status);
        onStatusChange?.(data.status.status);
      }
    } catch (error) {
      console.error('关注失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = () => {
    setShowConfirm(true);
  };

  const confirmUnfollow = async () => {
    setShowConfirm(false);
    setIsLoading(true);
    try {
      const response = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, action: 'unfollow' }),
      });
      const data = await response.json();
      if (data.success) {
        setStatus(data.status.status);
        onStatusChange?.(data.status.status);
      }
    } catch (error) {
      console.error('取消关注失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'none':
        return '关注';
      case 'following':
        return '已关注';
      case 'followed':
        return '回关';
      case 'mutual':
        return '互相关注';
      default:
        return '关注';
    }
  };

  const getButtonStyle = () => {
    switch (status) {
      case 'none':
      case 'followed':
        return pagePrimaryCtaClassName;
      case 'following':
        return 'border border-[color:var(--surface-2-border)] bg-[var(--surface-3-bg)] text-zinc-600 hover:bg-[var(--surface-2-bg)] dark:text-zinc-400';
      case 'mutual':
        return 'border border-[color:var(--surface-2-border)] bg-[var(--surface-2-bg)] text-zinc-800 dark:text-zinc-200';
      default:
        return pagePrimaryCtaClassName;
    }
  };

  return (
    <>
      <button
        onClick={() => {
          if (status === 'following' || status === 'mutual') {
            handleUnfollow();
          } else {
            handleFollow();
          }
        }}
        disabled={isLoading}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-[background-color,border-color,opacity] ${getButtonStyle()} disabled:opacity-50`}
      >
        {isLoading ? '处理中...' : getButtonText()}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-sm p-6 ${surfacePanelTopClass}`}>
            <h3 className={`mb-4 ${paneEmptyTitleClass}`}>确认取消关注</h3>
            <p className={`mb-6 ${paneEmptyDescClass}`}>确定要取消关注该用户吗？</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-[color:var(--surface-2-border)] bg-[var(--surface-3-bg)] px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmUnfollow}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}