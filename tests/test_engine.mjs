import assert from "node:assert/strict";
import {
  PERSONA_PRESETS,
  analyzePrePurchaseOffer,
  auditSubscriptions,
  buildAppealPackage,
  handleAbaoChat,
  parseBillText,
} from "../app/engine.js";

// 1. 事中体检：都市打工人账单
const workerAudit = auditSubscriptions(PERSONA_PRESETS.worker.items);
assert.equal(workerAudit.stats.count, 8, "应识别 8 项订阅");
assert.ok(workerAudit.stats.redCount >= 4, "应至少检出 4 项红灯刺客");
assert.ok(workerAudit.stats.potentialSaveYearly > 1000, "年度可立省金额应大于 ¥1000");
assert.equal(
  workerAudit.items.find((x) => x.merchant.includes("美团"))?.level,
  "green",
  "高频美团刚需应标绿保留"
);

// 2. 事中体检：银发长辈防误触账单
const elderAudit = auditSubscriptions(PERSONA_PRESETS.elder.items);
assert.ok(elderAudit.stats.redCount >= 3, "长辈账单应检出高危误触扣费");
assert.equal(
  elderAudit.items.find((x) => x.merchant.includes("喜马拉雅"))?.level,
  "green",
  "长辈高频听书刚需不应误杀"
);

// 3. 本地 CSV + 短信 + 美元混排解析
const sampleText = [
  "交易时间,交易分类,交易对方,商品说明,收/支,金额",
  "2026-11-24 08:12:00,数码电器,爱奇艺连续包月,VIP自动续费,支出,25.00",
  "【支付宝】2026-11-24 通过免密自动扣款向知乎盐选支付19.00元（首月1元，未使用）",
  "ChatGPT Plus 自动续费 $20.00/月",
].join("\n");
const parsed = parseBillText(sampleText);
assert.equal(parsed.length, 3, "应成功解析 3 条记录");
assert.equal(parsed[0].amount, 25);
assert.equal(parsed[1].prevAmount, 1, "应识别首月1元");
assert.equal(parsed[1].usedDays30, 0, "应识别未使用状态");
assert.equal(parsed[2].amount, 145, "美元 $20 应按 7.25 折算为 ¥145");

// 4. 事前扫雷：价格暴涨 + 重叠预警
const pre1 = analyzePrePurchaseOffer(
  { promoText: "芒果TV首月1元体验，次月起连续包月28元" },
  workerAudit.items
);
assert.equal(pre1.firstPrice, 1);
assert.equal(pre1.renewPrice, 28);
assert.equal(pre1.year1Cost, 309);
assert.equal(pre1.verdictLevel, "red", "28倍涨价+影音重叠应强烈劝退");
assert.ok(pre1.overlaps.length >= 1, "应检测到同类影音重叠");

const pre2 = analyzePrePurchaseOffer(
  { promoText: "轻颜修图VIP 0.01元试用7天到期自动扣198元包年" },
  []
);
assert.equal(pre2.cycle, "yearly");
assert.equal(pre2.verdictLevel, "red", "0.01元试用转包年应直接红灯拦截");

// 5. 事后追回：合规表述与人工二次确认门禁
const zhihu = workerAudit.items.find((x) => x.merchant.includes("知乎"));
const pkg = buildAppealPackage(zhihu, { within7Days: true, unusedAfterRenew: true, noAdvanceNotice: true });
assert.ok(pkg.probabilityLabel.includes("仅供参考"), "合规要求：不得输出确定性法律结论");
assert.ok(!pkg.probabilityLabel.includes("95%"), "合规要求：不得出现确定性百分比胜率");
assert.ok(pkg.alipayComplaintScript.includes("网络交易监督管理办法"), "申诉模板须包含法规参考条款");
assert.equal(pkg.abaoWorkflowSteps.filter((s) => s.requiresConfirm).length, 2, "解约与提交申诉须强制二次确认");

// 6. 阿宝自然语言对话路由 + 中文步骤标签
const chat1 = handleAbaoChat("我正在浏览芒果TV首月1元次月28元值不值", PERSONA_PRESETS.worker.items);
assert.equal(chat1.intent, "precheck");
assert.ok(chat1.toolTrace.every((t) => Boolean(t.label)), "每条执行轨迹应含中文标签");
const chat2 = handleAbaoChat("昨晚被扣款了，帮我申诉追回", PERSONA_PRESETS.worker.items);
assert.equal(chat2.intent, "appeal");
const chat3 = handleAbaoChat("帮我查查爸妈手机有没有误触", PERSONA_PRESETS.worker.items);
assert.equal(chat3.switchPreset, "elder");

// 7. 对话框直接粘贴扣费短信自动离线解析
const chat4 = handleAbaoChat("【支付宝】2026-11-24 通过自动扣款向扫描全能王支付30.00元（首月1元，未使用）", PERSONA_PRESETS.worker.items);
assert.equal(chat4.intent, "parse_sms");
assert.equal(chat4.parsedItems.length, 1);

console.log("ALL ENGINE UNIT TESTS PASSED (7/7 SUITES)");
