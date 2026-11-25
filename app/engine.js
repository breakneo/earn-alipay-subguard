/**
 * 订阅体检仪 · 核心计算与本地解析引擎
 * 100% 浏览器本地运行，真实解析支付宝/微信导出 CSV 账单、扣费短信，
 * 计算真实年度支出、同类重复与涨价幅度，并生成标准 .ics 手机日历提醒。
 */

export const USD_TO_CNY = 7.25;

/** 常见订阅服务目录（用于匹配渠道、品类、参考月费与退订指引） */
export const MERCHANT_CATALOG = [
  { key: "爱奇艺", aliases: ["爱奇艺", "iqiyi"], category: "视频会员", typicalMonthly: 25, channel: "支付宝", alt: "追剧当月买单月卡，看完即关" },
  { key: "腾讯视频", aliases: ["腾讯视频", "腾迅视频", "wetv"], category: "视频会员", typicalMonthly: 25, channel: "微信", alt: "和爱奇艺/优酷错开买，别同时开多家" },
  { key: "优酷视频", aliases: ["优酷", "youku", "酷喵"], category: "视频会员", typicalMonthly: 25, channel: "支付宝", alt: "有 88VIP 就别再单独开连包" },
  { key: "芒果TV", aliases: ["芒果", "mangotv"], category: "视频会员", typicalMonthly: 22, channel: "支付宝", alt: "看综艺单月买，别签连续包月" },
  { key: "哔哩哔哩大会员", aliases: ["哔哩哔哩", "b站", "bilibili"], category: "视频会员", typicalMonthly: 15, channel: "支付宝", alt: "大促年卡更便宜，避免原价连包" },
  { key: "网易云音乐", aliases: ["网易云", "黑胶vip"], category: "音乐听书", typicalMonthly: 15, channel: "支付宝", alt: "88VIP 可领会员，记得关掉原连包" },
  { key: "QQ音乐", aliases: ["qq音乐", "绿钻"], category: "音乐听书", typicalMonthly: 15, channel: "微信", alt: "和网易云留一个常用的就行" },
  { key: "喜马拉雅", aliases: ["喜马拉雅", "ximalaya"], category: "音乐听书", typicalMonthly: 25, channel: "支付宝", alt: "不常听书的话建议关闭自动续费" },
  { key: "百度网盘", aliases: ["百度网盘", "度盘"], category: "网盘办公", typicalMonthly: 25, channel: "支付宝", alt: "偶尔下载买单次加速券就行" },
  { key: "夸克网盘", aliases: ["夸克", "quark"], category: "网盘办公", typicalMonthly: 19, channel: "支付宝", alt: "88VIP 含网盘权益，别重复付费" },
  { key: "WPS会员", aliases: ["wps", "金山办公"], category: "网盘办公", typicalMonthly: 20, channel: "支付宝", alt: "日常看文档用免费版就够" },
  { key: "扫描全能王", aliases: ["扫描全能王", "camscanner"], category: "网盘办公", typicalMonthly: 30, channel: "苹果 iOS", alt: "苹果备忘录或微信扫一扫可免费扫描" },
  { key: "苹果云空间", aliases: ["icloud", "apple.com/bill", "苹果云"], category: "网盘办公", typicalMonthly: 21, channel: "苹果 iOS", alt: "定期导出老照片到电脑，可降档省钱" },
  { key: "美团神会员", aliases: ["美团", "神会员", "外卖会员"], category: "外卖生活", typicalMonthly: 15, channel: "支付宝", alt: "每月点外卖少于 4 次反而不划算" },
  { key: "饿了么吃货卡", aliases: ["饿了么", "淘宝闪购"], category: "外卖生活", typicalMonthly: 15, channel: "支付宝", alt: "和美团外卖会员留一个就行" },
  { key: "高德打车卡", aliases: ["高德", "打车卡", "滴滴"], category: "出行工具", typicalMonthly: 19, channel: "支付宝", alt: "打车多的月份再买单次券包" },
  { key: "Keep会员", aliases: ["keep"], category: "运动健康", typicalMonthly: 19, channel: "苹果 iOS", alt: "一个月没练过就可以先关掉" },
  { key: "知乎盐选", aliases: ["知乎", "盐选"], category: "阅读知识", typicalMonthly: 19, channel: "支付宝", alt: "看完想看的故事记得立刻关续费" },
  { key: "番茄/七猫小说", aliases: ["番茄小说", "七猫", "起点"], category: "阅读知识", typicalMonthly: 18, channel: "支付宝", alt: "免费版也能看，没必要按月扣费" },
  { key: "醒图/轻颜/美图", aliases: ["醒图", "美图", "轻颜", "剪映"], category: "修图剪辑", typicalMonthly: 28, channel: "苹果 iOS", alt: "免费功能够用，小心试用后自动扣年费" },
  { key: "手机清理/天气会员", aliases: ["清理大师", "天气vip", "wifi", "万能钥匙", "健康管家", "极速省电"], category: "易误触扣费", typicalMonthly: 29, channel: "支付宝", alt: "手机自带清理和天气免费，建议马上退订" },
  { key: "ChatGPT会员", aliases: ["chatgpt", "openai"], category: "AI 工具", typicalMonthly: 145, channel: "其他", alt: "多个 AI 会员留最常用的 1 个即可" },
  { key: "Claude会员", aliases: ["claude", "anthropic"], category: "AI 工具", typicalMonthly: 145, channel: "其他", alt: "不常用时先暂停续费" },
  { key: "Cursor会员", aliases: ["cursor"], category: "AI 工具", typicalMonthly: 145, channel: "其他", alt: "不用写代码的月份记得暂停" },
];

