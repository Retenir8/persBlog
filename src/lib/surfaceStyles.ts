const surfaceBase =
  "rounded-2xl border shadow-surface transition-[background-color,border-color] duration-300";

/** 顶层框体（如 PageIntro、文章正文区）— 饱和度最高 */
export const surfacePanelTopClass = `${surfaceBase} border-[color:var(--surface-0-border)] bg-[var(--surface-0-bg)]`;

/** 中层框体（评论区外壳、列表容器） */
export const surfacePanelClass = `${surfaceBase} border-[color:var(--surface-1-border)] bg-[var(--surface-1-bg)]`;

/** 内层框体（卡片、留言项、嵌套表单） */
export const surfacePanelNestedClass = `${surfaceBase} border-[color:var(--surface-2-border)] bg-[var(--surface-2-bg)]`;

/** 极淡框体（搜索栏、分类/标签管理） */
export const surfacePanelSubtleClass = `${surfaceBase} border-[color:var(--surface-3-border)] bg-[var(--surface-3-bg)]`;

/** 搜索栏内输入框（仅搜索区使用，保持白底） */
export const surfaceFieldClass =
  "rounded-lg border border-zinc-300/80 bg-[var(--surface-field-bg)] text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-[var(--surface-field-bg)] dark:text-zinc-100 dark:placeholder:text-zinc-500";

/** 文章卡片上的分类 / 标签胶囊 */
export const surfaceChipClass =
  "rounded-full border border-[color:var(--surface-chip-border)] bg-[var(--surface-chip-bg)] px-2 py-0.5 text-zinc-700 transition-[background-color,border-color] duration-300 dark:text-zinc-300";

/** 文章列表卡片 */
export const postCardSurfaceClass = `${surfacePanelNestedClass} shadow-[var(--shadow-surface)] ease-out hover:shadow-[var(--shadow-surface-hover)] hover:border-[color:color-mix(in_srgb,var(--surface-2-border)_55%,#a1a1aa_45%)]`;

/** 主操作链接按钮（与首页「发布文章」一致） */
export const pagePrimaryCtaClassName =
  "inline-flex shrink-0 items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white shadow-[0_1px_2px_rgb(0_0_0/0.16)] transition-[box-shadow,opacity] hover:opacity-95 hover:shadow-[0_2px_8px_rgb(0_0_0/0.2)] active:opacity-90 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_1px_2px_rgb(0_0_0/0.35)] dark:hover:shadow-[0_2px_10px_rgb(0_0_0/0.45)]";

const msgTransition =
  "transition-[background-color,border-color,color] duration-300";

/** 消息页外框 — 与文章区一致的顶层 panel */
export const messagesFrameClass = `${surfaceBase} flex min-h-[min(68vh,640px)] max-h-[calc(100dvh-11rem)] flex-col overflow-hidden border-[color:var(--surface-0-border)] bg-[var(--surface-0-bg)] shadow-surface`;

/** 消息页内容区 — 填满外框 */
export const messagesShellClass = `flex min-h-0 flex-1 flex-col overflow-hidden text-zinc-900 ${msgTransition} dark:text-zinc-100`;

export const messagesHeaderClass = `flex h-14 shrink-0 items-center justify-between rounded-t-2xl border-b border-[color:var(--surface-1-border)] bg-[var(--surface-1-bg)] px-4 ${msgTransition}`;

export const messagesAsideClass = `flex min-h-0 shrink-0 flex-col border-[color:var(--surface-1-border)] bg-[var(--surface-1-bg)] ${msgTransition}`;

/** 侧栏顶栏（好友列表标题 / 搜索框）统一高度 */
export const messagesSidebarHeaderClass = `flex h-[4.25rem] shrink-0 items-center border-b border-[color:var(--surface-1-border)] px-3 ${msgTransition}`;

/** 侧栏筛选栏（全部 / 未读 / 置顶） */
export const messagesSidebarTabsClass = `flex h-[2.25rem] shrink-0 border-b border-[color:var(--surface-1-border)]`;

/** 侧栏空状态（两个「去添加好友」对齐） */
export const messagesSidebarEmptyClass =
  "flex flex-1 flex-col items-center justify-center gap-3 px-4 py-12 text-center";

export const messagesSidebarScrollClass = "flex min-h-0 flex-1 flex-col overflow-y-auto";

/** 好友 / 会话列表容器 */
export const messagesListClass = "flex flex-col gap-1 p-2";

/** 好友 / 会话列表单行（固定高度，两栏对齐） */
export const messagesListItemClass = `flex h-[4.25rem] w-full shrink-0 items-center gap-3 rounded-lg px-3 ${msgTransition}`;

export const messagesListItemBtnClass = `${messagesListItemClass} text-left hover:bg-[var(--surface-2-bg)]`;

export const messagesListItemInteractiveClass = `${messagesListItemClass} cursor-pointer text-left hover:bg-[var(--surface-2-bg)]`;

export const messagesListAvatarClass =
  "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-3-bg)]";

export const messagesListBodyClass =
  "flex min-h-0 min-w-0 flex-1 flex-col items-start justify-center text-left";

export const messagesListTitleRowClass =
  "flex w-full min-w-0 items-center justify-between gap-2 text-left";

