import assert from "node:assert/strict";
import {
  SAMPLE_BILL_ITEMS,
  analyzePrePurchaseOffer,
  auditSubscriptions,
  buildAppealPackage,
  buildReminderICS,
  handleAbaoChat,
  parseBillText,
} from "../app/engine.js";

// 1. 真实支付宝官方 12 列电子回单 CSV（含前置说明行、尾随制表符订单号、餐饮/闪购/高速过滤、云上贵州跨月与电费自动缴费）
const alipayCsv = [
  "导出信息：",
  "起始时间：[2026-08-25 00:00:00] 终止时间：[2026-11-25 23:59:59]",
  "------------------------支付宝支付科技有限公司  电子客户回单------------------------",
  "交易时间,交易分类,交易对方,对方账号,商品说明,收/支,金额,收/付款方式,交易状态,交易订单号,商家订单号,备注,",
  "2026-11-23 09:00:00,文化休闲,爱奇艺,/,爱奇艺黄金VIP连续包月,支出,25.00,余额宝,交易成功,202611230001\t,M01,,",
  "2026-10-23 09:00:00,文化休闲,爱奇艺,/,爱奇艺黄金VIP首月体验,支出,1.00,余额宝,交易成功,202610230001\t,M02,,",
  "2026-10-21 10:00:00,文化休闲,iCloud 由云上贵州运营,/,iCloud；10.21购买,支出,6.00,信用卡,交易成功,202610210002\t,M03,,",
  "2026-09-21 10:00:00,文化休闲,iCloud 由云上贵州运营,/,iCloud；09.21购买,支出,6.00,信用卡,交易成功,202609210002\t,M04,,",
  "2026-10-12 08:00:00,充值缴费,国网北京市电力公司,/,电费自动缴费-根据每期出账后自动缴费,支出,100.00,储蓄卡,交易成功,202610120003\t,M05,,",
  "2026-11-22 02:58:46,日用百货,淘宝闪购,/,外卖订单,支出,43.70,信用卡,交易成功,202611220004\t,M06,,",
  "2026-10-22 02:58:46,日用百货,淘宝闪购,/,外卖订单,支出,34.60,信用卡,交易成功,202610220004\t,M07,,",
  "2026-11-22 16:49:00,交通出行,北京速通科技有限公司,/,高速被扫支付,支出,1.00,信用卡,交易成功,202611220005\t,M08,,",
  "2026-10-22 16:49:00,交通出行,北京速通科技有限公司,/,高速被扫支付,支出,1.00,信用卡,交易成功,202610220005\t,M09,,",
  "2026-11-20 10:59:17,餐饮美食,牛满仓,/,美团收银12345,支出,19.00,储蓄卡,交易成功,202611200006\t,M10,,",
  "2026-11-18 10:00:00,转账红包,张三,/,转账,收入,500.00,余额,交易成功,202611180007\t,M11,,",
].join("\n");
const csvItems = parseBillText(alipayCsv);
assert.equal(csvItems.length, 3, "应精准筛出爱奇艺、iCloud、电费自动缴费 3 项，过滤淘宝闪购/高速/美团收银/收入");
const iqiyi = csvItems.find((x) => x.merchant === "爱奇艺");
assert.equal(iqiyi.amount, 25);
assert.equal(iqiyi.prevAmount, 1, "应自动比对出上月首期价格 1 元");
assert.equal(iqiyi.orderNo, "202611230001", "应清除支付宝订单号尾随制表符");
const icloud = csvItems.find((x) => x.merchant.includes("iCloud"));
assert.equal(icloud.chargeCount, 2, "应聚合并统计 iCloud 跨月扣款次数");
const utility = csvItems.find((x) => x.category === "生活自动缴费");
assert.equal(auditSubscriptions([utility]).items[0].level, "green", "电费自动缴费应识别为刚需保留");

// 2. 真实扣费短信（含人民币 + 美元折算）
const sms = [
  "【支付宝】2026-11-24 向知乎盐选自动扣款19.00元（首月1元，未使用）订单号:202611249988",
  "ChatGPT Plus 自动续费 $20.00/月",
].join("\n");
const smsItems = parseBillText(sms);
assert.equal(smsItems.length, 2);
assert.equal(smsItems[0].prevAmount, 1);
assert.equal(smsItems[0].orderNo, "202611249988");
assert.equal(smsItems[1].amount, 145);

// 3. 账单体检（含示例校验）
const audit = auditSubscriptions(SAMPLE_BILL_ITEMS);
assert.equal(audit.stats.count, 7);
assert.ok(audit.stats.redCount >= 3);
assert.equal(audit.items.find((x) => x.merchant.includes("美团"))?.level, "green");

// 4. 买前算账
const pre1 = analyzePrePurchaseOffer({ promoText: "芒果TV首月1元，次月起28元/月自动续费" }, audit.items);
assert.equal(pre1.firstPrice, 1);
assert.equal(pre1.renewPrice, 28);
assert.equal(pre1.year1Cost, 309);
assert.equal(pre1.verdictLevel, "red");

const pre2 = analyzePrePurchaseOffer({ promoText: "轻颜0.01元试用7天到期自动扣198元包年" }, []);
assert.equal(pre2.cycle, "yearly");
assert.equal(pre2.verdictLevel, "red");

// 5. 退费话术与合规声明
const pkg = buildAppealPackage({ merchant: "知乎盐选", amount: 19, channel: "支付宝", orderNo: "202611249988" });
assert.ok(pkg.probabilityLabel.includes("仅供参考"));
assert.ok(pkg.alipayComplaintScript.includes("网络交易监督管理办法"));
assert.ok(pkg.alipayComplaintScript.includes("202611249988"));

// 6. 真实 .ics 日历文件生成
const ics = buildReminderICS("芒果TV", 28, 28);
assert.ok(ics.includes("BEGIN:VCALENDAR") && ics.includes("TRIGGER:-P2D") && ics.includes("芒果TV"));

// 7. 空账单问阿宝绝不伪造假数据；粘贴短信则真实入账
const emptyChat = handleAbaoChat("帮我查查账单", []);
assert.equal(emptyChat.intent, "empty");
assert.ok(emptyChat.reply.includes("还没有添加"));

const smsChat = handleAbaoChat("【支付宝】向扫描全能王自动扣款30元（首月1元，未使用）", []);
assert.equal(smsChat.intent, "parse_sms");
assert.equal(smsChat.parsedItems.length, 1);

console.log("ALL ENGINE UNIT TESTS PASSED (7/7 SUITES)");
