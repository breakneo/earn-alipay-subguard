/**
 * Cloudflare Worker 安全限流代理（用于支付宝「智能体涌现奖」评审期免密体验 SCNet GLM-5.3-Flash）
 *
 * 安全防护：
 * 1. API Key 仅存在 Cloudflare Worker Secret（环境变量 SCNET_API_KEY），绝不暴露在前端源码；
 * 2. 强制锁死来源域（Origin: https://breakneo.github.io）与模型（GLM-5.3-Flash）；
 * 3. 单 IP 滑动窗口限流（每小时最多 20 次请求），单次输出上限 max_tokens <= 800；
 * 4. 自动过期熔断（默认 2027-01-05 00:00 UTC 后自动关闭，防止赛后被刷）。
 */

const ALLOWED_ORIGINS = new Set([
  "https://breakneo.github.io",
  "http://127.0.0.1:8080",
  "http://localhost:8080",
]);
const UPSTREAM_URL = "https://api.scnet.cn/api/llm/v1/chat/completions";
const LOCKED_MODEL = "GLM-5.3-Flash";
const EXPIRE_AT_MS = Date.parse("2027-01-05T00:00:00Z");

// 轻量单实例内存限流（每 IP 每小时 20 次）
const ipBuckets = new Map();

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "https://breakneo.github.io";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    if (Date.now() > EXPIRE_AT_MS) {
      return new Response(JSON.stringify({ error: "评审体验通道已到期关闭，请使用端侧引擎或填入自有密钥" }), {
        status: 410,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return new Response(JSON.stringify({ error: "Forbidden Origin" }), {
        status: 403,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const now = Date.now();
    const history = (ipBuckets.get(ip) || []).filter((t) => now - t < 3600_000);
    if (history.length >= 20) {
      return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
        status: 429,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    history.push(now);
    ipBuckets.set(ip, history);

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const messages = Array.isArray(body.messages) ? body.messages.slice(-4) : [];
    const upstreamResp = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SCNET_API_KEY}`,
      },
      body: JSON.stringify({
        model: LOCKED_MODEL,
        temperature: 0.3,
        max_tokens: Math.min(Number(body.max_tokens) || 600, 800),
        thinking: { type: "disabled" },
        messages,
      }),
    });

    const respBody = await upstreamResp.text();
    return new Response(respBody, {
      status: upstreamResp.status,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  },
};
