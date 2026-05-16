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
