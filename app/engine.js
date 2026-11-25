/**
 * 订阅刺客体检仪 · 核心分析引擎 (Alipay Abao × SubGuard Skill)
 * 纯前端离线 ES Module：支持浏览器直跑与 Node.js 单元测试，零隐私上传。
 */

export const USD_TO_CNY = 7.25;

/** 常见高频订阅商户与免密扣款知识库（30+ 真实国民与开发者服务） */
export const MERCHANT_CATALOG = [
  { key: "爱奇艺", aliases: ["爱奇艺", "iqiyi"], category: "影音娱乐", typicalMonthly: 25, channel: "支付宝", alt: "仅追剧当月买单月卡，或切换家庭共享" },
  { key: "腾讯视频", aliases: ["腾讯视频", "腾迅视频", "wetv"], category: "影音娱乐", typicalMonthly: 25, channel: "微信", alt: "与爱奇艺/优酷错峰轮流开，避免三家同时续费" },
  { key: "优酷视频", aliases: ["优酷", "youku", "酷喵"], category: "影音娱乐", typicalMonthly: 25, channel: "支付宝", alt: "88VIP 含基础权益时切勿重复单独续费" },
  { key: "芒果TV", aliases: ["芒果", "mangotv"], category: "影音娱乐", typicalMonthly: 22, channel: "支付宝", alt: "综艺季单月购买，完结即关免密" },
  { key: "哔哩哔哩大会员", aliases: ["哔哩哔哩", "b站", "bilibili"], category: "影音娱乐", typicalMonthly: 15, channel: "支付宝", alt: "大促年卡折合约 ¥8/月，避免原价自动连包" },
  { key: "网易云音乐", aliases: ["网易云", "黑胶vip"], category: "音乐听书", typicalMonthly: 15, channel: "支付宝", alt: "88VIP 赠送权益用户请立刻关闭单独连包" },
  { key: "QQ音乐", aliases: ["qq音乐", "绿钻"], category: "音乐听书", typicalMonthly: 15, channel: "微信", alt: "避免与网易云音乐双重付费" },
  { key: "喜马拉雅", aliases: ["喜马拉雅", "ximalaya"], category: "音乐听书", typicalMonthly: 25, channel: "支付宝", alt: "长辈高频误触高发商户，核实是否真听书" },
  { key: "百度网盘", aliases: ["百度网盘", "度盘"], category: "云盘办公", typicalMonthly: 25, channel: "支付宝", alt: "低频下载改用闲时单日加速券，立省 80%" },
  { key: "夸克网盘", aliases: ["夸克", "quark"], category: "云盘办公", typicalMonthly: 19, channel: "支付宝", alt: "88VIP 可免费领年卡，避免额外连包" },
  { key: "WPS超级会员", aliases: ["wps", "金山办公"], category: "云盘办公", typicalMonthly: 20, channel: "支付宝", alt: "常规排版免费版足够，PDF转换可用离线开源工具" },
  { key: "扫描全能王", aliases: ["扫描全能王", "camscanner"], category: "云盘办公", typicalMonthly: 30, channel: "Apple iOS", alt: "iOS 备忘录/支付宝扫一扫文档免费替代" },
  { key: "iCloud+", aliases: ["icloud", "apple.com/bill"], category: "云盘办公", typicalMonthly: 21, channel: "Apple iOS", alt: "定期导出冷照片至本地硬盘，可从 200GB 降至 50GB" },
  { key: "美团神会员/省钱包", aliases: ["美团", "神会员", "外卖会员"], category: "生活外卖", typicalMonthly: 15, channel: "支付宝", alt: "每月点外卖少于 4 单则反亏，建议关闭连包" },
  { key: "饿了么吃货卡", aliases: ["饿了么", "淘宝闪购"], category: "生活外卖", typicalMonthly: 15, channel: "支付宝", alt: "避免与美团外卖会员双重自动续费" },
  { key: "高德打车省钱卡", aliases: ["高德", "打车卡", "滴滴省钱"], category: "出行工具", typicalMonthly: 19, channel: "支付宝", alt: "仅当月高频打车时按需购买" },
  { key: "Keep会员", aliases: ["keep"], category: "运动健康", typicalMonthly: 19, channel: "Apple iOS", alt: "30 天未打卡即属沉睡刺客，建议关闭" },
  { key: "小红书/知乎盐选", aliases: ["知乎", "盐选"], category: "阅读知识", typicalMonthly: 19, channel: "支付宝", alt: "经典首月低价次月涨价场景，看完单篇故事即关" },
  { key: "番茄/七猫小说会员", aliases: ["番茄小说", "七猫", "起点"], category: "阅读知识", typicalMonthly: 18, channel: "支付宝", alt: "长辈误触高发项，免费看广告模式即可替代" },
  { key: "轻颜/醒图/美图VIP", aliases: ["醒图", "美图", "轻颜", "剪映"], category: "修图剪辑", typicalMonthly: 28, channel: "Apple iOS", alt: "常含 7 天免费试用后自动扣年费 ¥168–¥298 陷阱" },
  { key: "各类手机清理/WiFi大师", aliases: ["清理大师", "天气vip", "wifi", "万能钥匙", "健康管家", "极速省电"], category: "长辈误触高危", typicalMonthly: 29, channel: "支付宝", alt: "系统自带安全清理即可，强烈建议立刻关闭免密并追回" },
  { key: "Google AI Ultra", aliases: ["google ai ultra", "google one ai ultra"], category: "AI 订阅", typicalMonthly: 1812, channel: "外币卡/Google Play", alt: "若未重度消耗 Veo/超高配额，降级 Pro ($19.99) 月省 ¥1,667" },
  { key: "ChatGPT Plus", aliases: ["chatgpt", "openai"], category: "AI 订阅", typicalMonthly: 145, channel: "外币卡/Apple", alt: "多款 AI 会员重叠时保留主力 1 个，其余改按量 API" },
  { key: "Claude Pro", aliases: ["claude", "anthropic"], category: "AI 订阅", typicalMonthly: 145, channel: "外币卡/Apple", alt: "按量 API 或与主力模型错峰订阅" },
  { key: "Cursor Pro", aliases: ["cursor"], category: "AI 订阅", typicalMonthly: 145, channel: "外币卡", alt: "低频编码期暂停订阅，避免静默续费" },
];

