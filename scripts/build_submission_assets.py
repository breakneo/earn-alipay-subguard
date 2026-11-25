"""生成支付宝「智能体涌现奖」全中文视觉物料与部署包：
1. submission/cover_16x9.png (1920x1080 全中文 16:9 封面，≤5MB)
2. submission/fig1_abao_copilot.png ~ fig4_auto_appeal.png (全中文实景界面精装插图)
3. dist/earn-alipay-subguard.zip (纯静态开箱即用应用压缩包)
（注：演示视频由 scripts/record_live_demo.mjs 真实驱动浏览器动态交互录制，绝非静态 PPT 拼图）
"""

from __future__ import annotations

import http.server
import socketserver
import subprocess
import tempfile
import threading
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP_DIR = ROOT / "app"
SUB_DIR = ROOT / "submission"
DIST_DIR = ROOT / "dist"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def start_static_server(directory: Path):
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(directory), **kwargs)

        def log_message(self, format, *args):
            pass

    httpd = socketserver.TCPServer(("127.0.0.1", 0), QuietHandler)
    port = httpd.server_address[1]
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd, port


def chrome_shot(url: str, out_path: Path, width: int = 1920, height: int = 1080, scale: int = 1, budget: int = 2500) -> None:
    cmd = [
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--force-device-scale-factor={scale}",
        f"--window-size={width},{height}",
        f"--virtual-time-budget={budget}",
        f"--screenshot={out_path}",
        url,
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    assert out_path.exists() and out_path.stat().st_size > 10_000


def render_html_shot(html_str: str, out_path: Path, width: int = 1920, height: int = 1080) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html_str)
        tmp = Path(f.name)
    try:
        chrome_shot(f"file://{tmp}", out_path, width=width, height=height, scale=1, budget=1500)
    finally:
        tmp.unlink(missing_ok=True)


