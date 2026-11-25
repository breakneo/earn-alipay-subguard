---
name: alipay-subguard
description: 支付宝「阿宝」生活好帮手技能：端侧解析真实支付宝/微信导出账单、事前算清连续包月陷阱并导出手机日历提醒、事后生成退费沟通模板与精确解约指引。严格对齐支付宝开放平台代扣协议与账单接口字段标准。
version: 1.1.0
---

# 订阅刺客体检仪（支付宝阿宝技能规范）

## 生态对齐说明

- **独立运行形态（当前可直接体验）**：100% 浏览器本地离线解析支付宝官方导出《支付宝交易明细》CSV（`GB18030` 12 列电子客户回单）与手机扣费短信，结合一键复制阿宝指令与 `alipays://` 唤起，形成“支付宝导账单 → 体检仪排雷 → 唤起阿宝关免密”真实可用闭环。
- **未来接入阿宝开放生态（零改造对齐）**：工具入参严格映射支付宝开放平台真实接口字段标准：
  - 账单对账：`alipay.data.dataservice.bill.downloadurl.query`（`bill_type` / `bill_date`）
  - 免密协议查询：`alipay.user.agreement.query`（`alipay_open_id` / `agreement_no` / `personal_product_code: GENERAL_WITHHOLDING_P` / `sign_scene`）
  - 免密协议解约：`alipay.user.agreement.unsign`（`agreement_no` / `third_party_type: PARTNER` / **强制 `user_confirmed: true`**）

## 安全与合规红线

1. 账单分析默认端侧本地完成，绝不上传个人姓名、支付宝账号、完整订单流水至第三方服务器；
2. 凡涉及解除代扣协议或提交正式账单申诉，必须由本人二次确认，绝不静默代操；
3. 退费话术与要素评估明确标注“仅供参考，不构成正式法律意见”。
