"use client";

import { DigitalClockWidget } from "./DigitalClockWidget";
import { MoodCalendarWidget } from "./MoodCalendarWidget";
import { MusicPlayerWidget } from "./MusicPlayerWidget";
import { ZenQuoteWidget } from "./ZenQuoteWidget";
import { isKnownWidgetKey } from "@/lib/widgets/registry";
import { parseMoodCalendarData } from "@/lib/widgets/moodCalendar";
import { resolveZenQuoteDisplay } from "@/lib/widgets/zenQuote";

export function WidgetRenderer({
  widgetKey,
  quoteSeed,
  zenQuoteText,
  moodCalendarData,
  widgetUserId,
  compact,
}: {
  widgetKey: string;
  /** 用于一言卡片稳定选句，例如用户 id */
  quoteSeed?: string;
  /** 用户自定义一言；为空则按 seed 选默认句 */
  zenQuoteText?: string | null;
  /** 心情日历原始 JSON（来自 User.moodCalendarData） */
  moodCalendarData?: unknown;
  /** 用于心情日历保存；未登录预览可为空 */
  widgetUserId?: string | null;
  /** 三列窄布局（时钟 / 心情 / 音乐） */
  compact?: boolean;
}) {
  if (!isKnownWidgetKey(widgetKey)) return null;

  switch (widgetKey) {
    case "digital-clock":
      return <DigitalClockWidget compact={compact} />;
    case "mood-calendar":
      return (
        <MoodCalendarWidget
          userId={widgetUserId}
          initialData={parseMoodCalendarData(moodCalendarData)}
          compact={compact}
        />
      );
    case "music-player":
      return <MusicPlayerWidget compact={compact} />;
    case "zen-quote": {
      const seed = quoteSeed ?? "guest";
      const text = resolveZenQuoteDisplay(zenQuoteText, seed);
      return <ZenQuoteWidget text={text} />;
    }
    default:
      return null;
  }
}