def build_cover_html() -> str:
    return """<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/><style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{width:1920px;height:1080px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","SF Pro Display","Hiragino Sans GB",sans-serif;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums;}
    .bg{width:1920px;height:1080px;padding:74px 90px;display:flex;flex-direction:column;justify-content:space-between;
      background:
        radial-gradient(circle at 86% 18%, rgba(22,119,255,0.22), transparent 42%),
        radial-gradient(circle at 14% 88%, rgba(16,185,129,0.18), transparent 40%),
        linear-gradient(135deg, #07132b 0%, #0d224a 52%, #0f172a 100%);
      color:#f8fafc;}
    .top{display:flex;justify-content:space-between;align-items:center;}
    .eyebrow{display:inline-flex;align-items:center;gap:12px;padding:10px 22px;border-radius:999px;background:rgba(22,119,255,0.22);border:1px solid rgba(147,197,253,0.45);color:#bfdbfe;font-size:20px;font-weight:700;letter-spacing:.04em;}
    .tag-right{font-size:20px;color:#94a3b8;font-weight:600;}
    .mid{display:grid;grid-template-columns:1.15fr 0.85fr;gap:54px;align-items:center;}
    .h1{font-size:74px;font-weight:900;line-height:1.12;letter-spacing:-0.025em;margin-bottom:24px;}
    .h1 span{background:linear-gradient(90deg,#60a5fa,#34d399);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
    .desc{font-size:26px;color:#cbd5e1;line-height:1.55;margin-bottom:36px;max-width:920px;}
    .pillars{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
    .pillar{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:20px;padding:22px 24px;}
    .p-k{font-size:16px;font-weight:800;color:#60a5fa;margin-bottom:8px;}
    .p-t{font-size:24px;font-weight:800;margin-bottom:8px;}
    .p-s{font-size:17px;color:#94a3b8;line-height:1.45;}
    .mock{background:#ffffff;color:#0f172a;border-radius:28px;padding:34px;box-shadow:0 32px 80px rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.2);}
    .m-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:18px;border-bottom:1.5px solid #e2e8f0;margin-bottom:22px;}
    .m-title{font-size:24px;font-weight:800;display:flex;align-items:center;gap:12px;}
    .logo{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#1677ff,#00b4ff);color:#fff;display:grid;place-items:center;font-weight:900;font-size:22px;}
    .badge{padding:6px 14px;border-radius:999px;font-size:15px;font-weight:700;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;}
    .kpi-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
    .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:18px 20px;}
    .kpi-l{font-size:15px;color:#64748b;margin-bottom:6px;font-weight:600;}
    .kpi-v{font-size:38px;font-weight:900;}
    .row{display:flex;justify-content:space-between;align-items:center;padding:15px 18px;border-radius:14px;margin-bottom:12px;border:1px solid #e2e8f0;border-left:5px solid var(--c);}
    .r-n{font-size:19px;font-weight:800;}
    .r-s{font-size:14px;color:#64748b;margin-top:3px;}
    .r-p{font-size:22px;font-weight:900;color:var(--c);}
    .foot{display:flex;justify-content:space-between;align-items:center;padding-top:20px;border-top:1px solid rgba(255,255,255,0.14);font-size:18px;color:#94a3b8;}
    </style></head><body><div class="bg">
      <div class="top">
        <div class="eyebrow">支付宝 · 智能体涌现奖 2026 &nbsp;|&nbsp; 生活好帮手赛道</div>
        <div class="tag-right">支付宝「阿宝」× 订阅保镖技能 · 端侧隐私零上传</div>
      </div>
      <div class="mid">
        <div>
          <div class="h1">订阅刺客<span>体检仪</span><br/>帮全家人把被偷扣的钱追回来</div>
          <div class="desc">深度融合支付宝「阿宝」全生命周期闭环：买前扫雷拆穿首月 1 元涨价陷阱，日常一键体检近 90 天周期扣款，误扣后一键生成合规申诉参考模板并经本人二次确认解约止血。</div>
          <div class="pillars">
            <div class="pillar"><div class="p-k">第一步 · 事前拦截</div><div class="p-t">浏览即唤阿宝扫雷</div><div class="p-s">算清首年总价、涨价倍率与已有订阅重叠</div></div>
            <div class="pillar"><div class="p-k">第二步 · 事中体检</div><div class="p-t">阿宝同步 + 离线解析</div><div class="p-s">红黄绿三色止血处方，护航打工人与银发长辈</div></div>
            <div class="pillar"><div class="p-k">第三步 · 事后追回</div><div class="p-t">二次确认解约申诉</div><div class="p-s">对照法规整理参考模板，一键复制自助追回</div></div>
          </div>
        </div>
        <div class="mock">
          <div class="m-head">
            <div class="m-title"><div class="logo">保</div> 阿宝订阅体检模拟报告</div>
            <span class="badge">🔒 0 字节上传云端</span>
          </div>
          <div class="kpi-row">
            <div class="kpi"><div class="kpi-l">预计年度可立省</div><div class="kpi-v" style="color:#059669;">¥1,678.2</div></div>
            <div class="kpi"><div class="kpi-l">3 年累计防流失</div><div class="kpi-v" style="color:#dc2626;">¥5,034.6</div></div>
          </div>
          <div class="row" style="--c:#dc2626;background:#fef2f2;"><div><div class="r-n">爱奇艺连续包月 · 首月¥1→¥25 刺客</div><div class="r-s">支付宝免密 · 暴涨 25 倍 + 影音重复订阅</div></div><div class="r-p">立刻止血</div></div>
          <div class="row" style="--c:#dc2626;background:#fef2f2;"><div><div class="r-n">醒图VIP包年 · ¥0.01试用转扣¥168</div><div class="r-s">近30天零使用 · 命中 3 项常见退费要素</div></div><div class="r-p">整理申诉</div></div>
          <div class="row" style="--c:#dc2626;background:#fef2f2;"><div><div class="r-n">极速手机清理大师 · 长辈误触高危</div><div class="r-s">广告弹窗免密 · 系统自带功能即可替代</div></div><div class="r-p">家庭守护</div></div>
          <div class="row" style="--c:#059669;background:#ecfdf5;margin-bottom:0;"><div><div class="r-n">喜马拉雅 / 美团神会员 · 高频刚需</div><div class="r-s">近30天高频使用 · 保留不误伤</div></div><div class="r-p">健康保留</div></div>
        </div>
      </div>
      <div class="foot">
        <div>作品名称：生活好帮手+订阅刺客体检仪（作品编号：6ebc96914f8eab）</div>
        <div>端侧规则精算 + 可选真实大模型双引擎 · 电脑与手机竖屏开箱即用</div>
      </div>
    </div></body></html>"""


def build_framed_slide_html(badge: str, title: str, subtitle: str, img_uri: str, callouts: list[str]) -> str:
    chips = "".join(f'<div class="chip">{c}</div>' for c in callouts)
    return f"""<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/><style>
    *{{box-sizing:border-box;margin:0;padding:0}}
    html,body{{width:1920px;height:1080px;overflow:hidden;background:#f4f6fa;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","SF Pro Display",sans-serif;}}
    .wrap{{width:1920px;height:1080px;padding:34px 54px 28px;display:flex;flex-direction:column;justify-content:space-between;background:radial-gradient(circle at 92% 4%,rgba(22,119,255,.08),transparent 34%),#f4f6fa;}}
    .hd{{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px;}}
    .ey{{display:inline-block;padding:5px 14px;border-radius:999px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;font-size:15px;font-weight:800;margin-bottom:8px;}}
    .tt{{font-size:34px;font-weight:900;letter-spacing:-0.02em;}}
    .st{{font-size:18px;color:#475569;margin-top:4px;}}
    .shot-frame{{flex:1;background:#fff;border:1.5px solid #cbd5e1;border-radius:20px;overflow:hidden;box-shadow:0 16px 40px rgba(15,23,42,.10);display:flex;align-items:center;justify-content:center;}}
    .shot-frame img{{width:100%;height:100%;object-fit:cover;object-position:top center;}}
    .ft{{display:flex;gap:14px;margin-top:16px;}}
    .chip{{flex:1;background:#fff;border:1px solid #e2e8f0;border-left:4px solid #1677ff;border-radius:12px;padding:12px 16px;font-size:16px;font-weight:700;color:#1e293b;}}
    </style></head><body><div class="wrap">
      <div class="hd">
        <div><div class="ey">{badge}</div><div class="tt">{title}</div><div class="st">{subtitle}</div></div>
        <div style="font-size:16px;color:#64748b;font-weight:700;">生活好帮手+订阅刺客体检仪 · 支付宝阿宝生态</div>
      </div>
      <div class="shot-frame"><img src="{img_uri}" /></div>
      <div class="ft">{chips}</div>
    </div></body></html>"""


