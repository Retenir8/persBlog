import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-center text-2xl font-bold">登录</h1>
      <Suspense fallback={<p className="text-center text-sm text-zinc-500">载入中…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