/** 支付宝/微信/苹果关闭免密支付精确路径 */
export const CANCEL_GUIDES = {
  支付宝: {
    channel: "支付宝免密支付 / 自动扣款",
    abaoShortcut: "在支付宝唤起「阿宝」直接说：“打开我的免密支付管理”",
    steps: [
      "打开支付宝 App → 点击右下角「我的」",
      "点击右上角「设置」齿轮 → 进入「支付设置」",
      "点击「自动扣款」（或「免密支付/自动扣款」）",
      "找到对应商户 → 点击进入 → 点击底部「关闭服务」确认解约",
    ],
  },
  微信: {
    channel: "微信支付分 / 扣费服务",
    abaoShortcut: "可先用阿宝记下到期日，再前往微信支付解约",
    steps: [
      "打开微信 → 点击「我」→「服务」→「钱包」",
      "点击最底部「支付设置」→「自动续费 / 扣费服务」",
      "点选对应商户 → 点击「关闭扣费服务」确认",
    ],
  },
  "Apple iOS": {
    channel: "Apple ID 订阅管理",
    abaoShortcut: "苹果渠道扣款需在 iOS 设置中退订，并可在 reportaproblem.apple.com 申请退款",
    steps: [
      "打开 iPhone「设置」→ 点击顶部你的「Apple ID 头像」",
      "点击「订阅」→ 在「订阅中」找到对应 App",
      "点击底部红色「取消订阅」确认（已误扣可去 Apple 官网报告问题退款）",
    ],
  },
  其他: {
    channel: "银行卡 / 外币卡周期扣款",
    abaoShortcut: "前往原服务商 Billing 页面关闭 Auto-renew，或在发卡行 App 关闭境外无卡免密",
    steps: [
      "登录该服务官网「Account / Billing / Subscription」页面",
      "点击「Cancel plan / Turn off auto-renew」并截图留存",
      "如系外币虚拟卡，可在卡商后台暂停该商户扣款或调低单笔限额",
    ],
  },
};