export const messagesListNameClass =
  "block w-full truncate text-left text-sm font-medium text-zinc-900 dark:text-zinc-100";

export const messagesListSubtitleClass =
  "mt-0.5 w-full truncate text-left text-xs text-zinc-500 dark:text-zinc-400";

export const messagesListMetaClass = "shrink-0 text-xs text-zinc-500 dark:text-zinc-400";

/** 消息页三栏等分（各 1/3） */
export const messagesColumnClass =
  "flex min-h-0 w-1/3 min-w-0 flex-col";

export const messagesMainClass = `flex min-h-0 flex-col bg-[var(--page-canvas)] ${msgTransition}`;

/** 空状态标题（还没有私信哦 / 欢迎来到私信） */
export const messagesEmptyTitleClass =
  "text-lg font-semibold text-zinc-900 dark:text-zinc-100";

/** 空状态说明文字 */
export const messagesEmptyDescClass =
  "text-sm text-zinc-500 dark:text-zinc-400";

/** 通用空状态（社交 / 添加好友等页面与消息页一致） */
export const paneEmptyClass = messagesSidebarEmptyClass;
export const paneEmptyTitleClass = messagesEmptyTitleClass;
export const paneEmptyDescClass = messagesEmptyDescClass;

/** 社交页分区标题 */
export const socialSectionTitleClass =
  "text-sm font-semibold text-zinc-700 dark:text-zinc-300";

/** 社交页用户卡片 */
export const socialUserCardClass = `${surfacePanelNestedClass} p-4`;

export const messagesHoverClass =
  "rounded-lg transition-colors hover:bg-[var(--surface-2-bg)]";

export const messagesIconBtnClass = `${messagesHoverClass} p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100`;

export const messagesTitleClass =
  "text-lg font-semibold text-zinc-900 dark:text-zinc-100";

export const messagesSubheadingClass =
  "text-sm font-semibold text-zinc-700 dark:text-zinc-300";

export const messagesMutedClass = "text-zinc-500 dark:text-zinc-400";

export const messagesDropdownClass = `absolute z-20 rounded-lg border border-[color:var(--surface-2-border)] bg-[var(--surface-1-bg)] shadow-xl ${msgTransition}`;

export const messagesMenuItemClass =
  "block w-full px-4 py-2 text-left text-sm text-zinc-600 transition-colors hover:bg-[var(--surface-2-bg)] dark:text-zinc-300";

export const messagesInputClass = `${surfaceFieldClass} w-full text-sm`;

export const messagesTextareaClass = `min-w-0 flex-1 max-h-36 resize-none rounded-lg border border-[color:var(--surface-2-border)] bg-[var(--surface-field-bg)] px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 ${msgTransition}`;

export const messagesComposerIconBtnClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-[var(--surface-2-bg)] hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100";

export const messagesSendBtnClass =
  `flex h-11 w-[4.5rem] shrink-0 items-center justify-center rounded-lg text-sm font-medium ${msgTransition}`;

export const messagesSendEnabledClass =
  "bg-zinc-900 text-white hover:opacity-95 dark:bg-zinc-100 dark:text-zinc-900";

export const messagesSendDisabledClass =
  "cursor-not-allowed bg-[var(--surface-2-bg)] text-zinc-400 dark:text-zinc-500";

export const messagesBubbleOwnClass =
  "rounded-[12px] rounded-br-[4px] bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900";

export const messagesBubbleOtherClass =
  "rounded-[12px] rounded-bl-[4px] border border-[color:var(--surface-2-border)] bg-[var(--surface-2-bg)] text-zinc-800 shadow-sm dark:text-zinc-200";

export const messagesAvatarClass =
  "flex items-center justify-center overflow-hidden rounded-full bg-[var(--surface-3-bg)]";

export const messagesConvActiveClass =
  "border-l-2 border-zinc-900 bg-[var(--surface-2-bg)] dark:border-zinc-100";

export const messagesFilterActiveClass =
  "border-b-2 border-zinc-900 bg-[var(--surface-2-bg)] text-zinc-900 dark:border-zinc-100 dark:text-zinc-100";

export const messagesAccentClass = "text-zinc-900 dark:text-zinc-100";

export const messagesDatePillClass =
  "rounded-full bg-[var(--surface-1-bg)] px-3 py-1 text-xs text-zinc-500 dark:text-zinc-400";

export const messagesComposerClass = `relative z-20 shrink-0 overflow-visible border-t border-[color:var(--surface-1-border)] bg-[var(--surface-1-bg)] px-3 py-3 ${msgTransition}`;

export const messagesEmojiPickerClass = `absolute bottom-full left-0 z-30 mb-2 grid w-[17.5rem] grid-cols-8 gap-1 rounded-lg border border-[color:var(--surface-2-border)] bg-[var(--surface-1-bg)] p-3 shadow-xl ${msgTransition}`;

export const messagesModalClass = `mx-4 w-full max-w-md rounded-xl border border-[color:var(--surface-2-border)] bg-[var(--surface-1-bg)] shadow-2xl ${msgTransition}`;

export const messagesTypingDotClass =
  "h-3 w-3 animate-bounce rounded-full bg-zinc-900 dark:bg-zinc-100";

export const messagesCtaLinkClass = `${pagePrimaryCtaClassName} rounded-lg`;
