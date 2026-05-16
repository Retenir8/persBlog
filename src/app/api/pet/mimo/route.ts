import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canViewPost, getPostById } from "@/lib/services/postService";
import { stripHtmlToPlainText } from "@/lib/stripHtmlToPlainText";

/** 官方文档常见两个入口；本机若无法解析其一，可在 .env 设置 MIMO_API_BASE 指向另一个 */
const DEFAULT_API_BASE = "https://api.xiaomimimo.com/v1";
const FALLBACK_API_BASE = "https://api.mimo-v2.com/v1";
const DEFAULT_MODEL = "mimo-v2-pro";
const MAX_QUESTION = 4000;
const MAX_ARTICLE_BODY = 9000;

function chatCompletionsUrl(base: string): string {
  const b = base.replace(/\/$/, "");
  return `${b}/chat/completions`;
}

type MimoOpenAIResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

async function callMimo(
  apiKey: string,
  model: string,
  bases: string[],
  systemContent: string,
  userContent: string,
): Promise<NextResponse> {
  let upstream: Response | null = null;
  let lastFetchError: string | null = null;

  for (const base of bases) {
    const url = chatCompletionsUrl(base);
    try {
      upstream = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemContent },
            { role: "user", content: userContent },
          ],
          max_completion_tokens: 1024,
          temperature: 0.85,
          top_p: 0.95,
          stream: false,
        }),
      });
      break;
    } catch (e) {
      lastFetchError = e instanceof Error ? e.message : String(e);
      upstream = null;
    }
  }

  if (!upstream) {
    return NextResponse.json(
      {
        error: `无法连接 MiMo 接口（${lastFetchError ?? "unknown"}）。请在 .env 中设置 MIMO_API_BASE 为可访问的地址，例如 ${DEFAULT_API_BASE} 或 ${FALLBACK_API_BASE}，并检查网络/DNS。`,
      },
      { status: 502 },
    );
  }

  let raw: MimoOpenAIResponse;
  try {
    raw = (await upstream.json()) as MimoOpenAIResponse;
  } catch {
    return NextResponse.json(
      { error: `MiMo 返回非 JSON（HTTP ${upstream.status}）` },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const msg =
      typeof raw.error?.message === "string"
        ? raw.error.message
        : `MiMo 请求失败（${upstream.status}）`;
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const text = raw.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) {
    return NextResponse.json(
      { error: "模型未返回有效内容，请稍后重试。" },
      { status: 502 },
    );
  }

  return NextResponse.json({ answer: text });
}

const SYSTEM_PET_QA =
  "你是个人博客页面右下角的「戴厨师帽的猫咪」虚拟宠物。用简短、可爱、口语化的中文回答访客问题，可适当用「喵」或颜文字；不要自称大模型，不要输出 Markdown 标题层级，回答控制在合理长度内。";

const SYSTEM_PET_ARTICLE =
  "你是个人博客页面右下角的「戴厨师帽的猫咪」虚拟宠物。用户会粘贴一篇博客的标题与正文（纯文本，可能截断）。请用简短、可爱、口语化的中文分享读后感：可概括中心、表达共鸣或温和补充看法；不要人身攻击，不要编造文中没有的细节；不要自称大模型，不要输出 Markdown 标题层级；若正文过短或缺失请如实说明。";

export async function POST(req: Request) {
  const apiKey = process.env.MIMO_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "服务器未配置 MIMO_API_KEY，无法调用小米 MiMo。" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  const obj =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  const question =
    typeof obj.question === "string" ? obj.question.trim() : "";
  const postId = typeof obj.postId === "string" ? obj.postId.trim() : "";

  if (postId && question) {
    return NextResponse.json(
      { error: "请勿同时提交 postId 与 question" },
      { status: 400 },
    );
  }

  const model = process.env.MIMO_MODEL?.trim() || DEFAULT_MODEL;
  const configuredBase = process.env.MIMO_API_BASE?.trim();
  const bases = configuredBase
    ? [configuredBase]
    : [DEFAULT_API_BASE, FALLBACK_API_BASE];

  let userContent: string;
  let systemContent: string;

  if (postId) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录后再使用此功能。" }, { status: 401 });
    }

    const post = await getPostById(postId);
    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const viewOk = await canViewPost(
      post,
      session.user.id,
      session.user.role,
    );
    if (!viewOk) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    let plain = stripHtmlToPlainText(post.content);
    let truncatedNote = "";
    if (plain.length > MAX_ARTICLE_BODY) {
      plain = plain.slice(0, MAX_ARTICLE_BODY);
      truncatedNote = "\n\n（正文过长，后半部分已省略）";
    }

    userContent = [
      "下面是访客正在阅读的一篇博客（HTML 已转为纯文本）。请按系统设定分享读后感。",
      "",
      `【标题】${post.title}`,
      `【作者】${post.author.name || "作者"}`,
      "【正文】",
      plain + truncatedNote,
    ].join("\n");

    systemContent = SYSTEM_PET_ARTICLE;
  } else {
    if (!question) {
      return NextResponse.json({ error: "请输入问题或指定 postId" }, { status: 400 });
    }
    if (question.length > MAX_QUESTION) {
      return NextResponse.json(
        { error: `问题过长（最多 ${MAX_QUESTION} 字）` },
        { status: 400 },
      );
    }
    userContent = question;
    systemContent = SYSTEM_PET_QA;
  }

  return callMimo(apiKey, model, bases, systemContent, userContent);
}