/** 各支付渠道真实关闭自动扣款路径 */
export const CANCEL_GUIDES = {
  支付宝: {
    channel: "支付宝自动扣款",
    steps: [
      "打开支付宝 → 点右下角「我的」",
      "点右上角「设置」→「支付设置」",
      "点「自动扣款」→ 找到该商户",
      "点底部「关闭服务」确认即可",
    ],
  },
  微信: {
    channel: "微信扣费服务",
    steps: [
      "打开微信 →「我」→「服务」→「钱包」",
      "点最下方「支付设置」→「自动续费 / 扣费服务」",
      "找到该商户 → 点「关闭扣费服务」",
    ],
  },
  "苹果 iOS": {
    channel: "苹果订阅管理",
    steps: [
      "打开手机「设置」→ 点顶部「你的名字」",
      "点「订阅」→ 找到对应应用",
      "点底部红色「取消订阅」确认",
    ],
  },
  其他: {
    channel: "官网或银行卡扣款",
    steps: [
      "登录对应服务官网的「账号 / 订阅管理」页面",
      "关闭自动续费（Cancel / Turn off auto-renew）",
      "若找不到入口，可在银行卡应用内关闭该商户免密",
    ],
  },
};

/** 仅当用户主动点击“先看一份示例”时才加载，默认首页完全空白等待真实账单 */
export const SAMPLE_BILL_ITEMS = [
  { id: "ex1", merchant: "爱奇艺连续包月", category: "视频会员", channel: "支付宝", amount: 25, prevAmount: 1, cycle: "monthly", lastDate: "2026-11-23", usedDays30: 2, orderNo: "" },
  { id: "ex2", merchant: "腾讯视频VIP", category: "视频会员", channel: "微信", amount: 30, prevAmount: 30, cycle: "monthly", lastDate: "2026-11-18", usedDays30: 14, orderNo: "" },
  { id: "ex3", merchant: "优酷连续包月", category: "视频会员", channel: "支付宝", amount: 25, prevAmount: 9, cycle: "monthly", lastDate: "2026-11-21", usedDays30: 0, orderNo: "" },
  { id: "ex4", merchant: "百度网盘会员", category: "网盘办公", channel: "支付宝", amount: 25, prevAmount: 25, cycle: "monthly", lastDate: "2026-11-12", usedDays30: 1, orderNo: "" },
  { id: "ex5", merchant: "夸克网盘会员", category: "网盘办公", channel: "支付宝", amount: 19, prevAmount: 19, cycle: "monthly", lastDate: "2026-11-15", usedDays30: 18, orderNo: "" },
  { id: "ex6", merchant: "知乎盐选连包", category: "阅读知识", channel: "支付宝", amount: 19, prevAmount: 1, cycle: "monthly", lastDate: "2026-11-24", usedDays30: 0, orderNo: "" },
  { id: "ex7", merchant: "美团神会员", category: "外卖生活", channel: "支付宝", amount: 15, prevAmount: 15, cycle: "monthly", lastDate: "2026-11-10", usedDays30: 12, orderNo: "" },
];