/** 3 套真实脱敏人生账单沙盒（模拟“阿宝一键授权同步近 90 天支付宝账单”） */
export const PERSONA_PRESETS = {
  worker: {
    id: "worker",
    label: "都市打工人（90天账单）",
    tag: "多平台重叠 + 首月1元涨价",
    syncSource: "阿宝账单授权沙盒 · 近90天周期扣款（脱敏样例）",
    items: [
      { id: "w1", merchant: "爱奇艺连续包月", category: "影音娱乐", channel: "支付宝", amount: 25, prevAmount: 1, cycle: "monthly", lastDate: "2026-11-23", usedDays30: 2, orderNo: "20261123220014882101", note: "首月¥1体验后自动涨至¥25" },
      { id: "w2", merchant: "腾讯视频超级影视VIP", category: "影音娱乐", channel: "微信", amount: 30, prevAmount: 30, cycle: "monthly", lastDate: "2026-11-18", usedDays30: 14, orderNo: "42000024912026111809", note: "日常追剧主力" },
      { id: "w3", merchant: "优酷视频连续包月", category: "影音娱乐", channel: "支付宝", amount: 25, prevAmount: 9, cycle: "monthly", lastDate: "2026-11-21", usedDays30: 0, orderNo: "20261121220014773910", note: "已有88VIP却未关旧连包，近30天未使用" },
      { id: "w4", merchant: "百度网盘超级会员", category: "云盘办公", channel: "支付宝", amount: 25, prevAmount: 25, cycle: "monthly", lastDate: "2026-11-12", usedDays30: 1, orderNo: "20261112220014510293", note: "仅下载过1个压缩包，且已开夸克网盘" },
      { id: "w5", merchant: "夸克网盘SVIP", category: "云盘办公", channel: "支付宝", amount: 19, prevAmount: 19, cycle: "monthly", lastDate: "2026-11-15", usedDays30: 18, orderNo: "20261115220014602811", note: "高频主力网盘" },
      { id: "w6", merchant: "知乎盐选连续包月", category: "阅读知识", channel: "支付宝", amount: 19, prevAmount: 1, cycle: "monthly", lastDate: "2026-11-24", usedDays30: 0, orderNo: "20261124220014992014", note: "昨晚静默自动续费，开通后未阅读" },
      { id: "w7", merchant: "醒图VIP连续包年", category: "修图剪辑", channel: "Apple iOS", amount: 168, prevAmount: 0.01, cycle: "yearly", lastDate: "2026-11-22", usedDays30: 0, orderNo: "MK9X2L8812", note: "7天0.01元试用忘关，直接扣年费¥168" },
      { id: "w8", merchant: "美团神会员省钱包", category: "生活外卖", channel: "支付宝", amount: 15, prevAmount: 15, cycle: "monthly", lastDate: "2026-11-10", usedDays30: 12, orderNo: "20261110220014331029", note: "高频外卖刚需" },
    ],
  },
  elder: {
    id: "elder",
    label: "银发长辈（防误触体检）",
    tag: "误点广告免密 + 静默扣费高发",
    syncSource: "阿宝家庭守护沙盒 · 长辈账单（脱敏样例）",
    items: [
      { id: "e1", merchant: "极速手机清理大师VIP", category: "长辈误触高危", channel: "支付宝", amount: 29.9, prevAmount: 0.1, cycle: "monthly", lastDate: "2026-11-24", usedDays30: 0, orderNo: "20261124220019118201", note: "弹窗诱导0.1元开通，次月连扣29.9元" },
      { id: "e2", merchant: "每日健康天气VIP", category: "长辈误触高危", channel: "支付宝", amount: 28, prevAmount: 1, cycle: "monthly", lastDate: "2026-11-22", usedDays30: 0, orderNo: "20261122220018873120", note: "疑似看天气广告误触免密" },
      { id: "e3", merchant: "番茄小说畅听连续包月", category: "阅读知识", channel: "支付宝", amount: 18, prevAmount: 1, cycle: "monthly", lastDate: "2026-11-19", usedDays30: 1, orderNo: "20261119220018442019", note: "免费看广告即可，无需包月" },
      { id: "e4", merchant: "喜马拉雅巅峰会员", category: "音乐听书", channel: "支付宝", amount: 25, prevAmount: 25, cycle: "monthly", lastDate: "2026-11-15", usedDays30: 22, orderNo: "20261115220018221004", note: "长辈每天听评书，真实高频刚需" },
      { id: "e5", merchant: "扫描全能王高级版", category: "云盘办公", channel: "Apple iOS", amount: 30, prevAmount: 0, cycle: "monthly", lastDate: "2026-11-23", usedDays30: 0, orderNo: "AP77219033", note: "帮孙子拍过一次作业忘关试用" },
    ],
  },
  developer: {
    id: "developer",
    label: "AI 开发者（美元+人民币）",
    tag: "高额美元AI订阅重叠",
    syncSource: "阿宝多币种账单 + 开发者自查沙盒",
    items: [
      { id: "d1", merchant: "Google AI Ultra", category: "AI 订阅", channel: "其他", amount: 1812, prevAmount: 1812, cycle: "monthly", lastDate: "2026-11-01", usedDays30: 20, orderNo: "GGL-20261101-8812", note: "$249.99/月高额订阅，可评估降级Pro($19.99)" },
      { id: "d2", merchant: "ChatGPT Plus", category: "AI 订阅", channel: "其他", amount: 145, prevAmount: 145, cycle: "monthly", lastDate: "2026-11-14", usedDays30: 4, orderNo: "OAI-20261114-3310", note: "$20/月，与主力AI高度重叠" },
      { id: "d3", merchant: "Claude Pro", category: "AI 订阅", channel: "其他", amount: 145, prevAmount: 145, cycle: "monthly", lastDate: "2026-11-17", usedDays30: 3, orderNo: "ANT-20261117-5521", note: "$20/月，低频重叠" },
      { id: "d4", merchant: "iCloud+ 200GB", category: "云盘办公", channel: "Apple iOS", amount: 21, prevAmount: 21, cycle: "monthly", lastDate: "2026-11-08", usedDays30: 30, orderNo: "APL-20261108-1002", note: "日常设备同步刚需" },
      { id: "d5", merchant: "WPS超级会员", category: "云盘办公", channel: "支付宝", amount: 20, prevAmount: 9, cycle: "monthly", lastDate: "2026-11-23", usedDays30: 0, orderNo: "20261123220015009123", note: "次月涨价且开发者几乎只用Markdown" },
    ],
  },
};

/** 匹配商户知识库元数据 */
export function matchMerchantMeta(name) {
  const lower = String(name || "").toLowerCase();
  for (const m of MERCHANT_CATALOG) {
    if (m.aliases.some((a) => lower.includes(a.toLowerCase()))) {
      return m;
    }
  }
  return {
    key: name || "未知商户",
    category: "其他自动续费",
    typicalMonthly: 20,
    channel: "支付宝",
    alt: "核实近30天是否使用，若非刚需请立刻关闭自动扣款",
  };
}

/** 将周期金额折算为月均人民币 */
export function toMonthlyCNY(amount, cycle = "monthly") {
  const n = Number(amount) || 0;
  if (cycle === "yearly") return +(n / 12).toFixed(2);
  if (cycle === "quarterly") return +(n / 3).toFixed(2);
  if (cycle === "weekly") return +(n * 4.33).toFixed(2);
  return +n.toFixed(2);
}

