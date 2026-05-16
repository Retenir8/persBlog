import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { NavArticleMenu } from "@/components/layout/NavArticleMenu";
import { NavWidgetMenu } from "@/components/layout/NavWidgetMenu";
import { getUnreadCount } from "@/lib/services/messageService";

async function SignOutForm() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <Button type="submit" variant="ghost" className="!p-2">
        退出
      </Button>
    </form>
  );
}

export async function Navbar() {
  const session = await auth();
  const unreadCount = session?.user?.id
    ? await getUnreadCount(session.user.id)
    : 0;

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          个人博客
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <NavWidgetMenu />
          <Link
            href="/guestbook"
            className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            留言板
          </Link>
          <NavArticleMenu canWritePost={!!session?.user} />
          <Link
            href="/music"
            className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            音乐
          </Link>
          <Link
            href="/photos"
            className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            摄影
          </Link>
          <Link
            href="/bookshelf"
            className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            书架
          </Link>
          {session?.user ? (
            <>
              <Link
                href="/messages"
                className="relative rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                消息
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>
              <Link
                href={`/users/${session.user.id}`}
                className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                个人信息
              </Link>
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-md px-2 py-1 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-zinc-800"
                >
                  管理
                </Link>
              )}
              <span className="hidden text-zinc-400 sm:inline">
                {session.user.name || session.user.email}
              </span>
              <SignOutForm />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                登录
              </Link>
              <Link href="/register">
                <Button variant="primary" className="!py-1.5 !text-xs">
                  注册
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