export function matchMerchantMeta(name) {
  const lower = String(name || "").toLowerCase();
  for (const m of MERCHANT_CATALOG) {
    if (m.aliases.some((a) => lower.includes(a.toLowerCase()))) return m;
  }
  return {
    key: name || "自动扣款服务",
    category: "其他订阅",
    typicalMonthly: 20,
    channel: "支付宝",
    alt: "不常用的话建议直接关掉自动续费",
  };
}

export function toMonthlyCNY(amount, cycle = "monthly") {
  const n = Number(amount) || 0;
  if (cycle === "yearly") return +(n / 12).toFixed(2);
  if (cycle === "quarterly") return +(n / 3).toFixed(2);
  if (cycle === "weekly") return +(n * 4.33).toFixed(2);
  return +n.toFixed(2);
}

/** 轻量 CSV 行解析（兼容带引号的逗号字段） */
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

/**
 * 真实本地解析：
 * 1) 真实支付宝导出 CSV / 微信支付导出 CSV（自动识别表头、跳过文件前部说明行、仅取支出项，
 *    并对多月重复出现的同一商户自动合并计算出上期金额与涨价情况）；
 * 2) 真实手机扣费短信（支持人民币 ¥/元 与美元 $ 折算）。
 */
export function parseBillText(rawText, fxRate = USD_TO_CNY) {
  if (!rawText || !rawText.trim()) return [];
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 检测是否包含真实支付宝/微信 CSV 表头
  let headerIdx = -1;
  let colMap = null;
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const cols = splitCsvLine(lines[i]);
    const hasTime = cols.some((c) => /交易时间/.test(c));
    const hasAmount = cols.some((c) => /金额/.test(c));
    if (hasTime && hasAmount && cols.length >= 5) {
      headerIdx = i;
      colMap = {
        time: cols.findIndex((c) => /交易时间/.test(c)),
        merchant: cols.findIndex((c) => /交易对方/.test(c)),
        product: cols.findIndex((c) => /商品/.test(c)),
        direction: cols.findIndex((c) => /收\/支/.test(c)),
        amount: cols.findIndex((c) => /金额/.test(c)),
        orderNo: cols.findIndex((c) => /交易订单号|交易单号|订单号/.test(c)),
        status: cols.findIndex((c) => /交易状态|当前状态/.test(c)),
      };
      break;
    }
  }

  const parsed = [];
  let seq = 1;

  // 路径 A：按真实支付宝/微信 CSV 结构解析
  if (headerIdx >= 0 && colMap) {
    const isWechatFile = rawText.includes("微信支付账单");
    const merchantHistory = new Map();

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i]);
      if (cols.length < 5) continue;
      if (colMap.direction >= 0 && cols[colMap.direction] && !/支出/.test(cols[colMap.direction])) continue;
      if (colMap.status >= 0 && /关闭|退款|失败/.test(cols[colMap.status] || "")) continue;

      const amtRaw = (cols[colMap.amount] || "").replace(/[¥￥,\s]/g, "");
      const isUsd = amtRaw.includes("$");
      const val = Math.abs(parseFloat(amtRaw.replace(/[^0-9.]/g, "")));
      if (!val || isNaN(val)) continue;
      const amount = +(isUsd ? val * fxRate : val).toFixed(2);

      const mName = cols[colMap.merchant] || "";
      const pName = cols[colMap.product] || "";
      const combined = `${mName} ${pName}`.trim();
      const meta = matchMerchantMeta(combined);
      const looksLikeSub =
        meta.category !== "其他订阅" ||
        /会员|VIP|连续包|自动续费|订阅|免密|包月|包年|云空间|iCloud/i.test(combined);
      const dateStr = (cols[colMap.time] || "").slice(0, 10).replace(/\//g, "-") || "2026-11-24";
      const orderNo = colMap.orderNo >= 0 ? (cols[colMap.orderNo] || "").replace(/\t/g, "") : "";
      const key = meta.category !== "其他订阅" ? meta.key : (mName || pName).slice(0, 18);

      if (!merchantHistory.has(key)) {
        merchantHistory.set(key, { key, combined, meta, looksLikeSub, records: [] });
      }
      merchantHistory.get(key).records.push({ amount, dateStr, orderNo, isUsd, rawLine: combined });
    }

    for (const entry of merchantHistory.values()) {
      // 保留已知订阅/含会员关键词的记录，或同一商户出现 >=2 次的周期性扣款
      if (!entry.looksLikeSub && entry.records.length < 2) continue;
      entry.records.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
      const latest = entry.records[0];
      const prev = entry.records[1] || latest;
      const cycle = /包年|年费|\/年|annual/i.test(entry.combined) ? "yearly" : /包季|\/季/i.test(entry.combined) ? "quarterly" : "monthly";
      const channel = isWechatFile
        ? "微信"
        : /apple|icloud/i.test(entry.combined)
        ? "苹果 iOS"
        : latest.isUsd
        ? "其他"
        : "支付宝";

      parsed.push({
        id: `csv-${Date.now()}-${seq++}`,
        merchant: entry.key,
        category: entry.meta.category,
        channel,
        amount: latest.amount,
        prevAmount: prev.amount,
        cycle,
        lastDate: latest.dateStr,
        usedDays30: 3,
        orderNo: latest.orderNo,
      });
    }
    return parsed;
  }

  // 路径 B：解析粘贴的扣费短信或简明账单行
  for (const line of lines) {
    if (/^(交易时间|交易号|---|===|支付宝交易记录|微信支付账单)/.test(line)) continue;

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

    const prevMatch = line.match(/(?:首月|试用)[^\d]{0,4}(\d+(?:\.\d{1,2})?)/);
    const prevAmount = prevMatch ? parseFloat(prevMatch[1]) : amount;

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
      merchant = mExtract ? mExtract[1].replace(/支付宝|微信支付/, "").trim() || "自动扣款服务" : line.slice(0, 14);
    }
    const meta = matchMerchantMeta(merchant);
    const cycle = /年费|包年|\/年|yearly|annual/i.test(line) ? "yearly" : /季|\/季/i.test(line) ? "quarterly" : "monthly";
    const channel = /微信/.test(line) ? "微信" : /apple|苹果|ios|icloud/i.test(line) ? "苹果 iOS" : isUsd ? "其他" : "支付宝";
    const dateMatch = line.match(/\d{4}[-/年]\d{1,2}[-/月]\d{1,2}/);
    const lastDate = dateMatch ? dateMatch[0].replace(/[年月/]/g, "-").replace(/日$/, "") : new Date().toISOString().slice(0, 10);
    const orderMatch = line.match(/(?:订单号[:：]?|单号[:：]?)([A-Za-z0-9]{8,32})/);

    parsed.push({
      id: `sms-${Date.now()}-${seq++}`,
      merchant,
      category: meta.category,
      channel,
      amount,
      prevAmount,
      cycle,
      lastDate,
      usedDays30: /未使用|没用|误扣|忘关|不知情/.test(line) ? 0 : 2,
      orderNo: orderMatch ? orderMatch[1] : "",
    });
  }

  return parsed;
}

