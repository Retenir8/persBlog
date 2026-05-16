import Link from "next/link";

export function PaginationNav({
  page,
  totalPages,
  hrefBuilder,
}: {
  page: number;
  totalPages: number;
  hrefBuilder: (p: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex justify-center">
      <div className="inline-flex items-center gap-1 rounded-2xl border border-zinc-200/70 bg-white p-1 text-sm shadow-surface dark:border-zinc-800/70 dark:bg-zinc-950">
        {page > 1 ? (
          <Link
            href={hrefBuilder(page - 1)}
            className="rounded-xl px-3 py-2 text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/80"
          >
            上一页
          </Link>
        ) : (
          <span className="cursor-default rounded-xl px-3 py-2 text-zinc-300 dark:text-zinc-600">
            上一页
          </span>
        )}
        <span className="min-w-[5rem] px-2 py-2 text-center tabular-nums text-zinc-500 dark:text-zinc-400">
          {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={hrefBuilder(page + 1)}
            className="rounded-xl px-3 py-2 text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/80"
          >
            下一页
          </Link>
        ) : (
          <span className="cursor-default rounded-xl px-3 py-2 text-zinc-300 dark:text-zinc-600">
            下一页
          </span>
        )}
      </div>
    </nav>
  );
}
