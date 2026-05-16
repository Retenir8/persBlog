'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  messagesShellClass,
  messagesHeaderClass,
  messagesAsideClass,
  messagesSidebarHeaderClass,
  messagesSidebarTabsClass,
  messagesSidebarEmptyClass,
  messagesSidebarScrollClass,
  messagesMainClass,
  messagesIconBtnClass,
  messagesTitleClass,
  messagesSubheadingClass,
  messagesDropdownClass,
  messagesMenuItemClass,
  messagesInputClass,
  messagesTextareaClass,
  messagesComposerIconBtnClass,
  messagesEmojiPickerClass,
  messagesSendBtnClass,
  messagesSendEnabledClass,
  messagesSendDisabledClass,
  messagesBubbleOwnClass,
  messagesBubbleOtherClass,
  messagesConvActiveClass,
  messagesFilterActiveClass,
  messagesDatePillClass,
  messagesComposerClass,
  messagesModalClass,
  messagesCtaLinkClass,
  messagesColumnClass,
  messagesListClass,
  messagesListItemBtnClass,
  messagesListItemInteractiveClass,
  messagesListAvatarClass,
  messagesListBodyClass,
  messagesListTitleRowClass,
  messagesListNameClass,
  messagesListSubtitleClass,
  messagesListMetaClass,
  messagesEmptyTitleClass,
  messagesEmptyDescClass,
} from '@/lib/surfaceStyles';