/** 账单体检：算清月/年真实支出、识别涨价/重复/不常用项 */
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
    const isElderRisk = it.category === "易误触扣费";
    const isUnused = (it.usedDays30 ?? 5) === 0;
    const isLowUse = (it.usedDays30 ?? 5) <= 3;
    const isOverlap = (categoryCount[it.category] || 0) >= 2 && ["视频会员", "网盘办公", "音乐听书", "AI 工具", "外卖生活"].includes(it.category);
    const isHighTicket = monthly >= 300;

    if (isElderRisk) flags.push("易误触扣费");
    if (isTrialTrap) flags.push(`首期¥${it.prevAmount}涨至¥${it.amount}`);
    else if (isPriceSpike) flags.push(`涨价${(it.amount / it.prevAmount).toFixed(1)}倍`);
    if (isUnused) flags.push("近30天没用过");
    else if (isLowUse) flags.push("用得很少");
    if (isOverlap) flags.push(`和同类${it.category}重复`);
    if (isHighTicket) flags.push("月费偏高");

    let level = "green";
    let actionLabel = "可保留";
    let saveYearly = 0;

    if (isElderRisk || isTrialTrap || isUnused) {
      level = "red";
      actionLabel = "建议退订";
      saveYearly = yearly;
    } else if (isOverlap && isLowUse) {
      level = "red";
      actionLabel = "重复少用";
      saveYearly = yearly;
    } else if (isHighTicket || isOverlap || isPriceSpike || isLowUse) {
      level = "yellow";
      actionLabel = "可省一笔";
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

  const order = { red: 0, yellow: 1, green: 2 };
  enriched.sort((a, b) => order[a.level] - order[b.level] || b.yearly - a.yearly);

  const totalMonthly = +enriched.reduce((s, x) => s + x.monthly, 0).toFixed(2);
  const totalYearly = +(totalMonthly * 12).toFixed(2);
  const potentialSaveYearly = +enriched.reduce((s, x) => s + x.saveYearly, 0).toFixed(2);
  const threeYearDrain = +(potentialSaveYearly * 3).toFixed(2);

  const byCategoryMap = {};
  for (const x of enriched) {
    byCategoryMap[x.category] = +((byCategoryMap[x.category] || 0) + x.yearly).toFixed(2);
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

/** 买前算账：算清首年真实花费、涨价倍数与已有会员重叠 */
export function analyzePrePurchaseOffer(input, existingItems = []) {
  const text = String(input.promoText || "");
  let serviceName = (input.serviceName || "").trim();
  let firstPrice = Number(input.firstPrice);
  let renewPrice = Number(input.renewPrice);
  let cycle = input.cycle || "monthly";

  if (text) {
    if (!serviceName) {
      const m = matchMerchantMeta(text);
      serviceName = m.key !== text ? m.key : "这项会员";
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
    warnings.push(`首期 ¥${firstPrice} 后涨价 ${jumpMultiple} 倍，一年实际要花 ¥${year1Cost}`);
  }
  if (firstPrice <= 1 && cycle === "yearly") {
    warnings.push(`试用结束后会直接按年扣走 ¥${renewPrice}`);
  }
  if (overlaps.length > 0) {
    warnings.push(`你已经开了同类「${meta.category}」（${overlaps.map((o) => o.merchant).join("、")}），再开会花两份钱`);
  }
  if (meta.category === "易误触扣费") {
    warnings.push("手机自带功能即可替代，没必要花钱开通");
  }

  let verdict = "价格透明，可按需开";
  let verdictLevel = "green";
  let advice = "开通后建议立刻设个手机日历提醒，到期前决定留不留。";

  if (meta.category === "易误触扣费" || (firstPrice <= 1 && cycle === "yearly") || (jumpMultiple >= 5 && overlaps.length > 0)) {
    verdict = "不建议开连包";
    verdictLevel = "red";
    advice = meta.alt;
  } else if (jumpMultiple >= 2.5 || overlaps.length > 0) {
    verdict = "小心次月涨价";
    verdictLevel = "yellow";
    advice = overlaps.length > 0
      ? `先关掉已有的「${overlaps[0].merchant}」，或只买单月卡`
      : `若要薅首月低价，开完马上把自动续费关掉（不影响首月使用）`;
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
  };
}

/** 退费助手：根据实际情况生成可直接复制发给支付宝或商家的沟通话术（仅供参考） */
export function buildAppealPackage(item, opts = {}) {
  const within7Days = opts.within7Days ?? true;
  const unusedAfterRenew = opts.unusedAfterRenew ?? (item.usedDays30 === 0);
  const noAdvanceNotice = opts.noAdvanceNotice ?? true;
  const isElderAccidental = opts.isElderAccidental ?? (item.category === "易误触扣费");

  const grounds = [];
  if (within7Days) grounds.push("7日内扣款");
  if (unusedAfterRenew) grounds.push("扣款后未使用");
  if (noAdvanceNotice) grounds.push("未收到提前5日提醒");
  if (isElderAccidental) grounds.push("长辈误触开通");

  const probabilityLabel =
    grounds.length >= 3
      ? "条件较充分（仅供参考）"
      : grounds.length === 2
      ? "可尝试沟通退费（仅供参考）"
      : "建议先关闭自动扣款（仅供参考）";

  const orderRef = item.orderNo?.trim() || "（填入账单里的订单号）";
  const dateStr = item.lastDate || new Date().toISOString().slice(0, 10);

  const alipayComplaintScript = [
    `订单商户：${item.merchant}`,
    `扣款时间与金额：${dateStr}，实付 ¥${item.amount}`,
    `交易订单号：${orderRef}`,
    `情况说明：本人未在续费前 5 日收到显著自动续费提醒${unusedAfterRenew ? "，扣款后也未使用任何会员权益" : ""}${isElderAccidental ? "（家中长辈误点弹窗开通）" : ""}。`,
    `申请诉求：参照《网络交易监督管理办法》第十八条关于自动续费提前五日显著提醒的规定，申请关闭该自动扣款并全额原路退回 ¥${item.amount}。`,
  ].join("\n");

  const merchantCsScript = `你好，我在 ${dateStr} 被「${item.merchant}」自动扣款 ¥${item.amount}（订单号：${orderRef}）。此前没有收到显著续费提醒${unusedAfterRenew ? "，扣款后也没用过会员权益" : ""}。麻烦帮忙核实并办理原路退款，谢谢！`;

  return {
    merchant: item.merchant,
    amount: item.amount,
    grounds,
    probabilityLabel,
    alipayComplaintScript,
    merchantCsScript,
    cancelGuide: CANCEL_GUIDES[item.channel] || CANCEL_GUIDES["其他"],
  };
}

/** 生成真实标准 .ics 手机/电脑日历日程文件（到期前 48 小时真响铃提醒） */
export function buildReminderICS(serviceName, renewPrice, daysUntilRenew = 28) {
  const now = new Date();
  const target = new Date(now.getTime() + daysUntilRenew * 86400 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const end = new Date(target.getTime() + 30 * 60 * 1000);
  const uid = `subguard-${Date.now()}@alipay-helper`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//订阅体检仪//续费提醒//ZH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fmt(now)}`,
    `DTSTART:${fmt(target)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:记得检查「${serviceName}」自动续费（¥${renewPrice}）`,
    `DESCRIPTION:如果不打算继续使用「${serviceName}」，请在扣费前到支付宝/微信/苹果订阅里关闭自动扣款。`,
    "BEGIN:VALARM",
    "TRIGGER:-P2D",
    "ACTION:DISPLAY",
    `DESCRIPTION:「${serviceName}」将在 2 天后续费 ¥${renewPrice}，不用记得关掉！`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** 阿宝本地自然语言回复（绝不伪造未导入的账单数字） */
export function handleAbaoChat(message, currentItems) {
  const msg = String(message || "").trim();
  const audit = auditSubscriptions(currentItems);

  // 1. 直接发来扣费短信 -> 真实解析并入账
  const parsedSms = parseBillText(msg);
  if (parsedSms.length > 0 && !/首月.*值不值|要不要开|划算/.test(msg)) {
    const merged = auditSubscriptions([...parsedSms, ...currentItems]);
    return {
      intent: "parse_sms",
      parsedItems: parsedSms,
      reply: `已记下 ${parsedSms.map((p) => `「${p.merchant} ¥${p.amount}」`).join("、")}。\n你目前共有 **${merged.stats.count} 笔**周期扣款，一年合计 **¥${merged.stats.totalYearly}**${merged.stats.redCount > 0 ? `，其中 ${merged.stats.redCount} 笔建议退订` : ""}。`,
      suggestedTab: "audit",
    };
  }

  // 2. 问某个活动/会员值不值 -> 真实算账
  if (/首月|试用|要不要开|值不值|买前|划算|连续包|优惠/.test(msg)) {
    const pre = analyzePrePurchaseOffer({ promoText: msg }, audit.items);
    return {
      intent: "precheck",
      reply: `**${pre.verdict}**\n首期 ¥${pre.firstPrice}，之后 ¥${pre.renewPrice}（涨 ${pre.jumpMultiple} 倍），**一年实际花 ¥${pre.year1Cost}**。\n${pre.overlaps.length > 0 ? `提醒：你已有同类「${pre.category}」服务。` : ""}${pre.advice}`,
      suggestedTab: "precheck",
      payload: pre,
    };
  }

  // 3. 问误扣退费 -> 用当前真实账单里的订单（若为空则直接引导输入，绝不编假订单！）
  if (/退费|退款|申诉|误扣|扣款了|追回|投诉/.test(msg)) {
    if (!audit.items.length) {
      return {
        intent: "appeal",
        reply: "你还没导入账单。可以直接把**扣费短信粘贴发给我**，或点下方去「退费助手」填一下商户和金额，立刻生成客服沟通话术。",
        suggestedTab: "appeal",
      };
    }
    const target = audit.items.find((x) => x.level === "red") || audit.items[0];
    return {
      intent: "appeal",
      reply: `已为你准备好「**${target.merchant}（¥${target.amount}）**」的退费沟通话术和关免密步骤，去「退费助手」一键复制发给支付宝或商家客服即可（话术仅供参考）。`,
      suggestedTab: "appeal",
    };
  }

  // 4. 查账单汇总（若未导入，诚实引导导入，绝不编造假账单！）
  if (!audit.items.length) {
    return {
      intent: "empty",
      reply: "你还没有添加任何账单记录。\n你可以：\n1. 直接把**扣费短信**粘贴发给我；\n2. 贴一段**首月低价活动文案**让我帮你算一年实花；\n3. 去「查账单」导入支付宝/微信导出表格。",
      suggestedTab: "audit",
    };
  }

  const topRed = audit.items.filter((x) => x.level === "red").slice(0, 3);
  return {
    intent: "summary",
    reply: `你目前共有 **${audit.stats.count} 笔**周期扣款，一年共花 **¥${audit.stats.totalYearly}**。\n${topRed.length ? `优先检查：${topRed.map((x) => `「${x.merchant} ¥${x.amount}」`).join("、")}，退掉后预计一年能省 **¥${audit.stats.potentialSaveYearly}**。` : "目前看起来都是常用项目，没有明显浪费。"}`,
    suggestedTab: "audit",
  };
}
