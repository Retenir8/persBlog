import { auth } from '@/lib/auth';
import { getFollowings } from '@/lib/services/followService';

interface FollowingUser {
  id: string;
  name: string | null;
  avatar: string | null;
}

export default async function SubscriptionsPage() {
  const session = await auth();
  const followings = session?.user?.id ? await getFollowings(session.user.id) : [];

  const users: FollowingUser[] = followings.map((f) => ({
    id: f.following.id,
    name: f.following.name,
    avatar: f.following.avatar,
  }));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">我的订阅</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="搜索昵称或ID"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>还没有订阅任何用户</p>
          <p className="text-sm mt-2">去个人主页关注其他用户吧</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {users.map((user) => (
            <a
              key={user.id}
              href={`/users/${user.id}`}
              className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <img
                src={user.avatar || 'https://via.placeholder.com/80'}
                alt={user.name || '用户'}
                className="w-16 h-16 rounded-full object-cover mb-2"
              />
              <span className="text-sm text-gray-800 text-center truncate w-full">
                {user.name || '匿名用户'}
              </span>
              <span className="text-xs text-gray-400">3天前更新</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}