function MessagesPaneEmpty({
  icon,
  iconWithPlane = false,
  title,
  description,
  action,
  footnote,
}: {
  icon: ReactNode;
  iconWithPlane?: boolean;
  title: string;
  description: string;
  action?: ReactNode;
  footnote?: string;
}) {
  return (
    <div className={messagesSidebarEmptyClass}>
      <div className="relative">
        {icon}
        {iconWithPlane && (
          <div className="absolute -top-2 -right-2 text-2xl animate-bounce">✈️</div>
        )}
      </div>
      <h3 className={messagesEmptyTitleClass}>{title}</h3>
      <p className={messagesEmptyDescClass}>{description}</p>
      {action}
      {footnote ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{footnote}</p>
      ) : null}
    </div>
  );
}

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
  conversationId?: string;
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState<{ messageId: string; x: number; y: number } | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<{ type: 'conversation' | 'message'; id: string; userId?: string; x: number; y: number } | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'pinned'>('all');
  const [mobileView, setMobileView] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [settingsPanel, setSettingsPanel] = useState<'message' | 'notification' | 'privacy' | null>(null);
  const [readReceiptEnabled, setReadReceiptEnabled] = useState(true);
  const [blacklist, setBlacklist] = useState<
    { id: string; blockedUserId: string; blockedUser: { id: string; name: string | null; avatar: string | null } }[]
  >([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const messageMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const addFriendsHref = session?.user?.id
    ? `/users/${session.user.id}/subscriptions`
    : "/login";

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
      const target = event.target as Node;
      if (
        showMessageMenu &&
        messageMenuRef.current &&
        !messageMenuRef.current.contains(target)
      ) {
        setShowMessageMenu(null);
      }
      if (showContextMenu) {
        setShowContextMenu(null);
      }
      if (showMenu && chatMenuRef.current && !chatMenuRef.current.contains(target)) {
        setShowMenu(false);
      }
      if (showSettingsMenu && settingsMenuRef.current && !settingsMenuRef.current.contains(target)) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMessageMenu, showContextMenu, showMenu, showSettingsMenu]);

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

  const scrollMessagesToBottom = (behavior: ScrollBehavior = 'auto') => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    });
  };

  const fetchMessages = async (conversationId: string, options?: { silent?: boolean }) => {
    if (!options?.silent) setIsMessagesLoading(true);
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`);
      const data = await response.json();
      if (data.success) {
        const messagesWithStatus = data.messages.map((msg: Message) => ({
          ...msg,
          status: msg.isRead ? 'read' : 'sent',
        }));
        setMessages(messagesWithStatus);
        if (!options?.silent) {
          scrollMessagesToBottom('auto');
        }
      }
    } catch (error) {
      console.error('获取消息失败:', error);
    } finally {
      if (!options?.silent) setIsMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !session?.user?.id || !selectedConversation) return;

    const content = inputValue.trim();

    const newMessage: Message = {
      id: 'temp-' + Date.now(),
      senderId: session.user.id,
      content,
      contentType: 'TEXT',
      isRead: false,
      isRetracted: false,
      createdAt: new Date().toISOString(),
      sender: { id: session.user.id, name: session.user.name || null, avatar: null },
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    scrollMessagesToBottom('auto');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: selectedConversation.otherUser.id,
          content,
          contentType: 'TEXT',
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        const serverMessage = data.message as Message | undefined;
        const conversationId = serverMessage?.conversationId as string | undefined;

        if (conversationId && selectedConversation.id !== conversationId) {
          const updated: Conversation = { ...selectedConversation, id: conversationId };
          setSelectedConversation(updated);
          setConversations((prev) => {
            const withoutStale = prev.filter(
              (c) =>
                c.id !== selectedConversation.id && c.otherUser.id !== updated.otherUser.id,
            );
            return [
              { ...updated, lastMessage: content, lastMessageTime: new Date().toISOString(), unreadCount: 0 },
              ...withoutStale,
            ];
          });
          await fetchMessages(conversationId, { silent: true });
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === newMessage.id
                ? {
                    ...msg,
                    id: serverMessage?.id ?? msg.id,
                    status: 'sent',
                    createdAt: serverMessage?.createdAt ?? msg.createdAt,
                  }
                : msg,
            ),
          );
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === selectedConversation.id ||
              (conversationId && conv.id === conversationId)
                ? {
                    ...conv,
                    id: conversationId ?? conv.id,
                    lastMessage: content,
                    lastMessageTime: new Date().toISOString(),
                    unreadCount: 0,
                  }
                : conv,
            ),
          );
        }
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
    scrollMessagesToBottom('auto');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        const serverMessage = data.message as Message | undefined;
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id
            ? {
                ...msg,
                id: serverMessage?.id ?? msg.id,
                fileUrl: serverMessage?.fileUrl ?? msg.fileUrl,
                status: 'sent',
                createdAt: serverMessage?.createdAt ?? msg.createdAt,
              }
            : msg
        ));
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
    setSelectedConversation(prev =>
      prev?.id === convId ? { ...prev, isMuted: !prev.isMuted } : prev
    );
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

  const clearConversationMessages = async (convId: string) => {
    try {
      const response = await fetch(`/api/conversations/${convId}/messages`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || '清空聊天记录失败');
        return;
      }
      setMessages([]);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === convId
            ? { ...conv, lastMessage: '', lastMessageTime: new Date().toISOString() }
            : conv,
        ),
      );
      if (selectedConversation?.id === convId) {
        setSelectedConversation((prev) =>
          prev ? { ...prev, lastMessage: '', lastMessageTime: new Date().toISOString() } : prev,
        );
      }
    } catch (error) {
      console.error('清空聊天记录失败:', error);
      alert('清空聊天记录失败，请稍后重试');
    }
  };

  const exitChat = () => {
    setSelectedConversation(null);
    setShowMenu(false);
    setMessages([]);
  };

  const openSettingsPanel = async (panel: 'message' | 'notification' | 'privacy') => {
    setShowSettingsMenu(false);
    setShowMenu(false);
    setSettingsPanel(panel);

    if (panel === 'message') {
      try {
        const response = await fetch('/api/users/settings');
        const data = await response.json();
        if (response.ok && data.success) {
          setReadReceiptEnabled(Boolean(data.settings?.readReceiptEnabled));
        }
      } catch (error) {
        console.error('获取消息设置失败:', error);
      }
    }

    if (panel === 'privacy') {
      try {
        const response = await fetch('/api/blacklist');
        const data = await response.json();
        if (response.ok && data.success) {
          setBlacklist(data.blacklist ?? []);
        }
      } catch (error) {
        console.error('获取黑名单失败:', error);
      }
    }
  };

  const updateReadReceipt = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/users/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readReceiptEnabled: enabled }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        setReadReceiptEnabled(enabled);
      } else {
        alert(data.error || '保存设置失败');
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      alert('保存设置失败，请稍后重试');
    }
  };

  const unblockUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/blacklist/${userId}`, { method: 'DELETE' });
      if (response.ok) {
        setBlacklist((prev) => prev.filter((item) => item.blockedUserId !== userId));
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || '取消屏蔽失败');
      }
    } catch (error) {
      console.error('取消屏蔽失败:', error);
      alert('取消屏蔽失败，请稍后重试');
    }
  };

  const requestBrowserNotification = async () => {
    if (!('Notification' in window)) {
      alert('当前浏览器不支持桌面通知');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      alert('已允许浏览器通知，新消息时系统可能会提醒你');
    } else if (permission === 'denied') {
      alert('通知权限已被拒绝，请在浏览器站点设置中手动开启');
    }
  };

  const retractMessage = async (messageId: string) => {
    if (messageId.startsWith('temp-')) {
      alert('消息正在发送中，请稍后再试撤回');
      setShowMessageMenu(null);
      return;
    }

    try {
      const response = await fetch(`/api/messages/${messageId}/retract`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, isRetracted: true } : msg)),
        );
        setShowMessageMenu(null);
      } else {
        alert(data.error || '撤回失败，请稍后重试');
        setShowMessageMenu(null);
      }
    } catch (error) {
      console.error('撤回消息失败:', error);
      alert('撤回失败，请稍后重试');
      setShowMessageMenu(null);
    }
  };

  const canRetractMessage = (message: Message) => {
    if (!isOwnMessage(message.senderId) || message.isRetracted) return false;
    const now = new Date().getTime();
    const messageTime = new Date(message.createdAt).getTime();
    return now - messageTime < 2 * 60 * 1000;
  };

  const openMessageActionMenu = (message: Message, clientX: number, clientY: number) => {
    if (!canRetractMessage(message)) return;
    setShowContextMenu(null);
    setShowMenu(false);
    setShowMessageMenu({ messageId: message.id, x: clientX, y: clientY });
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
    scrollMessagesToBottom('smooth');
    setShowScrollUp(false);
  };

  const isOwnMessage = (senderId: string) => senderId === session?.user?.id;

  const groupedMessages = groupMessagesByDate(messages);

  const unreadCount = conversations.reduce((acc, conv) => acc + conv.unreadCount, 0);

  const startConversation = async (
    friendId: string,
    friendName: string | null,
    friendAvatar: string | null,
  ) => {
    const existingConv = conversations.find((c) => c.otherUser.id === friendId);
    if (existingConv) {
      setSelectedConversation(existingConv);
      setMessages([]);
      if (mobileView) setShowFriendsList(false);
      return;
    }

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: friendId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.error || '无法打开会话');
        return;
      }

      const conv: Conversation = {
        ...data.conversation,
        lastMessageTime: data.conversation.lastMessageTime
          ? String(data.conversation.lastMessageTime)
          : null,
      };

      setConversations((prev) =>
        prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev],
      );
      setSelectedConversation(conv);
      setMessages([]);
    } catch (error) {
      console.error('创建会话失败:', error);
      alert('创建会话失败，请稍后重试');
    }

    if (mobileView) {
      setShowFriendsList(false);
    }
  };

  return (
    <div className={messagesShellClass}>
      <div className="flex min-h-0 flex-1 flex-col">
        <header className={messagesHeaderClass}>
          <div className="flex items-center gap-3">
            <h1 className={messagesTitleClass}>私信</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFriendsList((prev) => !prev)}
              className={`${messagesIconBtnClass} ${showFriendsList ? 'bg-[var(--surface-2-bg)] text-zinc-900 dark:text-zinc-100' : ''}`}
              title={showFriendsList ? '隐藏好友列表' : '显示好友列表'}
              aria-pressed={showFriendsList}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            <button 
              onClick={() => setShowNewMessageModal(true)}
              className={`${messagesCtaLinkClass} px-4 py-2 flex items-center gap-2`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建私信
            </button>
            <button 
              onClick={fetchConversations}
              className={messagesIconBtnClass}
              title="刷新"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div ref={settingsMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`${messagesIconBtnClass} ${showSettingsMenu ? 'bg-[var(--surface-2-bg)] text-zinc-900 dark:text-zinc-100' : ''}`}
                title="设置"
                aria-expanded={showSettingsMenu}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {showSettingsMenu && (
                <div className={`${messagesDropdownClass} right-0 top-full z-30 mt-1 min-w-36`}>
                  <button type="button" className={messagesMenuItemClass} onClick={() => openSettingsPanel('message')}>
                    消息设置
                  </button>
                  <button type="button" className={messagesMenuItemClass} onClick={() => openSettingsPanel('notification')}>
                    通知设置
                  </button>
                  <button type="button" className={messagesMenuItemClass} onClick={() => openSettingsPanel('privacy')}>
                    隐私设置
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {showFriendsList && (!mobileView || !selectedConversation) && (
            <aside
              className={`${messagesAsideClass} ${mobileView ? 'w-full' : messagesColumnClass} border-r`}
            >
              <div className={messagesSidebarHeaderClass}>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    好友列表
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {friends.length} 位好友
                  </p>
                </div>
              </div>
              <div aria-hidden className={messagesSidebarTabsClass} />
              <div className={messagesSidebarScrollClass}>
                {friends.length === 0 ? (
                  <MessagesPaneEmpty
                    icon={<div className="text-6xl">👥</div>}
                    title="还没有好友"
                    description="互相关注后即可成为好友"
                  />
                ) : (
                  <div className={messagesListClass}>
                    {friends.map((friend) => (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => startConversation(friend.id, friend.name, friend.avatar)}
                        className={`${messagesListItemBtnClass} group`}
                      >
                        <div className="relative shrink-0">
                          <div className={messagesListAvatarClass}>
                            {friend.avatar ? (
                              <img src={friend.avatar || undefined} alt={friend.name || undefined} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-sm text-zinc-500 dark:text-zinc-400">👤</span>
                            )}
                          </div>
                          <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[color:var(--surface-1-border)] ${friend.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                        </div>
                        <div className={messagesListBodyClass}>
                          <span className={messagesListNameClass}>{friend.name || '匿名用户'}</span>
                          <p className={`${messagesListSubtitleClass} flex items-center justify-start gap-1.5`}>
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${friend.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                            {friend.isOnline ? '在线' : '离线'}
                          </p>
                        </div>
                        <svg className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}

          {(!mobileView || (mobileView && !selectedConversation && !showFriendsList)) && (
            <aside
              className={`${messagesAsideClass} ${mobileView ? 'w-full' : messagesColumnClass} border-r`}
            >
              <div className={`${messagesSidebarHeaderClass} w-full`}>
                <div className="relative w-full">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索好友或消息..."
                    className={`${messagesInputClass} pl-10 pr-10 py-2`}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className={messagesSidebarTabsClass}>
                {[
                  { key: 'all', label: '全部' },
                  { key: 'unread', label: '未读' },
                  { key: 'pinned', label: '置顶' },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key as 'all' | 'unread' | 'pinned')}
                    className={`flex h-full flex-1 items-center justify-center text-xs font-medium transition-colors ${
                      activeFilter === filter.key 
                        ? `${messagesFilterActiveClass}` 
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className={messagesSidebarScrollClass}>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <svg className="w-8 h-8 text-zinc-500 dark:text-zinc-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">加载中...</p>
                  </div>
                ) : sortedConversations.length === 0 ? (
                  <MessagesPaneEmpty
                    icon={<div className="text-6xl">💬</div>}
                    iconWithPlane
                    title="还没有私信哦"
                    description="找到志同道合的朋友，开始你的第一次对话吧"
                    action={
                      <Link
                        href={addFriendsHref}
                        className={`${messagesCtaLinkClass} inline-flex items-center gap-2 px-5 py-2 text-sm`}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        去添加好友
                      </Link>
                    }
                    footnote="也可以通过用户主页的私信按钮发起对话"
                  />
                ) : (
                  <div className={messagesListClass}>
                    {sortedConversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => { setSelectedConversation(conv); markAsRead(conv.id); }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setShowContextMenu({ type: 'conversation', id: conv.id, userId: conv.otherUser.id, x: e.clientX, y: e.clientY });
                        }}
                        className={`${messagesListItemInteractiveClass} ${
                          selectedConversation?.id === conv.id ? messagesConvActiveClass : ''
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className={messagesListAvatarClass}>
                            {conv.otherUser.avatar ? (
                              <img
                                src={conv.otherUser.avatar || undefined}
                                alt={conv.otherUser.name || undefined}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = '<span class="text-sm text-zinc-500 dark:text-zinc-400">👤</span>';
                                }}
                              />
                            ) : (
                              <span className="text-sm text-zinc-500 dark:text-zinc-400">👤</span>
                            )}
                          </div>
                        </div>
                        <div className={messagesListBodyClass}>
                          <div className={messagesListTitleRowClass}>
                            <span className={messagesListNameClass}>
                              {conv.otherUser.name || '匿名用户'}
                            </span>
                            <span className={messagesListMetaClass}>
                              {formatTime(conv.lastMessageTime)}
                            </span>
                          </div>
                          <p className={messagesListSubtitleClass}>
                            {conv.lastMessage || '暂无消息'}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                        {conv.isPinned && (
                          <span className="shrink-0 text-xs text-zinc-900 dark:text-zinc-100">★</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}

          {(!mobileView || (mobileView && selectedConversation)) && (
              <main
                className={`${messagesMainClass} ${
                  mobileView
                    ? 'w-full flex-1'
                    : showFriendsList
                      ? `${messagesColumnClass} border-l border-[color:var(--surface-1-border)]`
                      : 'flex min-h-0 flex-1 min-w-0 flex-col border-l border-[color:var(--surface-1-border)]'
                }`}
              >
                {selectedConversation ? (
                  <div className="flex flex-col h-full">
                    <div className="h-12 bg-[var(--surface-1-bg)] border-b border-[color:var(--surface-1-border)] flex items-center px-4">
                      <button
                        type="button"
                        onClick={exitChat}
                        className={`${messagesIconBtnClass} mr-3 p-1.5`}
                        aria-label="返回会话列表"
                      >
                        <svg className="w-5 h-5 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-3-bg)]">
                          {selectedConversation.otherUser.avatar ? (
                            <img src={selectedConversation.otherUser.avatar || undefined} alt={selectedConversation.otherUser.name || undefined} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">👤</span>
                          )}
                        </div>
                        <div className="min-w-0 text-left">
                          <h3 className={`${messagesSubheadingClass} truncate`}>{selectedConversation.otherUser.name || '匿名用户'}</h3>
                          <p className="mt-0.5 flex items-center justify-start gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                            在线
                          </p>
                        </div>
                      </div>
                      <div ref={chatMenuRef} className="relative ml-auto">
                        <button
                          type="button"
                          onClick={() => setShowMenu(!showMenu)}
                          className="rounded-lg p-2 transition-colors hover:bg-[var(--surface-2-bg)]"
                          aria-label="更多操作"
                        >
                          <svg className="w-5 h-5 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                        {showMenu && (
                          <div className={`${messagesDropdownClass} right-0 top-full z-30 mt-1 min-w-36`}>
                            <button
                              type="button"
                              className={messagesMenuItemClass}
                              onClick={() => {
                                setShowMenu(false);
                                router.push(`/users/${selectedConversation.otherUser.id}`);
                              }}
                            >
                              查看个人主页
                            </button>
                            <button
                              type="button"
                              className={messagesMenuItemClass}
                              onClick={() => {
                                toggleMuteConversation(selectedConversation.id);
                                setShowMenu(false);
                              }}
                            >
                              {selectedConversation.isMuted ? '取消免打扰' : '免打扰'}
                            </button>
                            <button
                              type="button"
                              className={messagesMenuItemClass}
                              onClick={() => {
                                if (window.confirm('确定清空与该好友的聊天记录吗？此操作不可恢复。')) {
                                  clearConversationMessages(selectedConversation.id);
                                  setShowMenu(false);
                                }
                              }}
                            >
                              清空聊天记录
                            </button>
                            <button
                              type="button"
                              className={messagesMenuItemClass}
                              onClick={() => {
                                if (window.confirm('确定屏蔽该用户吗？屏蔽后将无法互相发送私信。')) {
                                  blockUser(selectedConversation.otherUser.id);
                                  setShowMenu(false);
                                }
                              }}
                            >
                              屏蔽用户
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('确定删除该会话吗？')) {
                                  deleteConversation(selectedConversation.id);
                                  setShowMenu(false);
                                }
                              }}
                              className="block w-full px-4 py-2 text-left text-sm text-red-400 transition-colors hover:bg-[var(--surface-2-bg)]"
                            >
                              删除会话
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div ref={messagesContainerRef} className="relative z-0 flex-1 overflow-y-auto p-4">
                      {isMessagesLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="flex flex-col items-center gap-2">
                            <svg className="w-8 h-8 text-zinc-500 dark:text-zinc-400 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-zinc-500 dark:text-zinc-400 text-sm">加载中...</span>
                          </div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center px-4">
                          <p className={messagesEmptyDescClass}>还没有消息，在下方输入并发送吧</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {groupedMessages.map((group) => (
                            <div key={group.date}>
                              <div className="flex justify-center mb-3">
                                <span className={messagesDatePillClass}>
                                  {formatDateHeader(group.date)}
                                </span>
                              </div>
                              <div className="space-y-3">
                                {group.messages.map((message, index) => {
                                  const sameSender = index > 0 && group.messages[index - 1].senderId === message.senderId;
                                  
                                  const handleContextMenu = (e: React.MouseEvent) => {
                                    e.preventDefault();
                                    openMessageActionMenu(message, e.clientX, e.clientY);
                                  };
                                  
                                  return (
                                    <div
                                      key={message.id}
                                      className={`flex ${isOwnMessage(message.senderId) ? 'justify-end' : 'justify-start'}`}
                                      onContextMenu={handleContextMenu}
                                    >
                                      <div className={`max-w-[70%] ${isOwnMessage(message.senderId) ? 'items-end' : 'items-start'} flex gap-2`}>
                                        {!isOwnMessage(message.senderId) && !sameSender && (
                                          <div className="w-8 h-8 rounded-full bg-[var(--surface-3-bg)] flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {message.sender.avatar ? (
                                              <img src={message.sender.avatar || undefined} alt={message.sender.name || undefined} className="w-full h-full object-cover" />
                                            ) : (
                                              <span className="text-xs text-zinc-500 dark:text-zinc-400">👤</span>
                                            )}
                                          </div>
                                        )}
                                        <div className={`flex flex-col ${isOwnMessage(message.senderId) ? 'items-end' : 'items-start'}`}>
                                          {!isOwnMessage(message.senderId) && !sameSender && (
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">{message.sender.name || '匿名用户'}</span>
                                          )}
                                          {message.isRetracted ? (
                                            <div
                                              className={`relative px-4 py-2.5 shadow-sm ${
                                                isOwnMessage(message.senderId)
                                                  ? messagesBubbleOwnClass
                                                  : messagesBubbleOtherClass
                                              }`}
                                            >
                                              <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">消息已被撤回</p>
                                            </div>
                                          ) : message.contentType === 'IMAGE' && message.fileUrl ? (
                                            <img
                                              src={message.fileUrl}
                                              alt={message.fileName || '图片'}
                                              className="max-h-[240px] max-w-[240px] rounded-xl object-contain"
                                            />
                                          ) : (
                                            <div
                                              className={`relative px-4 py-2.5 shadow-sm ${
                                                isOwnMessage(message.senderId)
                                                  ? messagesBubbleOwnClass
                                                  : messagesBubbleOtherClass
                                              }`}
                                            >
                                              {message.contentType === 'FILE' && message.fileUrl ? (
                                                <a
                                                  href={message.fileUrl}
                                                  download={message.fileName}
                                                  className={`inline-flex items-center gap-2 rounded-lg px-2 py-1 transition-opacity hover:opacity-80 ${
                                                    isOwnMessage(message.senderId) ? 'bg-white/20' : 'bg-[var(--surface-3-bg)]/50'
                                                  }`}
                                                >
                                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                  </svg>
                                                  <span className="max-w-[150px] truncate text-sm">{message.fileName || '下载文件'}</span>
                                                </a>
                                              ) : (
                                                <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                                              )}
                                            </div>
                                          )}
                                          <div className={`flex items-center gap-1.5 mt-1 ${isOwnMessage(message.senderId) ? 'flex-row-reverse' : ''}`}>
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatMessageTime(message.createdAt)}</span>
                                            {isOwnMessage(message.senderId) && (
                                              <span className="flex items-center gap-0.5">
                                                {message.status === 'sending' && (
                                                  <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                  </svg>
                                                )}
                                                {(message.status === 'sent' || message.status === 'delivered') && (
                                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">✓</span>
                                                )}
                                                {message.status === 'read' && (
                                                  <span className="text-xs text-zinc-900 dark:text-zinc-100">✓</span>
                                                )}
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
                        className="absolute bottom-20 right-8 w-10 h-10 bg-[var(--surface-2-bg)] hover:bg-[var(--surface-3-bg)] rounded-full flex items-center justify-center shadow-lg transition-colors"
                      >
                        <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </button>
                    )}

                    <div className={messagesComposerClass}>
                      {showEmojiPicker && (
                        <div className={messagesEmojiPickerClass}>
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => addEmoji(emoji)}
                              className="flex h-8 w-8 items-center justify-center rounded text-xl transition-colors hover:bg-[var(--surface-2-bg)]"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <div className="flex shrink-0 items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setShowEmojiPicker(!showEmojiPicker);
                              setShowMoreMenu(false);
                            }}
                            className={messagesComposerIconBtnClass}
                            aria-label="选择表情"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5a2 2 0 00-2 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 00-2-2zm0-5a2 2 0 100 4 2 2 0 000-4zm5 5a2 2 0 100 4 2 2 0 000-4zm2 5a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setShowMoreMenu(!showMoreMenu);
                                setShowEmojiPicker(false);
                              }}
                              className={messagesComposerIconBtnClass}
                              aria-label="发送图片或文件"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                              </svg>
                            </button>
                            {showMoreMenu && (
                              <div className={`${messagesDropdownClass} absolute bottom-full left-0 z-30 mb-2 min-w-32`}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    imageInputRef.current?.click();
                                    setShowMoreMenu(false);
                                  }}
                                  className={`${messagesMenuItemClass} flex items-center gap-2`}
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  图片/相册
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    fileInputRef.current?.click();
                                    setShowMoreMenu(false);
                                  }}
                                  className={`${messagesMenuItemClass} flex items-center gap-2`}
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                              if (e.target.files?.[0]) {
                                handleFileUpload(e.target.files[0], 'image');
                              }
                              e.target.value = '';
                            }}
                          />
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.zip,.rar"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(e.target.files[0], 'file');
                              }
                              e.target.value = '';
                            }}
                          />
                        </div>
                        <textarea
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="输入消息..."
                          className={messagesTextareaClass}
                          rows={1}
                          style={{ minHeight: '44px' }}
                        />
                        <button
                          type="button"
                          onClick={sendMessage}
                          disabled={!inputValue.trim()}
                          className={`${messagesSendBtnClass} ${
                            inputValue.trim() ? messagesSendEnabledClass : messagesSendDisabledClass
                          }`}
                        >
                          发送
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div aria-hidden className={messagesSidebarHeaderClass} />
                    <div aria-hidden className={messagesSidebarTabsClass} />
                    <div className={messagesSidebarScrollClass}>
                      <MessagesPaneEmpty
                        icon={<div className="text-6xl">💬</div>}
                        title="欢迎来到私信"
                        description="选择一个会话开始聊天"
                      />
                    </div>
                  </>
                )}
              </main>
          )}

        </div>
      </div>

      {showMessageMenu && (
        <div
          ref={messageMenuRef}
          className="fixed z-50 min-w-32 rounded-lg border border-[color:var(--surface-2-border)] bg-[var(--surface-1-bg)] shadow-xl"
          style={{ left: showMessageMenu.x, top: showMessageMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => retractMessage(showMessageMenu.messageId)}
            className={messagesMenuItemClass}
          >
            撤回消息
          </button>
        </div>
      )}

      {showContextMenu && showContextMenu.type === 'conversation' && (
        <div className="fixed bg-[var(--surface-1-bg)] border border-[color:var(--surface-2-border)] rounded-lg shadow-xl z-50 min-w-36" style={{ left: showContextMenu.x, top: showContextMenu.y }} onClick={() => setShowContextMenu(null)}>
          {!conversations.find(c => c.id === showContextMenu.id)?.isPinned ? (
            <button onClick={(e) => { e.stopPropagation(); togglePinConversation(showContextMenu.id); setShowContextMenu(null); }} className="block w-full px-4 py-2 text-left text-sm text-zinc-600 dark:text-zinc-300 hover:bg-[var(--surface-2-bg)] transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              置顶会话
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); togglePinConversation(showContextMenu.id); setShowContextMenu(null); }} className="block w-full px-4 py-2 text-left text-sm text-zinc-600 dark:text-zinc-300 hover:bg-[var(--surface-2-bg)] transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              取消置顶
            </button>
          )}
          {!conversations.find(c => c.id === showContextMenu.id)?.isMuted ? (
            <button onClick={(e) => { e.stopPropagation(); toggleMuteConversation(showContextMenu.id); setShowContextMenu(null); }} className="block w-full px-4 py-2 text-left text-sm text-zinc-600 dark:text-zinc-300 hover:bg-[var(--surface-2-bg)] transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              免打扰
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); toggleMuteConversation(showContextMenu.id); setShowContextMenu(null); }} className="block w-full px-4 py-2 text-left text-sm text-zinc-600 dark:text-zinc-300 hover:bg-[var(--surface-2-bg)] transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              取消免打扰
            </button>
          )}
          <div className="border-t border-[color:var(--surface-2-border)] my-1"></div>
          <button onClick={(e) => { e.stopPropagation(); if (showContextMenu.userId) blockUser(showContextMenu.userId); setShowContextMenu(null); }} className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[var(--surface-2-bg)] transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            拉黑用户
          </button>
        </div>
      )}

    {settingsPanel && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className={`${messagesModalClass} max-h-[min(80vh,520px)] overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-[color:var(--surface-2-border)] p-4">
            <h3 className={messagesTitleClass}>
              {settingsPanel === 'message' && '消息设置'}
              {settingsPanel === 'notification' && '通知设置'}
              {settingsPanel === 'privacy' && '隐私设置'}
            </h3>
            <button
              type="button"
              onClick={() => setSettingsPanel(null)}
              className="rounded-lg p-1.5 transition-colors hover:bg-[var(--surface-2-bg)]"
              aria-label="关闭"
            >
              <svg className="h-5 w-5 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="max-h-[min(60vh,420px)] overflow-y-auto p-4">
            {settingsPanel === 'message' && (
              <div className="space-y-4">
                <label className="flex cursor-pointer items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">已读回执</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">开启后，对方可看到你是否已读消息</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={readReceiptEnabled}
                    onChange={(e) => updateReadReceipt(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600"
                  />
                </label>
              </div>
            )}

            {settingsPanel === 'notification' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">浏览器通知</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    允许后，在收到新私信时浏览器可能会弹出提醒（需保持页面打开或允许站点通知）。
                  </p>
                  <button
                    type="button"
                    onClick={requestBrowserNotification}
                    className={`${messagesCtaLinkClass} mt-3 px-4 py-2 text-sm`}
                  >
                    开启浏览器通知
                  </button>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">已免打扰的会话</p>
                  {conversations.filter((c) => c.isMuted).length === 0 ? (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">暂无免打扰会话</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {conversations
                        .filter((c) => c.isMuted)
                        .map((conv) => (
                          <li
                            key={conv.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-[var(--surface-2-bg)] px-3 py-2"
                          >
                            <span className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                              {conv.otherUser.name || '匿名用户'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleMuteConversation(conv.id)}
                              className="shrink-0 text-xs text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                            >
                              取消免打扰
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {settingsPanel === 'privacy' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">已屏蔽的用户无法与你互发私信。</p>
                  <Link
                    href={addFriendsHref}
                    onClick={() => setSettingsPanel(null)}
                    className="mt-2 inline-block text-sm text-zinc-700 underline dark:text-zinc-300"
                  >
                    管理好友与关注
                  </Link>
                </div>
                {blacklist.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">暂无屏蔽用户</p>
                ) : (
                  <ul className="space-y-2">
                    {blacklist.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-[var(--surface-2-bg)] px-3 py-2"
                      >
                        <span className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                          {item.blockedUser.name || '匿名用户'}
                        </span>
                        <button
                          type="button"
                          onClick={() => unblockUser(item.blockedUserId)}
                          className="shrink-0 text-xs text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        >
                          取消屏蔽
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {showNewMessageModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={messagesModalClass}>
          <div className="flex items-center justify-between p-4 border-b border-[color:var(--surface-2-border)]">
            <h3 className={messagesTitleClass}>新建私信</h3>
            <button 
              onClick={() => setShowNewMessageModal(false)}
              className="p-1.5 hover:bg-[var(--surface-2-bg)] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">选择一个好友发送私信</p>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                  <p>暂无好友</p>
                  <p className="text-sm mt-1 mb-3">互相关注后即可发私信</p>
                  <Link
                    href={addFriendsHref}
                    onClick={() => setShowNewMessageModal(false)}
                    className={`${messagesCtaLinkClass} inline-block px-4 py-2 text-sm`}
                  >
                    去添加好友
                  </Link>
                </div>
              ) : (
                friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => {
                      startConversation(friend.id, friend.name, friend.avatar);
                      setShowNewMessageModal(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface-2-bg)] transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-[var(--surface-3-bg)] flex items-center justify-center overflow-hidden">
                        {friend.avatar ? (
                          <img src={friend.avatar || undefined} alt={friend.name || undefined} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">👤</span>
                        )}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[color:var(--surface-1-border)] ${friend.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{friend.name || '匿名用户'}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{friend.isOnline ? '在线' : '离线'}</p>
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