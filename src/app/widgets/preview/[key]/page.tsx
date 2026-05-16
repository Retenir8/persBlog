import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getWidgetByKey } from "@/lib/widgets/registry";
import { WidgetRenderer } from "@/components/widgets/WidgetRenderer";
import { WidgetPreviewActions } from "./WidgetPreviewActions";
import { getUserWidgetFields } from "@/lib/services/userWidgetSql";
import { PageIntro } from "@/components/layout/PageIntro";
import { surfacePanelClass } from "@/lib/surfaceStyles";

export default async function WidgetPreviewPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const meta = getWidgetByKey(key);
  if (!meta) notFound();

  const session = await auth();
  const ownerId = session?.user?.id ?? null;
  let currentWidgets: string[] = [];
  let moodCalendarData: unknown = undefined;
  let zenQuoteText: string | null = null;
  if (ownerId) {
    const row = await getUserWidgetFields(ownerId);
    currentWidgets = row?.profileWidgets ?? [];
    moodCalendarData = row?.moodCalendarData;
    zenQuoteText = row?.zenQuoteText ?? null;
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← 返回首页
        </Link>
      </div>
      <PageIntro title={meta.title} description={meta.description} />

      <div>
        <p className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          预览
        </p>
        <WidgetRenderer
          widgetKey={key}
          quoteSeed={ownerId ?? "preview"}
          zenQuoteText={zenQuoteText}
          moodCalendarData={moodCalendarData}
          widgetUserId={ownerId}
          compact={key === "digital-clock" || key === "mood-calendar" || key === "music-player"}
        />
      </div>

      <div className={`p-4 ${surfacePanelClass}`}>
        <WidgetPreviewActions
          widgetKey={key}
          userId={ownerId}
          currentWidgets={currentWidgets}
        />
      </div>
    </div>
  );
}
