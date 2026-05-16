'use client';

import { useState, useEffect } from 'react';

interface Friend {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface Group {
  id: string;
  name: string;
  isDefault: boolean;
}

export default function FriendsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Friend[]>([]);
  const [showGroupMenu, setShowGroupMenu] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    fetchGroups();
    fetchRequests();
    fetchMutualFriends();
  }, []);

  useEffect(() => {
    if (activeGroup === 'all') {
      fetchMutualFriends();
    } else {
      fetchGroupMembers(activeGroup);
    }
  }, [activeGroup]);

  const fetchGroups = async () => {
    const response = await fetch('/api/friend-groups');
    const data = await response.json();
    if (data.success) {
      setGroups(data.groups);
    }
  };

  const fetchMutualFriends = async () => {
    const response = await fetch('/api/friends/mutual');
    const data = await response.json();
    if (data.success) {
      setFriends(data.friends);
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    const response = await fetch(`/api/friend-groups/${groupId}`);
    const data = await response.json();
    if (data.success) {
      setFriends(data.members);
    }
  };

  const fetchRequests = async () => {
    const response = await fetch('/api/follow-requests');
    const data = await response.json();
    if (data.success) {
      setRequests(data.data.map((r: any) => ({
        id: r.follower.id,
        name: r.follower.name,
        avatar: r.follower.avatar,
      })));
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    await fetch('/api/follow-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId, action: 'accept' }),
    });
    fetchRequests();
    fetchMutualFriends();
  };

  const handleIgnoreRequest = async (userId: string) => {
    await fetch('/api/follow-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId, action: 'ignore' }),
    });
    fetchRequests();
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    await fetch('/api/friend-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName, action: 'create' }),
    });
    setNewGroupName('');
    fetchGroups();
  };

  const renameGroup = async (groupId: string, newName: string) => {
    await fetch(`/api/friend-groups/${groupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    fetchGroups();
    setShowGroupMenu(null);
  };

  const deleteGroup = async (groupId: string) => {
    await fetch(`/api/friend-groups/${groupId}`, {
      method: 'DELETE',
    });
    fetchGroups();
    setShowGroupMenu(null);
    if (activeGroup === groupId) {
      setActiveGroup('all');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">好友列表</h1>

      {requests.length > 0 && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-black mb-3">有 {requests.length} 个新的好友请求</h3>
          <div className="space-y-2">
            {requests.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img
                      src={user.avatar || undefined}
                      alt={user.name || undefined}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<span class="text-gray-500 text-sm">👤</span>';
                      }}
                    />
                  ) : (
                    <span className="text-gray-500">👤</span>
                  )}
                </div>
                <span className="flex-1 font-medium text-black">{user.name || '匿名用户'}</span>
                <button
                  onClick={() => handleAcceptRequest(user.id)}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                >
                  接受
                </button>
                <button
                  onClick={() => handleIgnoreRequest(user.id)}
                  className="px-3 py-1 bg-gray-200 text-black text-sm rounded hover:bg-gray-300 transition-colors"
                >
                  忽略
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveGroup('all')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
            activeGroup === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全部好友
        </button>
        {groups.map((group) => (
          <div key={group.id} className="relative">
            <button
              onClick={() => setActiveGroup(group.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                activeGroup === group.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {group.name}
            </button>
            {!group.isDefault && (
              <button
                onClick={() => setShowGroupMenu(showGroupMenu === group.id ? null : group.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-gray-300 rounded-full text-xs flex items-center justify-center hover:bg-gray-400"
              >
                ⋮
              </button>
            )}
            {showGroupMenu === group.id && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    const name = prompt('新分组名称：');
                    if (name) renameGroup(group.id, name);
                  }}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-black"
                >
                  重命名
                </button>
                <button
                  onClick={() => deleteGroup(group.id)}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-red-500"
                >
                  删除
                </button>
              </div>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="新分组名称"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            onKeyDown={(e) => e.key === 'Enter' && createGroup()}
          />
          <button
            onClick={createGroup}
            className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
          >
            +
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {friends.map((friend) => (
          <div
            key={friend.id}
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-2">
              {friend.avatar ? (
                <img
                  src={friend.avatar || undefined}
                  alt={friend.name || undefined}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<span class="text-2xl text-gray-500">👤</span>';
                  }}
                />
              ) : (
                <span className="text-2xl text-gray-500">👤</span>
              )}
            </div>
            <span className="text-sm font-medium text-black text-center truncate w-full">
              {friend.name || '匿名用户'}
            </span>
            <div className="flex gap-3 mt-3">
              <a
                href={`/users/${friend.id}`}
                className="flex flex-col items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors"
                title="查看博客"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-xs">博客</span>
              </a>
              <a
                href={`/messages/${friend.id}`}
                className="flex flex-col items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors"
                title="发送私信"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="text-xs">私信</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {friends.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>暂无好友</p>
        </div>
      )}
    </div>
  );
}