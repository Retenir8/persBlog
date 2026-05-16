'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ChatRedirectPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    router.push('/messages');
  }, [router, params]);

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--page-canvas)]">
      <p className="text-zinc-500 dark:text-zinc-400">正在跳转到消息页面...</p>
    </div>
  );
}