/**
 * 纯本地解析支付宝/微信 CSV 账单或粘贴的扣费短信明细
 * 支持识别 ¥/元 与 $/USD 币种、自动归类渠道与商户。
 */
export function parseBillText(rawText, fxRate = USD_TO_CNY) {
  if (!rawText || !rawText.trim()) return [];
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const parsed = [];
  let seq = 1;

  for (const line of lines) {
    // 跳过常见 CSV 表头或注释行
    if (/^(交易时间|交易号|交易分类|---|===|支付宝交易记录)/.test(line)) continue;

    // 1. 尝试识别 CSV 行（至少 4 列，含金额与商户）
    const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    if (cols.length >= 5) {
      const dateCol = cols.find((c) => /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(c)) || "2026-11-24";
      const amountCol = cols.find((c) => /^-?[¥￥$]?\d+(?:\.\d{1,2})?$/.test(c.replace(/\s+/g, "")));
      if (amountCol) {
        const isUsd = amountCol.includes("$");
        const rawVal = Math.abs(parseFloat(amountCol.replace(/[^0-9.]/g, "")));
        if (rawVal > 0) {
          const amount = +(isUsd ? rawVal * fxRate : rawVal).toFixed(2);
          // 寻找最像商户名的文本列
          const merchant =
            cols.find(
              (c) =>
                c &&
                c !== dateCol &&
                c !== amountCol &&
                !/^(支出|收入|不计收支|交易成功|已付款|支付宝|微信|\d{12,})$/.test(c) &&
                c.length >= 2
            ) || "账单自动扣款商户";
          const meta = matchMerchantMeta(merchant);
          const cycle = /年费|包年|yearly|annual/i.test(line) ? "yearly" : /季|quarter/i.test(line) ? "quarterly" : "monthly";
          const channel = /微信/.test(line) ? "微信" : /apple|icloud/i.test(line) ? "Apple iOS" : isUsd ? "其他" : meta.channel;
          parsed.push({
            id: `p${seq++}`,
            merchant,
            category: meta.category,
            channel,
            amount,
            prevAmount: amount,
            cycle,
            lastDate: dateCol.slice(0, 10).replace(/\//g, "-"),
            usedDays30: /未使用|误扣|静默|免密/.test(line) ? 0 : 3,
            orderNo: cols.find((c) => /^\d{14,}$/.test(c)) || `LOCAL-${seq}`,
            note: isUsd ? `外币 $${rawVal} 按汇率 ${fxRate} 折算` : "来自本地 CSV 账单离线解析",
          });
          continue;
        }
      }
    }

    // 2. 识别自然语言短信/扣费通知行（如：【支付宝】您已通过自动扣款向爱奇艺支付25.00元；或 ChatGPT Plus $20/月）
    const usdMatch = line.match(/(?:\$|USD\s*)(\d+(?:\.\d{1,2})?)/i);
    const cnyMatch = line.match(/(?:[¥￥]\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*元)/);
    let amount = 0;
    let isUsd = false;
    if (usdMatch) {
      amount = +(parseFloat(usdMatch[1]) * fxRate).toFixed(2);
      isUsd = true;
    } else if (cnyMatch) {
      amount = +(parseFloat(cnyMatch[1] || cnyMatch[2])).toFixed(2);
    }
    if (amount <= 0) continue;

    // 检查是否提及首月低价（如 首月1元）
    const prevMatch = line.match(/首月[^\d]{0,4}(\d+(?:\.\d{1,2})?)/);
    const prevAmount = prevMatch ? parseFloat(prevMatch[1]) : amount;

    // 匹配已知商户或提取关键词
    let merchant = "";
    const lower = line.toLowerCase();
    for (const m of MERCHANT_CATALOG) {
      if (m.aliases.some((a) => lower.includes(a.toLowerCase()))) {
        merchant = m.key;
        break;
      }
    }
    if (!merchant) {
      const mExtract = line.match(/(?:向|商户[:：]?|【)([^，,。；;】\s]{2,16})/);
      merchant = mExtract ? mExtract[1].replace(/支付宝|微信支付/, "").trim() || "未知免密商户" : line.slice(0, 14);
    }
    const meta = matchMerchantMeta(merchant);
    const cycle = /年费|包年|\/年|yearly|annual/i.test(line) ? "yearly" : /季|\/季/i.test(line) ? "quarterly" : "monthly";
    const channel = /微信/.test(line) ? "微信" : /apple|苹果|ios|icloud/i.test(line) ? "Apple iOS" : isUsd ? "其他" : "支付宝";
    const dateMatch = line.match(/\d{4}[-/年]\d{1,2}[-/月]\d{1,2}/);
    const lastDate = dateMatch
      ? dateMatch[0].replace(/[年月/]/g, "-").replace(/日$/, "")
      : "2026-11-24";

    parsed.push({
      id: `s${seq++}`,
      merchant,
      category: meta.category,
      channel,
      amount,
      prevAmount,
      cycle,
      lastDate,
      usedDays30: /未使用|误扣|忘关|静默|不知情/.test(line) ? 0 : 2,
      orderNo: `SMS-${Date.now().toString().slice(-6)}-${seq}`,
      note: isUsd ? `短信美元 $${usdMatch[1]} 自动折算人民币` : "来自本地扣费短信离线解析",
    });
  }

  return parsed;
}

/**
 * 核心事中体检引擎：识别阶梯涨价刺客、同类重复订阅、长辈误触与沉睡扣费
 */
export function auditSubscriptions(items) {
  const categoryCount = {};
  for (const it of items) {
    categoryCount[it.category] = (categoryCount[it.category] || 0) + 1;
  }

  const enriched = items.map((it) => {
    const meta = matchMerchantMeta(it.merchant);
    const monthly = toMonthlyCNY(it.amount, it.cycle);
    const yearly = +(monthly * 12).toFixed(2);
    const flags = [];

    const isPriceSpike = it.prevAmount > 0 && it.amount >= it.prevAmount * 2 && it.amount - it.prevAmount >= 8;
    const isTrialTrap = it.prevAmount <= 1 && it.amount >= 15;
    const isElderRisk = it.category === "长辈误触高危";
    const isUnused = (it.usedDays30 ?? 5) === 0;
    const isLowUse = (it.usedDays30 ?? 5) <= 3;
    const isOverlap = (categoryCount[it.category] || 0) >= 2 && ["影音娱乐", "云盘办公", "音乐听书", "AI 订阅", "生活外卖"].includes(it.category);
    const isHighTicket = monthly >= 300;

    if (isElderRisk) flags.push("长辈误触高危免密");
    if (isTrialTrap) flags.push(`首月/试用¥${it.prevAmount}→暴涨至¥${it.amount}刺客`);
    else if (isPriceSpike) flags.push(`阶梯涨价 ${(it.amount / it.prevAmount).toFixed(1)} 倍`);
    if (isUnused) flags.push("近30天零使用（沉睡扣费）");
    else if (isLowUse) flags.push(`近30天仅用${it.usedDays30}天（低频）`);
    if (isOverlap) flags.push(`同类「${it.category}」重复订阅`);
    if (isHighTicket) flags.push("高额大单（建议核查降级平替）");

    let level = "green";
    let actionLabel = "健康保留";
    let saveYearly = 0;

    if (isElderRisk || isTrialTrap || isUnused) {
      level = "red";
      actionLabel = "立刻止血 + 申请追回";
      saveYearly = yearly;
    } else if (isOverlap && isLowUse) {
      level = "red";
      actionLabel = "重复低频 · 立刻退订";
      saveYearly = yearly;
    } else if (isHighTicket || isOverlap || isPriceSpike || isLowUse) {
      level = "yellow";
      actionLabel = "建议降级 / 错峰平替";
      saveYearly = +(yearly * 0.65).toFixed(2);
    }

    return {
      ...it,
      monthly,
      yearly,
      level,
      actionLabel,
      saveYearly,
      flags,
      altAdvice: meta.alt,
      cancelGuide: CANCEL_GUIDES[it.channel] || CANCEL_GUIDES["其他"],
    };
  });

  // 按风险严重度（红 > 黄 > 绿）+ 年度金额降序排
  const order = { red: 0, yellow: 1, green: 2 };
  enriched.sort((a, b) => order[a.level] - order[b.level] || b.yearly - a.yearly);

  const totalMonthly = +enriched.reduce((s, x) => s + x.monthly, 0).toFixed(2);
  const totalYearly = +(totalMonthly * 12).toFixed(2);
  const potentialSaveYearly = +enriched.reduce((s, x) => s + x.saveYearly, 0).toFixed(2);
  const threeYearDrain = +(potentialSaveYearly * 3).toFixed(2);

  const byCategoryMap = {};
  for (const x of enriched) {
    byCategoryMap[x.category] = +( (byCategoryMap[x.category] || 0) + x.yearly ).toFixed(2);
  }
  const byCategory = Object.entries(byCategoryMap)
    .map(([category, yearly]) => ({ category, yearly, pct: totalYearly ? Math.round((yearly / totalYearly) * 100) : 0 }))
    .sort((a, b) => b.yearly - a.yearly);

  return {
    items: enriched,
    stats: {
      count: enriched.length,
      redCount: enriched.filter((x) => x.level === "red").length,
      yellowCount: enriched.filter((x) => x.level === "yellow").length,
      greenCount: enriched.filter((x) => x.level === "green").length,
      totalMonthly,
      totalYearly,
      potentialSaveYearly,
      threeYearDrain,
    },
    byCategory,
  };
}

/**
 * 事前拦截引擎：浏览订阅/会员购买页时唤起阿宝进行价格陷阱与重叠度扫雷
 */
export function analyzePrePurchaseOffer(input, existingItems = []) {
  const text = String(input.promoText || "");
  let serviceName = (input.serviceName || "").trim();
  let firstPrice = Number(input.firstPrice);
  let renewPrice = Number(input.renewPrice);
  let cycle = input.cycle || "monthly";

  // 若用户直接粘贴促销文案，自动提取首期价、续费价与周期
  if (text) {
    if (!serviceName) {
      const m = matchMerchantMeta(text);
      serviceName = m.key !== text ? m.key : "待购订阅服务";
    }
    const trialBeforeM = text.match(/(\d+(?:\.\d{1,2})?)\s*元\s*(?:试用|体验|首月|首期)/);
    const trialAfterM = text.match(/(?:首月|首期|仅需|低至|体验价|试用价)[^\d]{0,6}(\d+(?:\.\d{1,2})?)(?!\s*(?:天|日|周|个月))\s*元?/);
    const renewM = text.match(/(?:次月|续费|之后|到期|原价|恢复|自动扣|扣费)[^\d]{0,8}(\d+(?:\.\d{1,2})?)(?!\s*(?:天|日|周|个月))\s*元?/);
    const usdM = text.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
    if (isNaN(firstPrice) || !input.manualOverride) {
      if (trialBeforeM) firstPrice = parseFloat(trialBeforeM[1]);
      else if (trialAfterM) firstPrice = parseFloat(trialAfterM[1]);
      else if (usdM) firstPrice = +(parseFloat(usdM[1]) * USD_TO_CNY).toFixed(2);
    }
    if (isNaN(renewPrice) || !input.manualOverride) {
      if (renewM) renewPrice = parseFloat(renewM[1]);
      else if (usdM) renewPrice = +(parseFloat(usdM[1]) * USD_TO_CNY).toFixed(2);
    }
    if (/包年|\/年|年费/.test(text)) cycle = "yearly";
    else if (/包季|\/季/.test(text)) cycle = "quarterly";
  }

  firstPrice = isNaN(firstPrice) ? 1 : firstPrice;
  renewPrice = isNaN(renewPrice) || renewPrice <= 0 ? Math.max(firstPrice, 25) : renewPrice;

  const meta = matchMerchantMeta(serviceName + " " + text);
  const year1Cost =
    cycle === "yearly"
      ? +(firstPrice < renewPrice && firstPrice <= 5 ? firstPrice + renewPrice : renewPrice).toFixed(2)
      : cycle === "quarterly"
      ? +(firstPrice + renewPrice * 3).toFixed(2)
      : +(firstPrice + renewPrice * 11).toFixed(2);

  const jumpMultiple = firstPrice > 0 ? +(renewPrice / firstPrice).toFixed(1) : 99;
  const overlaps = existingItems.filter(
    (x) => x.category === meta.category && !x.merchant.toLowerCase().includes(serviceName.toLowerCase())
  );

  const warnings = [];
  if (jumpMultiple >= 3) {
    warnings.push(`严重价格诱饵：首期 ¥${firstPrice} 后将暴涨 ${jumpMultiple} 倍至 ¥${renewPrice}/${cycle === "yearly" ? "年" : "月"}，首年真实支出高达 ¥${year1Cost}`);
  }
  if (firstPrice <= 1 && cycle === "yearly") {
    warnings.push(`高危“低价试用转包年”陷阱：试用结束极易一次性静默扣款 ¥${renewPrice}`);
  }
  if (overlaps.length > 0) {
    warnings.push(`功能重叠预警：你当前账单已有同类「${meta.category}」服务（${overlaps.map((o) => o.merchant).join("、")}），再开将产生双重月费`);
  }
  if (meta.category === "长辈误触高危") {
    warnings.push("高危伪刚需类目：系统原生功能即可免费替代，强烈建议拦截");
  }

  let verdict = "可控开通";
  let verdictLevel = "green";
  let advice = `价格结构透明，开通后可让阿宝在下次续费前 48 小时推送确认提醒。`;

  if (meta.category === "长辈误触高危" || (firstPrice <= 1 && cycle === "yearly") || (jumpMultiple >= 5 && overlaps.length > 0)) {
    verdict = "强烈劝退 · 拦截开通";
    verdictLevel = "red";
    advice = `不要签自动续费协议！${meta.alt}。`;
  } else if (jumpMultiple >= 2.5 || overlaps.length > 0) {
    verdict = "警惕刺客 · 建议单次卡或先关旧订阅";
    verdictLevel = "yellow";
    advice = overlaps.length > 0
      ? `建议先关闭已有的「${overlaps[0].merchant}」再切换，或只买非连续单月卡；如确需试用，开通后立刻唤起阿宝关闭自动续费（不影响首月权益）。`
      : `利用首月低价后，开通当下即可在支付宝关闭自动扣款，避免次月被按 ¥${renewPrice} 静默续费。`;
  }

  return {
    serviceName,
    category: meta.category,
    firstPrice,
    renewPrice,
    cycle,
    year1Cost,
    jumpMultiple,
    overlaps: overlaps.map((o) => ({ merchant: o.merchant, yearly: o.yearly })),
    warnings,
    verdict,
    verdictLevel,
    advice,
    abaoReminder: `阿宝已就绪：若你决定体验「${serviceName}」，可一键设置“到期前 48 小时阿宝强提醒”并在开通后直达支付宝免密管理解约。`,
  };
}

/**
 * 事后追回引擎：评估追回胜率、生成合法合规举证申诉包与阿宝 Skill 执行步骤
 */
export function buildAppealPackage(item, opts = {}) {
  const within7Days = opts.within7Days ?? true;
  const unusedAfterRenew = opts.unusedAfterRenew ?? (item.usedDays30 === 0);
  const noAdvanceNotice = opts.noAdvanceNotice ?? true;
  const isElderAccidental = opts.isElderAccidental ?? (item.category === "长辈误触高危");

  let score = 35;
  const grounds = [];
  if (within7Days) {
    score += 20;
    grounds.push("扣款发生于 7 日内，仍处于平台黄金申诉窗口期");
  }
  if (unusedAfterRenew) {
    score += 25;
    grounds.push("自动续费生效后未使用任何新增会员权益，商户无实际成本损失");
  }
  if (noAdvanceNotice) {
    score += 15;
    grounds.push("依据《网络交易监督管理办法》第 18 条，自动续费前 5 日应以显著方式提请消费者注意");
  }
  if (isElderAccidental) {
    score += 10;
    grounds.push("属于老年用户误触/首月低价诱导开通，可申请消费者权益保护优先退费");
  }
  score = Math.min(score, 95);

  const probabilityLabel = score >= 80 ? `高（预估 ${score}%）` : score >= 60 ? `中（预估 ${score}%）` : `基础（预估 ${score}%）`;
  const orderRef = item.orderNo || "（请填入支付宝账单订单号）";

  const alipayComplaintScript = [
    `【支付宝账单自动续费退费申诉】`,
    `订单商户：${item.merchant}`,
    `扣款时间与金额：${item.lastDate}，实付 ¥${item.amount}`,
    `交易订单号：${orderRef}`,
    `申诉事由：本人未在续费前 5 日收到显著自动续费提醒${unusedAfterRenew ? "，且扣款后未使用任何会员权益" : ""}${isElderAccidental ? "（系家中长辈误触广告弹窗签约免密）" : ""}。`,
    `法规依据：依据国家市场监管总局《网络交易监督管理办法》第十八条规定，自动展期/自动续费前五日应以显著方式提请消费者注意并由消费者自主选择。`,
    `诉求：1）立即解除该商户免密自动扣款协议；2）全额原路退回本次误扣款项 ¥${item.amount} 至原支付宝账户。`,
  ].join("\n");

  const merchantCsScript = `你好，我在 ${item.lastDate} 被「${item.merchant}」通过免密自动扣款 ¥${item.amount}（订单号：${orderRef}）。此前并未收到显著续费提醒${unusedAfterRenew ? "，扣款后也未消耗任何会员权益" : ""}。我已准备关闭自动续费，麻烦核实使用记录并协助办理全额原路退款，谢谢！`;

  const abaoWorkflowSteps = [
    {
      step: 1,
      tool: "abao.bill.get_order_detail",
      title: "定位异常扣款订单与免密协议号",
      detail: `已锁定 ${item.merchant}（订单 ${orderRef}，¥${item.amount}，渠道：${item.channel}）`,
      requiresConfirm: false,
    },
    {
      step: 2,
      tool: "subguard.verify_refund_grounds",
      title: "核对《网交办法》第18条与权益零消耗证据",
      detail: `命中 ${grounds.length} 条高权重退费依据，预估追回成功率 ${score}%`,
      requiresConfirm: false,
    },
    {
      step: 3,
      tool: "abao.deduct.close_agreement",
      title: "【需用户确认】一键解约对应免密支付协议",
      detail: "止血优先：先断开后续自动续费，避免下月继续扣款",
      requiresConfirm: true,
    },
    {
      step: 4,
      tool: "abao.dispute.submit_refund",
      title: "【需用户确认】自动填充并提交支付宝账单申诉 / 商户退费单",
      detail: "用户二次确认后提交，阿宝持续跟踪退款到账并播报结果",
      requiresConfirm: true,
    },
  ];

  return {
    merchant: item.merchant,
    amount: item.amount,
    score,
    probabilityLabel,
    grounds,
    alipayComplaintScript,
    merchantCsScript,
    cancelGuide: CANCEL_GUIDES[item.channel] || CANCEL_GUIDES["其他"],
    abaoWorkflowSteps,
  };
}

/**
 * 阿宝自然语言对话路由器：把用户口语请求映射到订阅保镖 Skill 工具调用链路
 */
export function handleAbaoChat(message, currentItems) {
  const msg = String(message || "").trim();
  const audit = auditSubscriptions(currentItems);

  // 1. 事前浏览拦截意图
  if (/首月|试用|要不要开|值不值|浏览|准备买|买前|扫雷|优惠/.test(msg)) {
    const pre = analyzePrePurchaseOffer({ promoText: msg }, audit.items);
    return {
      intent: "precheck",
      skillBadge: "subguard.precheck_offer",
      toolTrace: [
        { tool: "abao.context.read_offer_text", status: "ok", summary: `识别服务「${pre.serviceName}」，首期 ¥${pre.firstPrice} → 续费 ¥${pre.renewPrice}` },
        { tool: "abao.bill.load_active_subs", status: "ok", summary: `比对用户当前 ${audit.items.length} 项在途订阅，发现 ${pre.overlaps.length} 项同类重叠` },
        { tool: "subguard.precheck_offer", status: "ok", summary: `首年真实总成本 ¥${pre.year1Cost}，裁决：${pre.verdict}` },
      ],
      reply: `**阿宝事前扫雷结论：${pre.verdict}**\n• 真实账本：表面首期仅 ¥${pre.firstPrice}，次期涨至 ¥${pre.renewPrice}（${pre.jumpMultiple} 倍），**首年真实总支出 ¥${pre.year1Cost}**。\n• 重叠核查：${pre.overlaps.length > 0 ? `你已开通同类「${pre.category}」服务（${pre.overlaps.map((o) => o.merchant).join("、")}），不建议重复付费。` : "未发现同类重叠，但须防忘关续费。"}\n• 阿宝建议：${pre.advice}`,
      suggestedTab: "precheck",
      payload: pre,
    };
  }

  // 2. 事后误扣追回意图
  if (/追回|退款|申诉|昨晚|误扣|静默扣|维权|投诉/.test(msg)) {
    const target = audit.items.find((x) => x.level === "red") || audit.items[0];
    if (!target) {
      return {
        intent: "appeal",
        skillBadge: "subguard.draft_appeal",
        toolTrace: [{ tool: "abao.bill.search_recent_deduct", status: "ok", summary: "当前账单为空，请先同步账单" }],
        reply: "阿宝暂未检测到账单记录，请先点击「阿宝授权同步账单」或粘贴扣费短信。",
        suggestedTab: "audit",
      };
    }
    const pkg = buildAppealPackage(target);
    return {
      intent: "appeal",
      skillBadge: "abao.dispute.prepare_refund",
      toolTrace: pkg.abaoWorkflowSteps.map((s) => ({
        tool: s.tool,
        status: s.requiresConfirm ? "await_confirm" : "ok",
        summary: s.detail,
      })),
      reply: `**阿宝已为你备齐「${pkg.merchant}（¥${pkg.amount}）」申诉追回包！**\n• 预估追回胜率：**${pkg.probabilityLabel}**（已匹配《网络交易监督管理办法》第 18 条与零消耗举证）。\n• 安全红线：关闭免密协议与正式提交申诉涉及账户变更，**需你亲自点一次确认**。\n• 点击下方「前往事后追回台」即可一键复制申诉材料或模拟触发阿宝二次确认执行。`,
      suggestedTab: "appeal",
      payload: pkg,
    };
  }

  // 3. 长辈防误触专项
  if (/爸妈|长辈|老人|父母|误触/.test(msg)) {
    const elderAudit = auditSubscriptions(PERSONA_PRESETS.elder.items);
    return {
      intent: "elder_audit",
      skillBadge: "abao.family_guard_scan",
      toolTrace: [
        { tool: "abao.family.sync_elder_bills", status: "ok", summary: "已切换至「银发长辈防误触」脱敏账单沙盒（5 项自动扣款）" },
        { tool: "subguard.detect_traps", status: "ok", summary: `揪出 ${elderAudit.stats.redCount} 项高危误触扣费，年度可立省 ¥${elderAudit.stats.potentialSaveYearly}` },
      ],
      reply: `**阿宝家庭守护体检完成！** 共扫描 5 项长辈自动扣款，揪出 **${elderAudit.stats.redCount} 项高危刺客**（含「极速手机清理大师VIP」「每日健康天气VIP」等典型广告诱导免密），**一年可帮爸妈省回 ¥${elderAudit.stats.potentialSaveYearly}**。\n• 真正每天听评书的「喜马拉雅」已标绿保留，避免误关长辈刚需。\n• 已自动切换至长辈账单视图，可直接生成大字版《家庭止血体检单》发给家人。`,
      suggestedTab: "audit",
      switchPreset: "elder",
    };
  }

  // 4. 默认：拉取支付宝近 90 天账单全面体检
  const topRed = audit.items.filter((x) => x.level === "red").slice(0, 3);
  return {
    intent: "sync_audit",
    skillBadge: "abao.bill.sync_and_audit",
    toolTrace: [
      { tool: "abao.bill.sync_recurring_90d", status: "ok", summary: `读取当前账单 ${audit.stats.count} 条周期扣款（年度总计 ¥${audit.stats.totalYearly}）` },
      { tool: "subguard.detect_traps", status: "ok", summary: `识别 🔴高危 ${audit.stats.redCount} 项 / 🟡可优化 ${audit.stats.yellowCount} 项 / 🟢刚需 ${audit.stats.greenCount} 项` },
      { tool: "subguard.estimate_savings", status: "ok", summary: `年度可立省 ¥${audit.stats.potentialSaveYearly}（3年累计止损 ¥${audit.stats.threeYearDrain}）` },
    ],
    reply: `**阿宝近 90 天账单订阅体检已完成！**\n• 账单全景：共发现 **${audit.stats.count} 项**周期扣款，年总支出 **¥${audit.stats.totalYearly}**；其中 **🔴 ${audit.stats.redCount} 项立刻止血**、**🟡 ${audit.stats.yellowCount} 项可降级**，**一年可立省 ¥${audit.stats.potentialSaveYearly}**（3 年省 ¥${audit.stats.threeYearDrain}）。\n• 头号刺客：${topRed.map((x) => `「${x.merchant} ¥${x.amount}」`).join("、") || "暂无高危项"}。\n• 下一步：可点「事中体检」逐条关闭免密，或点「事后追回」一键生成退费申诉包。`,
    suggestedTab: "audit",
    payload: audit,
  };
}
