import { NextResponse } from "next/server";

/** 官方文档常见两个入口；本机若无法解析其一，可在 .env 设置 MIMO_API_BASE 指向另一个 */
const DEFAULT_API_BASE = "https://api.xiaomimimo.com/v1";
const FALLBACK_API_BASE = "https://api.mimo-v2.com/v1";
const DEFAULT_MODEL = "mimo-v2-pro";
const MAX_QUESTION = 4000;

function chatCompletionsUrl(base: string): string {
  const b = base.replace(/\/$/, "");
  return `${b}/chat/completions`;
}

type MimoOpenAIResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

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

  const question =
    typeof body === "object" &&
    body !== null &&
    "question" in body &&
    typeof (body as { question: unknown }).question === "string"
      ? (body as { question: string }).question.trim()
      : "";

  if (!question) {
    return NextResponse.json({ error: "请输入问题" }, { status: 400 });
  }
  if (question.length > MAX_QUESTION) {
    return NextResponse.json(
      { error: `问题过长（最多 ${MAX_QUESTION} 字）` },
      { status: 400 },
    );
  }

  const model =
    process.env.MIMO_MODEL?.trim() || DEFAULT_MODEL;

  const configuredBase = process.env.MIMO_API_BASE?.trim();
  const bases = configuredBase
    ? [configuredBase]
    : [DEFAULT_API_BASE, FALLBACK_API_BASE];

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
            {
              role: "system",
              content:
                "你是个人博客页面右下角的「戴厨师帽的猫咪」虚拟宠物。用简短、可爱、口语化的中文回答访客问题，可适当用「喵」或颜文字；不要自称大模型，不要输出 Markdown 标题层级，回答控制在合理长度内。",
            },
            { role: "user", content: question },
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
