'use client';

import { useState } from 'react';
import type { RelationStatus } from '@/lib/services/followService';

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
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'following':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-600';
      case 'mutual':
        return 'bg-green-500 hover:bg-green-600 text-white';
      default:
        return 'bg-blue-500 hover:bg-blue-600 text-white';
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
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${getButtonStyle()} disabled:opacity-50`}
      >
        {isLoading ? '处理中...' : getButtonText()}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-black mb-4">确认取消关注</h3>
            <p className="text-gray-600 mb-6">确定要取消关注该用户吗？</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={confirmUnfollow}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
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