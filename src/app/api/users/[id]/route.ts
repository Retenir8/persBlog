import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isKnownWidgetKey } from "@/lib/widgets/registry";
import { ZEN_QUOTE_MAX_LEN } from "@/lib/widgets/zenQuote";
import { sanitizeMoodCalendarPayload } from "@/lib/widgets/moodCalendar";
import {
  applyUserWidgetSqlUpdates,
  extractWidgetPatchFromUserUpdate,
} from "@/lib/services/userWidgetSql";

const USER_PATCH_SCALARS = [
  "name",
  "bio",
  "signature",
  "tags",
  "location",
  "occupation",
  "github",
  "wechat",
  "website",
] as const satisfies readonly (keyof Prisma.UserUpdateInput)[];

type PatchBuildResult =
  | { ok: true; data: Prisma.UserUpdateInput }
  | { ok: false; status: number; message: string };

function buildUserUpdatePayload(data: Record<string, unknown>): PatchBuildResult {
  const patch: Prisma.UserUpdateInput = {};

  for (const key of USER_PATCH_SCALARS) {
    if (!(key in data)) continue;
    const v = data[key];
    if (v === null) {
      (patch as Record<string, null>)[key] = null;
    } else if (typeof v === "string") {
      (patch as Record<string, string>)[key] = v;
    }
  }

  if ("profileWidgets" in data) {
    const pw = data.profileWidgets;
    if (!Array.isArray(pw)) {
      return {
        ok: false,
        status: 400,
        message: "profileWidgets must be an array",
      };
    }
    const cleaned = [
      ...new Set(
        pw.filter(
          (k): k is string => typeof k === "string" && isKnownWidgetKey(k)
        )
      ),
    ];
    patch.profileWidgets = cleaned;
  }

  if ("zenQuoteText" in data) {
    const v = data.zenQuoteText;
    if (v !== null && typeof v !== "string") {
      return {
        ok: false,
        status: 400,
        message: "zenQuoteText must be string or null",
      };
    }
    if (typeof v === "string") {
      patch.zenQuoteText = v.slice(0, ZEN_QUOTE_MAX_LEN);
    } else {
      patch.zenQuoteText = null;
    }
  }

  if ("moodCalendarData" in data) {
    const v = data.moodCalendarData;
    if (v === null) {
      (patch as { moodCalendarData?: Prisma.InputJsonValue }).moodCalendarData = {};
    } else {
      const cleaned = sanitizeMoodCalendarPayload(v);
      if (cleaned === null) {
        return {
          ok: false,
          status: 400,
          message: "moodCalendarData 格式无效",
        };
      }
      (patch as { moodCalendarData?: Prisma.InputJsonValue }).moodCalendarData =
        cleaned as Prisma.InputJsonValue;
    }
  }

  if (Object.keys(patch).length === 0) {
    return {
      ok: false,
      status: 400,
      message: "No valid fields to update",
    };
  }
  return { ok: true, data: patch };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to get user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id || session.user.id !== id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return NextResponse.json({ error: "Expected a JSON object" }, { status: 400 });
    }

    const data = raw as Record<string, unknown>;
    const built = buildUserUpdatePayload(data);

    if (!built.ok) {
      return NextResponse.json({ error: built.message }, { status: built.status });
    }

    const patchPlain = JSON.parse(
      JSON.stringify(built.data)
    ) as Record<string, unknown>;
    const { rest, widgets } = extractWidgetPatchFromUserUpdate(patchPlain);
    await applyUserWidgetSqlUpdates(id, widgets);

    let user;
    if (Object.keys(rest).length > 0) {
      user = await prisma.user.update({
        where: { id },
        data: rest as Prisma.UserUpdateInput,
        include: {
          posts: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id },
        include: {
          posts: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
