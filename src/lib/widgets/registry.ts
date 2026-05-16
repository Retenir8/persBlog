export type WidgetDefinition = {
  key: string;
  title: string;
  description: string;
};

export const WIDGET_REGISTRY: readonly WidgetDefinition[] = [
  {
    key: "digital-clock",
    title: "数字时钟",
    description: "实时显示当前日期与时间；在「我的博客」中与心情日历、音乐播放器同一行展示。",
  },
  {
    key: "mood-calendar",
    title: "心情日历",
    description:
      "月历中点击日期，用格子背景色记录心情（愤怒红、悲伤蓝、平静绿、开心黄），数据保存在你的账号中。",
  },
  {
    key: "zen-quote",
    title: "一言卡片",
    description: "在「我的博客」里可自定义一句话；留空则使用内置默认文案。",
  },
  {
    key: "music-player",
    title: "音乐播放器",
    description: "播放你在「音乐」页收藏的第一首单曲；若无单曲则引导去音乐页添加。",
  },
] as const;

/** 与「我的博客」中同一行三列布局对应的小组件 */
export const WIDGET_TRIO_KEYS = [
  "digital-clock",
  "mood-calendar",
  "music-player",
] as const;

const KEY_SET = new Set(WIDGET_REGISTRY.map((w) => w.key));

export function isKnownWidgetKey(key: string): boolean {
  return KEY_SET.has(key);
}

export function getWidgetByKey(key: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY.find((w) => w.key === key);
}
