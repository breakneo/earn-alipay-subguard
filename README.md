# 生活好帮手 · 订阅刺客体检仪

面向支付宝「智能体涌现奖 2026」（生活好帮手赛道，作品编号 `6ebc96914f8eab`）开发的端侧订阅审计与消费决策智能体，零假数据起步，已使用脱敏后的真实百行级官方支付宝导出 CSV 完成实测验证。

## 在线体验（电脑与手机竖屏均可直接打开）

- 在线地址：`https://breakneo.github.io/earn-alipay-subguard/`

## 核心能力

1. **真实官方账单本地解析**：直接导入支付宝官方导出的 `GB18030` 12 列《支付宝交易明细》CSV 或微信账单 CSV（纯浏览器本地运算、0 字节上传云端），自动过滤餐饮/外卖/出行/停车/医保等日常支出，聚合多月记录精准识别周期订阅、涨价与刚需自动缴费；同时支持粘贴手机扣费短信、勾选会员与手动记账。
2. **买前算账 + 真实手机日历提醒**：算清首月低价背后的首年实花金额与同类重复，一键导出标准 `.ics` 日历文件，手机点开即可在续费前 48 小时真响铃。
3. **退费助手 + 真·阿宝联动**：自动带入订单生成可复制的支付宝投诉与商家客服沟通话术（明确标注仅供参考，不构成法律意见），内置「一键复制口令问阿宝」与手机端唤起支付宝快捷入口。
4. **双引擎 AI + 开放平台协议对齐**：默认端侧离线引擎保证 0 误差算账，支持在「AI 设置」中按需连接通义千问 / 豆包 / DeepSeek；配套 `skills/alipay-subguard/SKILL.md` 与 `tools-schema.json` 严格对齐 `alipay.data.dataservice.bill.downloadurl.query`、`alipay.user.agreement.query`、`alipay.user.agreement.unsign` 字段标准。

## 本地运行与测试

```bash
# 运行核心引擎单元测试（7/7 套件）
node tests/test_engine.mjs

# 启动本地服务（打开 http://127.0.0.1:8080/index.html）
python3 -m http.server 8080 --directory app
```
