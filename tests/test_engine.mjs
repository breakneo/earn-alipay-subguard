/**
 * 订阅刺客体检仪核心引擎单元测试（Node.js 原生测试运行器）
 */
import assert from "node:assert/strict";
import {
  PERSONA_PRESETS,
  analyzePrePurchaseOffer,
  auditSubscriptions,
  buildAppealPackage,
  handleAbaoChat,
  parseBillText,
} from "../app/engine.js";

// 1. 测试 CSV + 人民币/美元短信混合离线解析
const sampleText = [
  "交易时间,交易分类,交易对方,商品说明,收/支,金额,交易状态",
  "2026-11-23,影音娱乐,爱奇艺,连续包月VIP,支出,25.00,交易成功",
  "【支付宝】您于2026-11-24通过免密自动扣款向知乎盐选支付19.00元（首月1元，未使用）",
  "ChatGPT Plus 自动续费 $20.00/月",
].join("\n");

const parsed = parseBillText(sampleText);
assert.equal(parsed.length, 3, "应准确解析 3 条账单/短信记录");
assert.equal(parsed[0].amount, 25);
assert.equal(parsed[1].prevAmount, 1, "应识别首月1元历史低价");
assert.equal(parsed[2].amount, 145, "应按 7.25 汇率将 $20 折算为 ¥145");

// 2. 测试事中体检引擎：识别刺客、重叠与可省金额
const workerAudit = auditSubscriptions(PERSONA_PRESETS.worker.items);
assert.ok(workerAudit.stats.redCount >= 4, "打工人账单应识别出至少 4 项红色高危止血项");
assert.ok(workerAudit.stats.potentialSaveYearly > 1000, "年度可省金额应大于 ¥1,000");
assert.equal(workerAudit.stats.threeYearDrain, +(workerAudit.stats.potentialSaveYearly * 3).toFixed(2));
const iqy = workerAudit.items.find((x) => x.merchant.includes("爱奇艺"));
assert.equal(iqy.level, "red", "首月1元涨至25元的爱奇艺应判为红色高危");

// 3. 测试长辈账单：误触清理类必须标红，高频喜马拉雅必须保留标绿
const elderAudit = auditSubscriptions(PERSONA_PRESETS.elder.items);
const cleaner = elderAudit.items.find((x) => x.merchant.includes("清理大师"));
const xmly = elderAudit.items.find((x) => x.merchant.includes("喜马拉雅"));
assert.equal(cleaner.level, "red");
assert.equal(xmly.level, "green");

// 4. 测试事前浏览唤起扫雷：识别首月1元暴涨 + 同类重复订阅
const pre = analyzePrePurchaseOffer(
  { promoText: "某视频首月1元体验，次月起连续包月28元", serviceName: "芒果TV" },
  workerAudit.items
);
assert.equal(pre.jumpMultiple, 28);
assert.equal(pre.year1Cost, 309);
assert.equal(pre.verdictLevel, "red", "28倍涨价且与已有影音订阅重叠应直接劝退拦截");
assert.ok(pre.overlaps.length >= 1, "应命中已有影音娱乐重叠");

// 5. 测试事后自动申诉包与法规依据、二次确认门禁
const zhihu = workerAudit.items.find((x) => x.merchant.includes("知乎"));
const appeal = buildAppealPackage(zhihu);
assert.ok(appeal.score >= 85, "7日内+未使用+未显著提醒应具高追回胜率");
assert.ok(appeal.alipayComplaintScript.includes("网络交易监督管理办法"), "必须附带第18条法规依据");
const confirmSteps = appeal.abaoWorkflowSteps.filter((s) => s.requiresConfirm);
assert.equal(confirmSteps.length, 2, "解约免密与正式申诉两步必须强制二次确认");

// 6. 测试阿宝自然语言对话路由（事前/事中/事后/长辈）
const chatPre = handleAbaoChat("我正在浏览一个0.01元试用7天到期自动扣198元包年的修图会员，要不要开？", PERSONA_PRESETS.worker.items);
assert.equal(chatPre.intent, "precheck");
assert.equal(chatPre.payload.verdictLevel, "red");

const chatAppeal = handleAbaoChat("昨晚被静默扣了钱，启动订阅保镖帮我追回退款", PERSONA_PRESETS.worker.items);
assert.equal(chatAppeal.intent, "appeal");
assert.ok(chatAppeal.toolTrace.some((t) => t.status === "await_confirm"));

console.log("ALL ENGINE UNIT TESTS PASSED (6/6 SUITES)");
