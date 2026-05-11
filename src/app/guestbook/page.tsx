import Link from "next/link";
import { listRecentGuestbookWall } from "@/lib/services/guestbookService";

function formatTime(d: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export default async function GuestbookWallPage() {
  const rows = await listRecentGuestbookWall(100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">留言广场</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          全站用户主页收到的最新留言；点击用户名进入对应主页。
        </p>
      </div>

      <ul className="space-y-4">
        {rows.length === 0 ? (
          <li className="text-sm text-zinc-500">暂时还没有留言。</li>
        ) : (
          rows.map((row) => {
            const who =
              row.author?.name || row.guestName || "访客";
            const authorId = row.authorUserId ?? row.author?.id ?? null;
            const hostLabel = row.host.name?.trim() || "用户";

            return (
              <li
                key={row.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {authorId ? (
                      <Link
                        href={`/users/${authorId}`}
                        className="font-medium hover:underline"
                      >
                        {who}
                      </Link>
                    ) : (
                      <span className="font-medium">{who}</span>
                    )}
                    <span className="text-zinc-500"> 留言给 </span>
                    <Link
                      href={`/users/${row.host.id}`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {hostLabel}
                    </Link>
                  </span>
                  <time
                    className="text-xs text-zinc-500"
                    dateTime={row.createdAt.toISOString()}
                  >
                    {formatTime(row.createdAt)}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {row.content}
                </p>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
