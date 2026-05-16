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
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-gray-500">正在跳转到消息页面...</p>
      </div>
    </div>
  );
}