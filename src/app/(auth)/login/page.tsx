import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { PageIntro } from "@/components/layout/PageIntro";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <PageIntro title="登录" />
      <Suspense fallback={<p className="text-center text-sm text-zinc-500">载入中…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
