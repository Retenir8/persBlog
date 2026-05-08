"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User, Post } from "@prisma/client";

interface UserWithPosts extends User {
  posts: Post[];
}

export function ProfileEditorClient({ user, isOwner }: { user: UserWithPosts; isOwner: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    name: user.name || "",
    bio: user.bio || "",
    signature: user.signature || "",
    tags: user.tags || "",
    location: user.location || "",
    occupation: user.occupation || "",
    github: user.github || "",
    wechat: user.wechat || "",
    website: user.website || "",
  });

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setEditing(false);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setEditing(false);
    setData({
      name: user.name || "",
      bio: user.bio || "",
      signature: user.signature || "",
      tags: user.tags || "",
      location: user.location || "",
      occupation: user.occupation || "",
      github: user.github || "",
      wechat: user.wechat || "",
      website: user.website || "",
    });
  };

  const published = user.posts.filter(p => p.published);
  const drafts = user.posts.filter(p => !p.published);

  return (
    <div className="space-y-8">
      {/* Edit Button */}
      {isOwner && (
        <div className="flex justify-end">
          {!editing ? (
            <button onClick={() => setEditing(true)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              ✏️ 编辑
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
                {saving ? "保存中..." : "保存"}
              </button>
              <button onClick={cancel} disabled={saving} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300">
                取消
              </button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
          <span className="text-4xl">👤</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">{data.name || "未设置昵称"}</h1>
        {data.tags && (
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {data.tags.split(",").map((t, i) => (
              <span key={i} className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs">{t.trim()}</span>
            ))}
          </div>
        )}
        {editing && (
          <div className="mb-4">
            <input type="text" value={data.tags} onChange={(e) => setData({...data, tags: e.target.value})} placeholder="个人标签，逗号分隔" className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </div>
        )}
        <p className="text-zinc-600 dark:text-zinc-400">{data.signature || "未设置签名"}</p>
        {editing && (
          <input type="text" value={data.signature} onChange={(e) => setData({...data, signature: e.target.value})} placeholder="个人签名" className="w-full max-w-xs mt-4 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        )}
      </div>

      {/* About & Info */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold mb-4">关于我</h2>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
            {editing ? (
              <textarea value={data.bio} onChange={(e) => setData({...data, bio: e.target.value})} placeholder="介绍一下自己..." className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" rows={4} />
            ) : (
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{data.bio || "暂无介绍"}</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">基本信息</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span>📍</span>
              {editing ? (
                <input type="text" value={data.location} onChange={(e) => setData({...data, location: e.target.value})} placeholder="所在地" className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              ) : (
                <span>{data.location || "未填写"}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>💼</span>
              {editing ? (
                <input type="text" value={data.occupation} onChange={(e) => setData({...data, occupation: e.target.value})} placeholder="职业" className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              ) : (
                <span>{data.occupation || "未填写"}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{new Date(user.createdAt).toLocaleDateString("zh-CN")} 开通</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h2 className="text-xl font-bold mb-4">联系我</h2>
          <div className="space-y-3">
            {data.github && (
              <div className="flex items-center gap-2">
                <span>🔗</span>
                {editing ? (
                  <input type="text" value={data.github} onChange={(e) => setData({...data, github: e.target.value})} placeholder="GitHub" className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                ) : (
                  <a href={data.github} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub</a>
                )}
              </div>
            )}
            {data.wechat && (
              <div className="flex items-center gap-2">
                <span>📱</span>
                {editing ? (
                  <input type="text" value={data.wechat} onChange={(e) => setData({...data, wechat: e.target.value})} placeholder="微信" className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                ) : (
                  <span>{data.wechat}</span>
                )}
              </div>
            )}
            {data.website && (
              <div className="flex items-center gap-2">
                <span>🌐</span>
                {editing ? (
                  <input type="text" value={data.website} onChange={(e) => setData({...data, website: e.target.value})} placeholder="个人网站" className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                ) : (
                  <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">个人网站</a>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">博客统计</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <p className="text-2xl font-bold">{published.length}</p>
              <p className="text-sm text-zinc-500">已发布文章</p>
            </div>
            <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <p className="text-2xl font-bold">{drafts.length}</p>
              <p className="text-sm text-zinc-500">草稿</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">最新文章</h2>
          <div className="space-y-2">
            {published.slice(0, 3).map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`} className="block p-2 rounded-lg hover:bg-zinc-50">
                <p className="font-medium text-sm truncate">{post.title}</p>
                <p className="text-xs text-zinc-500">{new Date(post.createdAt).toLocaleDateString()}</p>
              </Link>
            ))}
            {published.length === 0 && <p className="text-zinc-500 text-sm">暂无文章</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
