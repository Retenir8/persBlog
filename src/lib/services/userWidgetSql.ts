import { prisma } from "@/lib/db";

export type UserWidgetFields = {
  profileWidgets: string[];
  zenQuoteText: string | null;
  moodCalendarData: unknown;
};

/**
 * 读取小组件相关列（绕过 Prisma Client 与 schema 不同步时的 select 校验）。
 * 需在数据库已存在对应列（迁移已执行）。
 */
export async function getUserWidgetFields(
  userId: string
): Promise<UserWidgetFields | null> {
  const rows = await prisma.$queryRaw<UserWidgetFields[]>`
    SELECT "profileWidgets", "zenQuoteText", "moodCalendarData"
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    profileWidgets: Array.isArray(row.profileWidgets) ? row.profileWidgets : [],
    zenQuoteText: row.zenQuoteText ?? null,
    moodCalendarData: row.moodCalendarData ?? {},
  };
}

type WidgetPatch = {
  profileWidgets?: string[];
  zenQuoteText?: string | null;
  moodCalendarData?: Record<string, unknown>;
};

/** 将小组件字段从 Prisma update 对象中拆出，改为原生 SQL 更新（避免过时 Client 校验失败）。 */
export function extractWidgetPatchFromUserUpdate(
  data: Record<string, unknown>
): { rest: Record<string, unknown>; widgets: WidgetPatch } {
  const widgets: WidgetPatch = {};
  const rest = { ...data };

  if ("profileWidgets" in rest) {
    const pw = rest.profileWidgets;
    if (Array.isArray(pw)) {
      widgets.profileWidgets = pw.filter((x): x is string => typeof x === "string");
    }
    delete rest.profileWidgets;
  }
  if ("zenQuoteText" in rest) {
    const z = rest.zenQuoteText;
    if (z === null) widgets.zenQuoteText = null;
    else if (typeof z === "string") widgets.zenQuoteText = z;
    delete rest.zenQuoteText;
  }
  if ("moodCalendarData" in rest) {
    const m = rest.moodCalendarData;
    if (m !== null && typeof m === "object" && !Array.isArray(m)) {
      widgets.moodCalendarData = m as Record<string, unknown>;
    } else if (m === null) {
      widgets.moodCalendarData = {};
    }
    delete rest.moodCalendarData;
  }

  return { rest, widgets };
}

export async function applyUserWidgetSqlUpdates(
  userId: string,
  widgets: WidgetPatch
): Promise<void> {
  if (widgets.profileWidgets !== undefined) {
    const pw = widgets.profileWidgets;
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "profileWidgets" = $1::text[] WHERE "id" = $2`,
      pw,
      userId
    );
  }

  if (widgets.zenQuoteText !== undefined) {
    if (widgets.zenQuoteText === null) {
      await prisma.$executeRaw`
        UPDATE "User" SET "zenQuoteText" = NULL WHERE "id" = ${userId}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "User" SET "zenQuoteText" = ${widgets.zenQuoteText} WHERE "id" = ${userId}
      `;
    }
  }

  if (widgets.moodCalendarData !== undefined) {
    const json = JSON.stringify(widgets.moodCalendarData);
    await prisma.$executeRaw`
      UPDATE "User"
      SET "moodCalendarData" = ${json}::jsonb
      WHERE "id" = ${userId}
    `;
  }
}
