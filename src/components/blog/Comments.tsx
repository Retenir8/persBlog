"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Comment = {
  id: string;
  content: string;
  userId: string | null;
  user: { id: string; name: string | null; avatar: string | null } | null;
  parentId: string | null;
  replies: Comment[];
  createdAt: string;
};

export function Comments({ postId }: { postId: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setFetching(true);
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          parentId: replyTo?.id || null,
        }),
      });

      if (res.ok) {
        setContent("");
        setReplyTo(null);
        await fetchComments();
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("确定要删除这条评论吗？")) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchComments();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`border rounded-lg p-4 ${isReply ? "ml-8 mt-2 border-gray-200" : "border-gray-200"}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            {comment.user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <Link
              href={`/users/${comment.user?.id || "#"}`}
              className="font-medium hover:text-blue-600"
            >
              {comment.user?.name || "匿名用户"}
            </Link>
            <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
          </div>
        </div>
        {session?.user?.id === comment.userId && (
          <button
            onClick={() => handleDelete(comment.id)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            删除
          </button>
        )}
      </div>
      <p className="mt-3 text-gray-700">{comment.content}</p>
      {!isReply && (
        <button
          onClick={() =>
            setReplyTo({
              id: comment.id,
              name: comment.user?.name || "用户",
            })
          }
          className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
        >
          回复
        </button>
      )}
      {comment.replies?.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">评论 ({comments.length})</h2>

      {session?.user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          {replyTo && (
            <div className="mb-2 text-sm text-gray-600">
              正在回复 {replyTo.name}{" "}
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-red-500 hover:text-red-700"
              >
                取消
              </button>
            </div>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下你的评论..."
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "发送中..." : "发送评论"}
          </button>
        </form>
      ) : (
        <p className="mb-8 text-gray-600">
          请先{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            登录
          </Link>{" "}
          后评论
        </p>
      )}

      <div className="space-y-4">
        {fetching ? (
          <p className="text-gray-500">加载评论中...</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500">暂无评论，快来抢沙发吧！</p>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}
