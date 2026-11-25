# 生活好帮手+订阅刺客体检仪（Alipay Abao × SubGuard Skill）

> 支付宝「智能体涌现奖」2026 第一期参赛作品（作品 ID：`6ebc96914f8eab`，赛道：AI 生活好帮手）。

## 核心能力（事前防坑 · 事中体检 · 事后追回）
1. **阿宝对话工作台**：一句话触发「订阅保镖 Skill」，透明展示工具调用链与人工二次确认安全门禁。
2. **事中体检（100% 端侧离线，0 字节上传）**：支持模拟阿宝近 90 天只读账单同步、真实支付宝/微信 CSV 拖拽解析（自动兼容 UTF-8 / GBK）、扣费短信粘贴解析（支持人民币与美元汇率折算）及 30+ 常见订阅自查，产出红/黄/绿止血处方与 3 年止损可视化。
3. **事前拦截**：浏览会员购买页时唤起阿宝扫雷，3 秒算清首年真实总成本、隐形涨价倍率与已有订阅重叠冲突。
4. **事后追回**：自动匹配《网络交易监督管理办法》第 18 条生成追回胜率评估、支付宝投诉举证包、商户客服话术与支付宝/微信/iOS 精确关闭免密步骤。

## 本地运行与验证
```bash
# 1. 运行核心引擎单元测试（6 套全覆盖）
node tests/test_engine.mjs

# 2. 本地预览 Web 应用
python3 -m http.server 8765 --directory app
# 浏览器打开 http://127.0.0.1:8765

# 3. 重新生成 16:9 封面图、4 张解说图、1080p 演示 MP4 与上传 ZIP 包
python3 scripts/build_submission_assets.py
```

## 提报物料清单
- 应用上传包：`dist/earn-alipay-subguard.zip`
- 16:9 封面图：`submission/cover_16x9.png`
- 1080p 演示视频：`submission/demo_video.mp4`
- 正文插图：`submission/fig1_abao_copilot.png`、`fig2_bill_audit.png`、`fig3_precheck_guard.png`、`fig4_auto_appeal.png`
- 提报正文全文：`submission/SUBMISSION_TEXT.md`
- 配套阿宝技能包：`skills/alipay-subguard/SKILL.md`、`skills/alipay-subguard/tools-schema.json`
