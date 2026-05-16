'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Friend {
  id: string;
  name: string | null;
  avatar: string | null;
  isOnline: boolean;
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  lastMessage: string;
  lastMessageTime: string | null;
  isMuted: boolean;
  isPinned: boolean;
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  contentType: string;
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  isRetracted: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface GroupedMessage {
  date: string;
  messages: Message[];
}

const PRIMARY_COLOR = '#165DFF';
const PRIMARY_HOVER = '#0D47A1';
const BG_MAIN = '#121212';
const BG_PANEL = '#1E1E1E';
const BG_CARD = '#252525';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = 'rgba(255, 255, 255, 0.8)';
const TEXT_TERTIARY = 'rgba(255, 255, 255, 0.6)';

export default function MessagesPage() {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState<{ messageId: string; x: number; y: number } | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<{ type: 'conversation' | 'message'; id: string; userId?: string; x: number; y: number } | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'pinned'>('all');
  const [mobileView, setMobileView] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFriends();
    fetchConversations();
    checkMobileView();
    
    const handleResize = () => checkMobileView();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowScrollUp(container.scrollTop > 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMessageMenu) {
        setShowMessageMenu(null);
      }
      if (showContextMenu) {
        setShowContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMessageMenu, showContextMenu]);

  const checkMobileView = () => {
    setMobileView(window.innerWidth < 768);
    if (window.innerWidth < 768) {
      setShowFriendsList(false);
    } else {
      setShowFriendsList(true);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends/mutual');
      const data = await response.json();
      if (data.success) {
        setFriends(data.friends.map((f: Friend) => ({ ...f, isOnline: Math.random() > 0.4 })));
      }
    } catch (error) {
      console.error('获取好友列表失败:', error);
    }
  };

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      if (data.success) {
        const convosWithUnread = data.conversations.map((conv: Conversation) => {
          const existingConv = conversations.find(c => c.id === conv.id);
          return {
            ...conv,
            unreadCount: existingConv?.unreadCount ?? conv.unreadCount ?? 0,
          };
        });
        setConversations(convosWithUnread);
        if (convosWithUnread.length > 0 && !selectedConversation) {
          setSelectedConversation(convosWithUnread[0]);
        }
      }
    } catch (error) {
      console.error('获取会话列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setIsMessagesLoading(true);
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`);
      const data = await response.json();
      if (data.success) {
        const messagesWithStatus = data.messages.map((msg: Message) => ({
          ...msg,
          status: msg.isRead ? 'read' : 'sent',
        }));
        setMessages(messagesWithStatus);
      }
    } catch (error) {
      console.error('获取消息失败:', error);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !session?.user?.id || !selectedConversation) return;

    const newMessage: Message = {
      id: 'temp-' + Date.now(),
      senderId: session.user.id,
      content: inputValue.trim(),
      contentType: 'TEXT',
      isRead: false,
      isRetracted: false,
      createdAt: new Date().toISOString(),
      sender: { id: session.user.id, name: session.user.name || null, avatar: null },
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: selectedConversation.otherUser.id,
          content: inputValue.trim(),
          contentType: 'TEXT',
        }),
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
        ));
        fetchMessages(selectedConversation.id);
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: inputValue.trim(), lastMessageTime: new Date().toISOString(), unreadCount: 0 }
            : conv
        ));
      } else {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'failed' } : msg
        ));
      }
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'failed' } : msg
      ));
    }
  };

  const handleFileUpload = async (file: File, type: 'image' | 'file') => {
    if (!session?.user?.id || !selectedConversation) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('recipientId', selectedConversation.otherUser.id);
    formData.append('contentType', type.toUpperCase());

    const newMessage: Message = {
      id: 'temp-' + Date.now(),
      senderId: session.user.id,
      content: file.name,
      contentType: type.toUpperCase() as 'IMAGE' | 'FILE',
      fileName: file.name,
      isRead: false,
      isRetracted: false,
      createdAt: new Date().toISOString(),
      sender: { id: session.user.id, name: session.user.name || null, avatar: null },
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
        ));
        fetchMessages(selectedConversation.id);
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: `[${type === 'image' ? '图片' : '文件'}] ${file.name}`, lastMessageTime: new Date().toISOString(), unreadCount: 0 }
            : conv
        ));
      } else {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'failed' } : msg
        ));
      }
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'failed' } : msg
      ));
    }
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    setShowMessageMenu(null);
  };

  const togglePinConversation = (convId: string) => {
    fetch(`/api/conversations/${convId}/pin`, { method: 'POST' });
    setConversations(prev => prev.map(conv => 
      conv.id === convId ? { ...conv, isPinned: !conv.isPinned } : conv
    ));
  };

  const toggleMuteConversation = (convId: string) => {
    fetch(`/api/conversations/${convId}/mute`, { method: 'POST' });
    setConversations(prev => prev.map(conv => 
      conv.id === convId ? { ...conv, isMuted: !conv.isMuted } : conv
    ));
  };

  const blockUser = async (userId: string) => {
    try {
      const response = await fetch('/api/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUserId: userId }),
      });
      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.otherUser.id !== userId));
        if (selectedConversation?.otherUser.id === userId) {
          setSelectedConversation(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('拉黑失败:', error);
    }
  };

  const markAsRead = (convId: string) => {
    fetch(`/api/conversations/${convId}/read`, { method: 'POST' });
    setConversations(prev => prev.map(conv => 
      conv.id === convId ? { ...conv, unreadCount: 0 } : conv
    ));
  };

  const deleteConversation = async (convId: string) => {
    await fetch(`/api/conversations?conversationId=${convId}`, { method: 'DELETE' });
    fetchConversations();
    if (selectedConversation?.id === convId) {
      setSelectedConversation(null);
      setMessages([]);
    }
  };

  const retractMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/retract`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isRetracted: true } : msg
        ));
        setShowMessageMenu(null);
      }
    } catch (error) {
      console.error('撤回消息失败:', error);
    }
  };

  const canRetractMessage = (message: Message) => {
    if (!isOwnMessage(message.senderId) || message.isRetracted) return false;
    const now = new Date().getTime();
    const messageTime = new Date(message.createdAt).getTime();
    return now - messageTime < 1 * 60 * 1000;
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    }
    return date.toLocaleDateString('zh-CN');
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const groupMessagesByDate = (msgs: Message[]): GroupedMessage[] => {
    if (msgs.length === 0) return [];
    
    const groups: GroupedMessage[] = [];
    let currentDate = '';
    
    msgs.forEach(msg => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msg.createdAt, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    
    return groups;
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'unread' && conv.unreadCount > 0) ||
      (activeFilter === 'pinned' && conv.isPinned);
    
    const matchesSearch = !searchQuery || 
      conv.otherUser.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime();
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === 'Escape') {
      setShowEmojiPicker(false);
      setShowMessageMenu(null);
    }
  };

  const addEmoji = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const emojis = ['😀', '😎', '❤️', '🎉', '👍', '😊', '😂', '🤔', '👏', '🙌', '🔥', '💪', '🌟', '💯', '🎯', '😢', '😱', '🤩', '🥳', '😇', '🤗'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollUp(false);
  };

  const isOwnMessage = (senderId: string) => senderId === session?.user?.id;

  const groupedMessages = groupMessagesByDate(messages);

  const unreadCount = conversations.reduce((acc, conv) => acc + conv.unreadCount, 0);

  const startConversation = (friendId: string, friendName: string | null, friendAvatar: string | null) => {
    const existingConv = conversations.find(c => c.otherUser.id === friendId);
    if (existingConv) {
      setSelectedConversation(existingConv);
    } else {
      const newConv: Conversation = {
        id: friendId,
        otherUser: { id: friendId, name: friendName, avatar: friendAvatar },
        lastMessage: '',
        lastMessageTime: null,
        isMuted: false,
        isPinned: false,
        unreadCount: 0,
      };
      setSelectedConversation(newConv);
      setMessages([]);
    }
    if (mobileView) {
      setShowFriendsList(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="h-screen flex flex-col">
        <header className="h-14 bg-[#1E1E1E] border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-white">私信</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFriendsList(!showFriendsList)}
              className="p-2 hover:bg-[#252525] rounded-lg transition-colors text-gray-400 hover:text-white"
              title="好友列表"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            <button 
              onClick={() => setShowNewMessageModal(true)}
              className="px-4 py-2 bg-[#165DFF] hover:bg-[#0D47A1] text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建私信
            </button>
            <button 
              onClick={fetchConversations}
              className="p-2 hover:bg-[#252525] rounded-lg transition-colors text-gray-400 hover:text-white"
              title="刷新"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 hover:bg-[#252525] rounded-lg transition-colors text-gray-400 hover:text-white"
                title="设置"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </button>
              {showSettingsMenu && (
                <div className="absolute right-0 top-full mt-1 bg-[#1E1E1E] border border-gray-700 rounded-lg shadow-xl z-20 min-w-36">
                  <button className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#252525] transition-colors">
                    消息设置
                  </button>
                  <button className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#252525] transition-colors">
                    通知设置
                  </button>
                  <button className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#252525] transition-colors">
                    隐私设置
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {showFriendsList && !mobileView && (
            <aside className="w-64 bg-[#1E1E1E] border-r border-gray-800 flex flex-col flex-shrink-0">
              <div className="p-3 border-b border-gray-800">
                <h2 className="text-sm font-semibold text-gray-300">好友列表</h2>
                <p className="text-xs text-gray-500 mt-1">{friends.length} 位好友</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {friends.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">👥</div>
                    <p className="text-gray-400 text-sm">还没有好友</p>
                    <button className="mt-3 px-4 py-1.5 bg-[#165DFF] text-white text-sm rounded-lg hover:bg-[#0D47A1] transition-colors">
                      去添加好友
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {friends.map((friend) => (
                      <button
                        key={friend.id}
                        onClick={() => startConversation(friend.id, friend.name, friend.avatar)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#252525] transition-colors group"
                      >
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                            {friend.avatar ? (
                              <img src={friend.avatar || undefined} alt={friend.name || undefined} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm text-gray-400">👤</span>
                            )}
                          </div>
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#1E1E1E] ${friend.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm text-white truncate">{friend.name || '匿名用户'}</p>
                          <p className="text-xs text-gray-500">{friend.isOnline ? '在线' : '离线'}</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-[#165DFF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}

          <div className="flex-1 flex overflow-hidden">
            <aside className="w-80 bg-[#1E1E1E] border-r border-gray-800 flex flex-col flex-shrink-0">
              <div className="p-3 border-b border-gray-800">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索好友或消息..."
                    className="w-full pl-10 pr-10 py-2 bg-[#252525] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#165DFF] transition-colors"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex border-b border-gray-800">
                {[
                  { key: 'all', label: '全部' },
                  { key: 'unread', label: '未读' },
                  { key: 'pinned', label: '置顶' },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key as 'all' | 'unread' | 'pinned')}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${
                      activeFilter === filter.key 
                        ? 'text-[#165DFF] border-b-2 border-[#165DFF] bg-[#252525]' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <svg className="w-8 h-8 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500 text-sm mt-2">加载中...</p>
                  </div>
                ) : sortedConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="relative mb-4">
                      <div className="text-6xl">💬</div>
                      <div className="absolute -top-2 -right-2 text-2xl animate-bounce">✈️</div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">还没有私信哦</h3>
                    <p className="text-gray-400 text-sm text-center mb-4">找到志同道合的朋友，开始你的第一次对话吧</p>
                    <button className="px-5 py-2 bg-[#165DFF] hover:bg-[#0D47A1] text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      去发现好友
                    </button>
                    <p className="text-xs text-gray-500 mt-3">也可以通过用户主页的私信按钮发起对话</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {sortedConversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => { setSelectedConversation(conv); markAsRead(conv.id); }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setShowContextMenu({ type: 'conversation', id: conv.id, userId: conv.otherUser.id, x: e.clientX, y: e.clientY });
                        }}
                        className={`relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedConversation?.id === conv.id 
                            ? 'bg-[#252525] border-l-2 border-[#165DFF]' 
                            : 'hover:bg-[#252525]'
                        }`}
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                            {conv.otherUser.avatar ? (
                              <img
                                src={conv.otherUser.avatar || undefined}
                                alt={conv.otherUser.name || undefined}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = '<span class="text-sm text-gray-400">👤</span>';
                                }}
                              />
                            ) : (
                              <span className="text-sm text-gray-400">👤</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white truncate">
                              {conv.otherUser.name || '匿名用户'}
                            </span>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatTime(conv.lastMessageTime)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 truncate mt-0.5">
                            {conv.lastMessage || '暂无消息'}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center flex-shrink-0">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                        {conv.isPinned && (
                          <span className="text-xs text-[#165DFF] flex-shrink-0">★</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {!mobileView || !selectedConversation ? (
              <main className="flex-1 bg-[#121212] flex items-center justify-center">
                {selectedConversation ? (
                  <div className="flex flex-col h-full">
                    <div className="h-12 bg-[#1E1E1E] border-b border-gray-800 flex items-center px-4">
                      <button 
                        onClick={() => { if(mobileView) setSelectedConversation(null); }}
                        className="p-1.5 hover:bg-[#252525] rounded-lg transition-colors mr-3"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                          {selectedConversation.otherUser.avatar ? (
                            <img src={selectedConversation.otherUser.avatar || undefined} alt={selectedConversation.otherUser.name || undefined} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm text-gray-400">👤</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{selectedConversation.otherUser.name || '匿名用户'}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            在线
                          </p>
                        </div>
                      </div>
                      <div className="ml-auto relative">
                        <button 
                          onClick={() => setShowMenu(!showMenu)}
                          className="p-2 hover:bg-[#252525] rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                        {showMenu && (
                          <div className="absolute right-0 top-full mt-1 bg-[#1E1E1E] border border-gray-700 rounded-lg shadow-xl z-20 min-w-36">
                            <button className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#252525] transition-colors">
                              查看个人主页
                            </button>
                            <button className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#252525] transition-colors">
                              清空聊天记录
                            </button>
                            <button className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#252525] transition-colors">
                              屏蔽用户
                            </button>
                            <button onClick={() => { deleteConversation(selectedConversation.id); setShowMenu(false); }} className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#252525] transition-colors">
                              删除会话
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4">
                      {isMessagesLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="flex flex-col items-center gap-2">
                            <svg className="w-8 h-8 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-gray-500 text-sm">加载中...</span>
                          </div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="relative mb-4">
                            <div className="text-6xl">💬</div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              <div className="w-3 h-3 bg-[#165DFF] rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                              <div className="w-3 h-3 bg-[#165DFF] rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                              <div className="w-3 h-3 bg-[#165DFF] rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">选择一个会话开始聊天</h3>
                          <p className="text-gray-400 text-sm">与好友分享你的想法和创作</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {groupedMessages.map((group) => (
                            <div key={group.date}>
                              <div className="flex justify-center mb-3">
                                <span className="px-3 py-1 bg-[#1E1E1E] text-gray-400 text-xs rounded-full">
                                  {formatDateHeader(group.date)}
                                </span>
                              </div>
                              <div className="space-y-3">
                                {group.messages.map((message, index) => {
                                  const sameSender = index > 0 && group.messages[index - 1].senderId === message.senderId;
                                  
                                  const handleContextMenu = (e: React.MouseEvent) => {
                                    e.preventDefault();
                                    if (canRetractMessage(message)) {
                                      setShowMessageMenu({ messageId: message.id, x: e.clientX, y: e.clientY });
                                    }
                                  };
                                  
                                  return (
                                    <div
                                      key={message.id}
                                      className={`flex ${isOwnMessage(message.senderId) ? 'justify-end' : 'justify-start'}`}
                                      onContextMenu={handleContextMenu}
                                    >
                                      <div className={`max-w-[70%] ${isOwnMessage(message.senderId) ? 'items-end' : 'items-start'} flex gap-2`}>
                                        {!isOwnMessage(message.senderId) && !sameSender && (
                                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {message.sender.avatar ? (
                                              <img src={message.sender.avatar || undefined} alt={message.sender.name || undefined} className="w-full h-full object-cover" />
                                            ) : (
                                              <span className="text-xs text-gray-400">👤</span>
                                            )}
                                          </div>
                                        )}
                                        <div className={`flex flex-col ${isOwnMessage(message.senderId) ? 'items-end' : 'items-start'}`}>
                                          {!isOwnMessage(message.senderId) && !sameSender && (
                                            <span className="text-xs text-gray-400 mb-1.5">{message.sender.name || '匿名用户'}</span>
                                          )}
                                          <div className={`relative px-4 py-2.5 rounded-[12px] shadow-sm ${
                                            isOwnMessage(message.senderId)
                                              ? 'bg-[#165DFF] text-white rounded-br-[4px]'
                                              : 'bg-[#252525] text-gray-100 rounded-bl-[4px]'
                                          }`}>
                                            {message.isRetracted ? (
                                              <p className="text-sm text-gray-500 italic">消息已被撤回</p>
                                            ) : message.contentType === 'IMAGE' && message.fileUrl ? (
                                              <div className="max-w-[200px] max-h-[200px]">
                                                <img 
                                                  src={message.fileUrl} 
                                                  alt={message.fileName || '图片'} 
                                                  className="max-w-full max-h-full rounded-lg object-contain"
                                                />
                                              </div>
                                            ) : message.contentType === 'FILE' && message.fileUrl ? (
                                              <a 
                                                href={message.fileUrl} 
                                                download={message.fileName}
                                                className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg hover:opacity-80 transition-opacity ${
                                                  isOwnMessage(message.senderId) ? 'bg-white/20' : 'bg-gray-700/50'
                                                }`}
                                              >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                <span className="text-sm truncate max-w-[150px]">{message.fileName || '下载文件'}</span>
                                              </a>
                                            ) : (
                                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                            )}
                                          </div>
                                          <div className={`flex items-center gap-1.5 mt-1 ${isOwnMessage(message.senderId) ? 'flex-row-reverse' : ''}`}>
                                            <span className="text-xs text-gray-500">{formatMessageTime(message.createdAt)}</span>
                                            {isOwnMessage(message.senderId) && (
                                              <span className="flex items-center gap-0.5">
                                                {message.status === 'sending' && (
                                                  <svg className="w-4 h-4 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                  </svg>
                                                )}
                                                {message.status === 'sent' && <span className="text-xs text-gray-500">✓</span>}
                                                {message.status === 'delivered' && <span className="text-xs text-gray-500">✓✓</span>}
                                                {message.status === 'read' && <span className="text-xs text-[#165DFF]">✓✓</span>}
                                                {message.status === 'failed' && (
                                                  <span className="text-xs text-red-400 cursor-pointer hover:text-red-300" title="点击重新发送">✗</span>
                                                )}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {showScrollUp && (
                      <button
                        onClick={scrollToBottom}
                        className="absolute bottom-20 right-8 w-10 h-10 bg-[#252525] hover:bg-[#333] rounded-full flex items-center justify-center shadow-lg transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </button>
                    )}

                    <div className="p-4 bg-[#1E1E1E] border-t border-gray-800">
                      <div className="relative">
                        {showEmojiPicker && (
                          <div className="absolute bottom-full left-0 mb-2 bg-[#1E1E1E] border border-gray-700 rounded-lg shadow-xl p-3 flex flex-wrap gap-1.5 z-20">
                            {emojis.map((emoji) => (
                              <button key={emoji} onClick={() => addEmoji(emoji)} className="text-xl hover:bg-[#252525] rounded p-1 transition-colors">
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <div className="flex gap-1">
                            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2.5 hover:bg-[#252525] rounded-lg transition-colors text-gray-400 hover:text-white">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5a2 2 0 00-2 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 00-2-2zm0-5a2 2 0 100 4 2 2 0 000-4zm5 5a2 2 0 100 4 2 2 0 000-4zm2 5a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div className="relative">
                              <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-2.5 hover:bg-[#252525] rounded-lg transition-colors text-gray-400 hover:text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                              </button>
                              {showMoreMenu && (
                                <div className="absolute bottom-full left-0 mb-2 bg-[#1E1E1E] border border-gray-700 rounded-lg shadow-xl z-20 min-w-32">
                                  <button 
                                    onClick={() => { imageInputRef.current?.click(); setShowMoreMenu(false); }}
                                    className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#252525] transition-colors flex items-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    图片/相册
                                  </button>
                                  <button 
                                    onClick={() => { fileInputRef.current?.click(); setShowMoreMenu(false); }}
                                    className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#252525] transition-colors flex items-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    文件
                                  </button>
                                  
                                </div>
                              )}
                            </div>
                            <input 
                              ref={imageInputRef} 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => { 
                                console.log('Image selected:', e.target.files?.[0]);
                                if (e.target.files?.[0]) {
                                  handleFileUpload(e.target.files[0], 'image');
                                }
                              }} 
                            />
                            <input 
                              ref={fileInputRef} 
                              type="file" 
                              accept=".pdf,.doc,.docx,.zip,.rar" 
                              className="hidden" 
                              onChange={(e) => { 
                                console.log('File selected:', e.target.files?.[0]);
                                if (e.target.files?.[0]) {
                                  handleFileUpload(e.target.files[0], 'file');
                                }
                              }} 
                            />
                            
                          </div>
                          <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="输入消息..."
                            className="flex-1 px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#165DFF] resize-none max-h-36"
                            rows={1}
                            style={{ minHeight: '44px' }}
                          />
                          <button
                            onClick={sendMessage}
                            disabled={!inputValue.trim()}
                            className={`px-6 py-3 rounded-lg font-medium transition-all ${
                              inputValue.trim()
                                ? 'bg-[#165DFF] text-white hover:bg-[#0D47A1] shadow-lg shadow-[#165DFF]/30'
                                : 'bg-[#252525] text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            发送
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h2 className="text-xl font-semibold text-white mb-2">欢迎来到私信</h2>
                    <p className="text-gray-400">选择一个会话开始聊天</p>
                  </div>
                )}
              </main>
            ) : (
              <main className="flex-1 bg-[#121212] flex flex-col">
                <div className="h-12 bg-[#1E1E1E] border-b border-gray-800 flex items-center px-4">
                  <button onClick={() => setSelectedConversation(null)} className="p-1.5 hover:bg-[#252525] rounded-lg transition-colors mr-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                      {selectedConversation?.otherUser.avatar ? (
                        <img src={selectedConversation.otherUser.avatar || undefined} alt={selectedConversation.otherUser.name || undefined} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm text-gray-400">👤</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{selectedConversation?.otherUser.name || '匿名用户'}</h3>
                      <p className="text-xs text-gray-500">在线</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-5xl mb-4">💬</div>
                      <p className="text-gray-400">还没有消息</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div key={message.id} className={`flex ${isOwnMessage(message.senderId) ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-4 py-2.5 rounded-[12px] ${
                            isOwnMessage(message.senderId) ? 'bg-[#165DFF] text-white' : 'bg-[#252525] text-gray-100'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 bg-[#1E1E1E] border-t border-gray-800">
                  <div className="flex gap-2">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="输入消息..."
                      className="flex-1 px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#165DFF] resize-none"
                      rows={1}
                    />
                    <button onClick={sendMessage} disabled={!inputValue.trim()} className={`px-6 py-3 rounded-lg font-medium ${inputValue.trim() ? 'bg-[#165DFF] text-white' : 'bg-[#252525] text-gray-500'}`}>
                      发送
                    </button>
                  </div>
                </div>
              </main>
            )}
          </div>
        </div>
      </div>

      {showMessageMenu && (
        <div className="fixed bg-[#1E1E1E] border border-gray-700 rounded-lg shadow-xl z-50 min-w-32" style={{ left: showMessageMenu.x, top: showMessageMenu.y }} onClick={() => setShowMessageMenu(null)}>
          <button onClick={(e) => { e.stopPropagation(); retractMessage(showMessageMenu.messageId); }} className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#252525] transition-colors">
            撤回消息
          </button>
        </div>
      )}

      {showContextMenu && showContextMenu.type === 'conversation' && (
        <div className="fixed bg-[#1E1E1E] border border-gray-700 rounded-lg shadow-xl z-50 min-w-36" style={{ left: showContextMenu.x, top: showContextMenu.y }} onClick={() => setShowContextMenu(null)}>
          {!conversations.find(c => c.id === showContextMenu.id)?.isPinned ? (
            <button onClick={(e) => { e.stopPropagation(); togglePinConversation(showContextMenu.id); setShowContextMenu(null); }} className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#252525] transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              置顶会话
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); togglePinConversation(showContextMenu.id); setShowContextMenu(null); }} className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#252525] transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              取消置顶
            </button>
          )}
          {!conversations.find(c => c.id === showContextMenu.id)?.isMuted ? (
            <button onClick={(e) => { e.stopPropagation(); toggleMuteConversation(showContextMenu.id); setShowContextMenu(null); }} className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#252525] transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              免打扰
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); toggleMuteConversation(showContextMenu.id); setShowContextMenu(null); }} className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#252525] transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              取消免打扰
            </button>
          )}
          <div className="border-t border-gray-700 my-1"></div>
          <button onClick={(e) => { e.stopPropagation(); if (showContextMenu.userId) blockUser(showContextMenu.userId); setShowContextMenu(null); }} className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#252525] transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            拉黑用户
          </button>
        </div>
      )}

    {showNewMessageModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1E1E1E] rounded-xl w-full max-w-md mx-4 shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">新建私信</h3>
            <button 
              onClick={() => setShowNewMessageModal(false)}
              className="p-1.5 hover:bg-[#252525] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-400 mb-4">选择一个好友发送私信</p>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>暂无好友</p>
                  <p className="text-sm mt-1">请先添加好友</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => {
                      startConversation(friend.id, friend.name, friend.avatar);
                      setShowNewMessageModal(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#252525] transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                        {friend.avatar ? (
                          <img src={friend.avatar || undefined} alt={friend.name || undefined} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm text-gray-400">👤</span>
                        )}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#1E1E1E] ${friend.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-white">{friend.name || '匿名用户'}</p>
                      <p className="text-xs text-gray-500">{friend.isOnline ? '在线' : '离线'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}