def package_zip(app_dir: Path, out_zip: Path) -> None:
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(app_dir.rglob("*")):
            if p.is_file() and not p.name.startswith("."):
                zf.write(p, p.relative_to(app_dir))
        skill_dir = ROOT / "skills" / "alipay-subguard"
        for p in sorted(skill_dir.rglob("*")):
            if p.is_file():
                zf.write(p, Path("skills/alipay-subguard") / p.relative_to(skill_dir))


def main() -> None:
    SUB_DIR.mkdir(parents=True, exist_ok=True)
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    cover_png = SUB_DIR / "cover_16x9.png"
    render_html_shot(build_cover_html(), cover_png, 1920, 1080)
    print("Created:", cover_png, f"({cover_png.stat().st_size/1024:.0f} KB)")

    httpd, port = start_static_server(APP_DIR)
    base = f"http://127.0.0.1:{port}/index.html"
    tmp_dir = Path(tempfile.mkdtemp())

    raw_shots = {}
    for tab in ["abao", "audit", "precheck", "appeal"]:
        raw_p = tmp_dir / f"raw_{tab}.png"
        chrome_shot(f"{base}?demo={tab}", raw_p, width=1440, height=900, scale=1, budget=2500)
        raw_shots[tab] = raw_p

    # 同时抓一张 390x844 手机竖屏实景图，用于验收集成效果
    mobile_shot = SUB_DIR / "mobile_preview.png"
    chrome_shot(base, mobile_shot, width=390, height=844, scale=2, budget=2500)
    print("Created:", mobile_shot, f"({mobile_shot.stat().st_size/1024:.0f} KB)")

    httpd.shutdown()

    fig1 = SUB_DIR / "fig1_abao_copilot.png"
    render_html_shot(
        build_framed_slide_html(
            "场景一 / 阿宝对话工作台",
            "一句话唤起「阿宝 × 订阅保镖」，透明展示执行步骤与人工二次确认安全锁",
            "支持自由口语、直接粘贴扣费短信，并可一键开启通义千问 / 豆包 / 深度求索大模型增强",
            f"file://{raw_shots['abao']}",
            ["一句话查近90天自动续费", "支持端侧精算与大模型双引擎", "资金与解约操作强制本人确认"],
        ),
        fig1,
    )

    fig2 = SUB_DIR / "fig2_bill_audit.png"
    render_html_shot(
        build_framed_slide_html(
            "场景二 / 事中账单体检与三色止血处方",
            "阿宝同步演示 + 本地离线账单与短信解析：一眼揪出暴涨刺客、重复订阅与长辈误触",
            "100% 浏览器端侧离线运算，自动识别人民币与美元账单，量化年度预计可省与 3 年止损金额",
            f"file://{raw_shots['audit']}",
            ["支持支付宝/微信 CSV 与短信", "3 套模拟人群账单 1 秒体验", "自动区分刚需保留与高危止血"],
        ),
        fig2,
    )

    fig3 = SUB_DIR / "fig3_precheck_guard.png"
    render_html_shot(
        build_framed_slide_html(
            "场景三 / 事前拦截：浏览会员页唤起阿宝扫雷",
            "在点击“同意开通免密”前 3 秒拆穿首月 1 元涨价倍率与已有订阅重叠",
            "对比首期价与首年真实总成本，结合在途账单预警重复付费，支持设置到期前 48 小时提醒",
            f"file://{raw_shots['precheck']}",
            ["精准识别 28 倍阶梯涨价陷阱", "自动碰撞已有同类订阅重叠", "一键设次期到期前 48 小时提醒"],
        ),
        fig3,
    )

    fig4 = SUB_DIR / "fig4_auto_appeal.png"
    render_html_shot(
        build_framed_slide_html(
            "场景四 / 事后追回：合规申诉模板与人工二次确认解约",
            "对照《网络交易监督管理办法》第十八条整理参考材料，经本人确认解约免密并自助维权",
            "内置支付宝、微信、苹果全渠道精确关闭免密路径、客服沟通话术与账单投诉参考模板，一键复制即用",
            f"file://{raw_shots['appeal']}",
            ["退费要素评估与合规提示", "4 步申诉编排 + 人工二次确认", "支付宝/微信/苹果全渠道解约指引"],
        ),
        fig4,
    )

    out_zip = DIST_DIR / "earn-alipay-subguard.zip"
    package_zip(APP_DIR, out_zip)
    print("Created:", out_zip, f"({out_zip.stat().st_size/1024:.1f} KB)")


if __name__ == "__main__":
    main()
