"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PET_LOGIN_TIP_SESSION_KEY } from "@/lib/petLoginTip";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { surfacePanelClass } from "@/lib/surfaceStyles";

export default function LoginForm() {
  const params = useSearchParams();
  /** 登录后的个人主页：我的文章，后续可在此挂载日历、播放器等小组件 */
  const callbackUrl = params.get("callbackUrl") || "/myposts";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("邮箱或密码错误");
        return;
      }
      try {
        sessionStorage.setItem(PET_LOGIN_TIP_SESSION_KEY, "1");
      } catch {
        /* 无痕 / 禁用 storage 时忽略 */
      }
      window.location.href = callbackUrl;
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`space-y-4 p-6 ${surfacePanelClass}`}
    >
      <label className="block text-sm font-medium">
        邮箱
        <Input
          type="email"
          className="mt-1"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm font-medium">
        密码
        <Input
          type="password"
          className="mt-1"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "登录中…" : "登录"}
      </Button>
      <p className="text-center text-sm text-zinc-500">
        没有账号？
        <Link href="/register" className="ml-1 text-zinc-900 underline dark:text-zinc-100">
          注册
        </Link>
      </p>
    </form>
  );
}
