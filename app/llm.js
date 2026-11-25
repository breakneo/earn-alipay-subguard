/**
 * 订阅刺客体检仪 · 大模型语义增强适配层
 * 双引擎策略：端侧规则引擎负责确定性金额计算（0 幻觉、离线秒算），
 * 真实大模型负责非结构化促销条款拆解与复杂口语消费决策分析。
 * 所有密钥仅存浏览器本地，不经过作者服务器。
 */

export const LLM_PROVIDERS = {
  qwen: {
    id: "qwen",
    name: "通义千问（阿里云百炼）",
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    model: "qwen-plus",
    note: "国内直连稳定，适合解析中文活动条款与消费建议",
  },
  deepseek: {
    id: "deepseek",
    name: "深度求索（DeepSeek）",
    endpoint: "https://api.deepseek.com/chat/completions",
    model: "deepseek-chat",
    note: "性价比高，中文条款推理清晰",
  },
  doubao: {
    id: "doubao",
    name: "豆包大模型（火山方舟）",
    endpoint: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    model: "doubao-1-5-pro-32k-250115",
    note: "需填写对应推理接入点或模型名称",
  },
  custom: {
    id: "custom",
    name: "自定义兼容接口 / 评审体验代理",
    endpoint: "",
    model: "qwen-plus",
    note: "支持填写限流公益代理地址或任意兼容对话接口",
  },
};

/** 预留评审期免密公益代理地址（部署限流代理后填入即可让评委零配置直享真大模型） */
export const DEFAULT_REVIEW_PROXY_ENDPOINT = "";

const STORAGE_KEY = "subguard_llm_config_v1";

export function loadLlmConfig() {
  const fallback = {
    enabled: Boolean(DEFAULT_REVIEW_PROXY_ENDPOINT),
    provider: DEFAULT_REVIEW_PROXY_ENDPOINT ? "custom" : "qwen",
    endpoint: DEFAULT_REVIEW_PROXY_ENDPOINT || LLM_PROVIDERS.qwen.endpoint,
    model: LLM_PROVIDERS.qwen.model,
    apiKey: "",
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

export function saveLlmConfig(cfg) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {}
}

export function clearLlmConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function isLlmActive(cfg) {
  if (!cfg || !cfg.enabled) return false;
  if (!cfg.endpoint) return false;
  // 若指向限流代理，可免填前端密钥；直连模型厂商接口时需密钥
  const isOfficialDirect = /dashscope\.aliyuncs\.com|api\.deepseek\.com|volces\.com|api\.openai\.com/.test(cfg.endpoint);
  if (isOfficialDirect && !cfg.apiKey?.trim()) return false;
  return true;
}

/**
 * 调用真实大模型（兼容标准对话补全协议），超时自动中止并由上层无感回退至端侧引擎
 */
async function callChatCompletion(cfg, systemPrompt, userPrompt, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers = { "Content-Type": "application/json" };
    if (cfg.apiKey?.trim()) {
      headers.Authorization = `Bearer ${cfg.apiKey.trim()}`;
    }
    const resp = await fetch(cfg.endpoint, {
      method: "POST",
      headers,
      signal: ctrl.signal,
      body: JSON.stringify({
        model: cfg.model || "qwen-plus",
        temperature: 0.3,
        max_tokens: 550,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`接口返回状态 ${resp.status}${errText ? `：${errText.slice(0, 80)}` : ""}`);
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("模型未返回有效文本内容");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 使用真实大模型对用户复杂口语、在途账单与端侧精算结果进行深度消费建议生成
 */
export async function enhanceAbaoChatWithLLM(cfg, userMessage, auditSummary, localResult) {
  const systemPrompt = [
    "你是支付宝生态的「阿宝 · 订阅刺客体检助手」，面向中国普通家庭和上班族提供务实、接地气的中文建议。",
    "要求：",
    "1. 全程使用简洁清晰的中文，不堆砌英文术语；",
    "2. 严格基于提供的本地账单统计数字作答，绝不编造金额；",
    "3. 涉及退费或法规时明确提示“仅供参考，不构成法律意见”；",
    "4. 给出 3 条以内具体可执行的止血或避坑动作，字数控制在 220 字以内。",
  ].join("\n");

  const userPrompt = [
    `用户提问：${userMessage}`,
    `本地账单体检汇总：共 ${auditSummary.stats.count} 项周期扣款，年总支出 ¥${auditSummary.stats.totalYearly}，红灯高危 ${auditSummary.stats.redCount} 项，预计年度可立省 ¥${auditSummary.stats.potentialSaveYearly}。`,
    `红灯高危项：${auditSummary.items.filter((x) => x.level === "red").map((x) => `${x.merchant}(¥${x.amount}/${x.cycle})`).join("、") || "无"}`,
    `端侧规则引擎初步判断：${localResult.reply.replace(/\*\*/g, "")}`,
    "请结合用户提问给出更贴合生活场景的中文解读与行动建议：",
  ].join("\n");

  return callChatCompletion(cfg, systemPrompt, userPrompt);
}

/**
 * 使用真实大模型拆解冗长、含文字游戏的会员促销小字条款，提取结构化收费要素
 */
export async function extractOfferWithLLM(cfg, promoText) {
  const systemPrompt = [
    "你是中文会员促销条款扫雷助手。请从用户粘贴的杂乱活动文案中提取收费陷阱，严格输出一个 JSON 对象，不要输出其他任何文字：",
    '{"serviceName":"服务名称","firstPrice":数字,"renewPrice":数字,"cycle":"monthly|quarterly|yearly","hiddenTrap":"一句话指出最隐蔽的扣费或取消陷阱"}',
  ].join("\n");

  const raw = await callChatCompletion(cfg, systemPrompt, `促销文案如下：\n${promoText}`);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("模型未返回标准结构化结果");
  return JSON.parse(match[0]);
}

export async function testLlmConnection(cfg) {
  const reply = await callChatCompletion(
    cfg,
    "你是连通性测试助手，请只回复六个字：大模型连接正常",
    "测试连接",
    10000
  );
  return reply;
}
