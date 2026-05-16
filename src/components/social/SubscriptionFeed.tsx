'use client';

import { useState, useEffect } from 'react';

interface SubscriptionPost {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
}

export default function SubscriptionFeed() {
  const [posts, setPosts] = useState<SubscriptionPost[]>([]);
  const [showAllDays, setShowAllDays] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionPosts();
  }, [showAllDays]);

  const fetchSubscriptionPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/subscriptions?showAllDays=${showAllDays}`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('获取订阅文章失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}分钟前`;
      }
      return `${hours}小时前`;
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    }
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">订阅更新</h2>
        <button
          onClick={() => setShowAllDays(!showAllDays)}
          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          {showAllDays ? '收起近3天' : '查看近3天更新'}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">加载中...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无订阅文章</div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <img
                src={post.authorAvatar || 'https://via.placeholder.com/40'}
                alt={post.authorName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-800">{post.authorName}</span>
                  <span className="text-xs text-gray-400">{formatTime(post.createdAt)}</span>
                </div>
                <a
                  href={`/posts/${post.id}`}
                  className="text-blue-600 hover:text-blue-700 truncate block"
                >
                  {post.title}
                </a>
              </div>
              <button className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 text-sm transition-opacity">
                取消订阅
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}