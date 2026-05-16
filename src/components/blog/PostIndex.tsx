'use client';

import { useState, useEffect } from 'react';
import { PaginationNav } from "@/components/layout/PaginationNav";
import { surfacePanelClass } from "@/lib/surfaceStyles";
import { TaxonomyManageSection } from "./TaxonomyManageSection";
import { PostCard } from "./PostCard";

function firstParam(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

export function PostIndex({
  initialSearchParams,
  path = "/posts",
}: {
  initialSearchParams: Record<string, string | string[] | undefined>;
  path?: string;
}) {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  const initialPage = Math.max(1, parseInt(String(firstParam(initialSearchParams.page) || "1"), 10));
  const initialKeyword = String(firstParam(initialSearchParams.keyword) || "").trim() || undefined;
  
  const [page, setPage] = useState(initialPage);
  const [keyword, setKeyword] = useState(initialKeyword);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (keyword) params.set('keyword', keyword);
      
      const response = await fetch(`/api/posts?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('获取文章列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxonomy = async () => {
    try {
      const [cats, tgs] = await Promise.all([
        fetch('/api/categories').then(res => res.json()).catch(() => []),
        fetch('/api/tags').then(res => res.json()).catch(() => []),
      ]);
      setCategories(cats || []);
      setTags(tgs || []);
    } catch (error) {
      console.error('获取分类标签失败:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, keyword]);

  useEffect(() => {
    fetchTaxonomy();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (keyword) p.set("keyword", keyword);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === "") p.delete(k);
      else p.set(k, v);
    });
    const q = p.toString();
    return q ? `?${q}` : "";
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const withQuery = (qs: string) => (qs ? `${path}${qs}` : path);

  return (
    <div className="space-y-8">
      <form
        className={`space-y-4 p-4 ${surfacePanelClass}`}
        onSubmit={handleSearch}
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          搜索
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              关键词
            </span>
            <input
              type="text"
              value={keyword || ""}
              onChange={(e) => setKeyword(e.target.value.trim() || undefined)}
              placeholder="搜索标题或正文"
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>
          <button
            type="submit"
            className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            搜索
          </button>
        </div>
      </form>

      {categories.length > 0 && (
        <TaxonomyManageSection
          categories={categories.map((c: any) => ({ id: c.id, name: c.name }))}
          tags={tags.map((t: any) => ({ id: t.id, name: t.name }))}
          canManage={true}
        />
      )}

      {loading ? (
        <div className={`px-6 py-14 text-center text-sm text-zinc-500 ${surfacePanelClass}`}>
          加载中...
        </div>
      ) : posts.length === 0 ? (
        <div
          className={`px-6 py-14 text-center text-sm text-zinc-500 dark:text-zinc-400 ${surfacePanelClass}`}
        >
          暂无文章
        </div>
      ) : (
        <ul className="space-y-4">
          {posts.map((post: any) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}

      <PaginationNav
        page={page}
        totalPages={totalPages}
        hrefBuilder={(p: number) => {
          setPage(p);
          return withQuery(buildQuery({ page: String(p) }));
        }}
      />
    </div>
  );
}
