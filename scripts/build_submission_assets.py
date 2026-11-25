"""生成支付宝「智能体涌现奖」全套提报物料：
1. submission/cover_16x9.png (1920x1080 16:9 精装封面，≤5MB)
2. submission/fig1_abao_copilot.png / fig2_bill_audit.png / fig3_precheck_appeal.png (真实应用截图 + 精装边框)
3. submission/demo_video.mp4 (36秒 1080p 高清演示视频，ffmpeg 合成，≤100MB)
4. dist/earn-alipay-subguard.zip (可直接上传的纯静态 Web 应用 ZIP 包)
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
    .p-k{font-size:15px;font-weight:800;color:#60a5fa;letter-spacing:.06em;margin-bottom:8px;}
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
        <div class="tag-right">Alipay Abao × 订阅保镖 Skill · 100% 端侧隐私零上传</div>
      </div>
      <div class="mid">
        <div>
          <div class="h1">订阅刺客<span>体检仪</span><br/>帮全家人把被偷扣的钱追回来</div>
          <div class="desc">深度融合支付宝「阿宝」全生命周期闭环：买前扫雷拆穿首月 1 元涨价陷阱，日常授权体检近 90 天周期扣款，误扣后一键生成法规举证包并经二次确认自动解约追回。</div>
          <div class="pillars">
            <div class="pillar"><div class="p-k">STEP 01 · 事前拦截</div><div class="p-t">浏览即唤阿宝扫雷</div><div class="p-s">算清首年总价、涨价倍率与已有订阅重叠</div></div>
            <div class="pillar"><div class="p-k">STEP 02 · 事中体检</div><div class="p-t">阿宝同步 + 离线解析</div><div class="p-s">红黄绿三色止血处方，护航打工人与银发长辈</div></div>
            <div class="pillar"><div class="p-k">STEP 03 · 事后追回</div><div class="p-t">二次确认解约申诉</div><div class="p-s">匹配《网交办法》第18条，一键复制投诉追回</div></div>
          </div>
        </div>
        <div class="mock">
          <div class="m-head">
            <div class="m-title"><div class="logo">保</div> 阿宝订阅体检实时报告</div>
            <span class="badge">🔒 0 字节上传云端</span>
          </div>
          <div class="kpi-row">
            <div class="kpi"><div class="kpi-l">预计年度可立省</div><div class="kpi-v" style="color:#059669;">¥1,678.2</div></div>
            <div class="kpi"><div class="kpi-l">3 年累计防流失</div><div class="kpi-v" style="color:#dc2626;">¥5,034.6</div></div>
          </div>
          <div class="row" style="--c:#dc2626;background:#fef2f2;"><div><div class="r-n">爱奇艺连续包月 · 首月¥1→¥25 刺客</div><div class="r-s">支付宝免密 · 暴涨 25 倍 + 影音重复订阅</div></div><div class="r-p">立刻止血</div></div>
          <div class="row" style="--c:#dc2626;background:#fef2f2;"><div><div class="r-n">醒图VIP包年 · ¥0.01试用转扣¥168</div><div class="r-s">近30天零使用 · 预估申诉追回胜率 95%</div></div><div class="r-p">一键追回</div></div>
          <div class="row" style="--c:#dc2626;background:#fef2f2;"><div><div class="r-n">极速手机清理大师 · 长辈误触高危</div><div class="r-s">广告弹窗免密 · 系统自带功能即可替代</div></div><div class="r-p">家庭守护</div></div>
          <div class="row" style="--c:#059669;background:#ecfdf5;margin-bottom:0;"><div><div class="r-n">喜马拉雅 / 美团神会员 · 高频刚需</div><div class="r-s">近30天高频使用 · 保留不误伤</div></div><div class="r-p">健康保留</div></div>
        </div>
      </div>
      <div class="foot">
        <div>作品名称：生活好帮手+订阅刺客体检仪（作品 ID：6ebc96914f8eab）</div>
        <div>配套标准 Agent Skill（SKILL.md + tools-schema.json）· 开箱即用纯静态应用</div>
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


def create_demo_video(slides: list[Path], out_mp4: Path) -> None:
    """用 ffmpeg 将 5 张 1080p 高清帧合成为带平滑交叉淡入淡出过渡的 32 秒 1080p MP4 视频。"""
    # 每张停留 6.5s，交叉转场 0.6s
    inputs = []
    for p in slides:
        inputs += ["-loop", "1", "-t", "6.8", "-i", str(p)]
    # 构建 xfade 滤镜链
    n = len(slides)
    filters = [f"[{i}:v]scale=1920:1080,fps=30,format=yuv420p[v{i}]" for i in range(n)]
    cur = "v0"
    offset = 6.2
    for i in range(1, n):
        nxt = f"xf{i}"
        filters.append(f"[{cur}][v{i}]xfade=transition=fade:duration=0.6:offset={offset:.1f}[{nxt}]")
        cur = nxt
        offset += 6.2
    cmd = [
        "ffmpeg", "-y",
        *inputs,
        "-filter_complex", ";".join(filters),
        "-map", f"[{cur}]",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "22",
        "-movflags", "+faststart",
        str(out_mp4),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    assert out_mp4.exists() and out_mp4.stat().st_size > 100_000


def package_zip(app_dir: Path, out_zip: Path) -> None:
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(app_dir.rglob("*")):
            if p.is_file() and not p.name.startswith("."):
                zf.write(p, p.relative_to(app_dir))
        # 同时把配套 Skill 契约打进 zip/skill 目录供评委审阅
        skill_dir = ROOT / "skills" / "alipay-subguard"
        for p in sorted(skill_dir.rglob("*")):
            if p.is_file():
                zf.write(p, Path("skills/alipay-subguard") / p.relative_to(skill_dir))


def main() -> None:
    SUB_DIR.mkdir(parents=True, exist_ok=True)
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    # 1. 封面图 (1920x1080)
    cover_png = SUB_DIR / "cover_16x9.png"
    render_html_shot(build_cover_html(), cover_png, 1920, 1080)
    print("Created:", cover_png, f"({cover_png.stat().st_size/1024:.0f} KB)")

    # 2. 启动本地静态服务并抓取 4 个核心界面的真实运行截图（通过 URL hash 自动切 Tab 演示）
    # 为截图支持 URL ?demo=abao|audit|precheck|appeal，先临时直接渲染页面或用独立小脚本触发
    httpd, port = start_static_server(APP_DIR)
    base = f"http://127.0.0.1:{port}/index.html"
    tmp_dir = Path(tempfile.mkdtemp())

    raw_shots = {}
    for tab in ["abao", "audit", "precheck", "appeal"]:
        raw_p = tmp_dir / f"raw_{tab}.png"
        chrome_shot(f"{base}?demo={tab}", raw_p, width=1440, height=900, scale=1, budget=2500)
        raw_shots[tab] = raw_p

    httpd.shutdown()

    # 3. 合成 4 张精装解说图（前 3 张直接用作正文插图，全部 5 张连同封面合成 32s 演示 MP4）
    fig1 = SUB_DIR / "fig1_abao_copilot.png"
    render_html_shot(
        build_framed_slide_html(
            "SCENE 01 / 阿宝对话工作台",
            "一句话唤起「阿宝 × 订阅保镖 Skill」，透明展示工具调用与二次确认红线",
            "支持自由中文口语输入，自动路由至事前扫雷、事中账单体检、长辈守护与事后追回",
            f"file://{raw_shots['abao']}",
            ["一句话查近90天自动续费", "实时可追溯 Skill 工具链", "资金/解约操作强制二次确认"],
        ),
        fig1,
    )

    fig2 = SUB_DIR / "fig2_bill_audit.png"
    render_html_shot(
        build_framed_slide_html(
            "SCENE 02 / 事中账单体检与红黄绿止血处方",
            "阿宝授权同步 + 本地离线 CSV/短信解析：一眼揪出阶梯涨价、重复订阅与长辈误触",
            "100% 浏览器端离线运算，自动识别人民币与美元账单，精准量化年度可立省与 3 年止损金额",
            f"file://{raw_shots['audit']}",
            ["支持支付宝/微信 CSV 与短信", "3 套脱敏人群账单 1 秒体验", "自动区分刚需保留与高危止血"],
        ),
        fig2,
    )

    fig3 = SUB_DIR / "fig3_precheck_guard.png"
    render_html_shot(
        build_framed_slide_html(
            "SCENE 03 / 事前拦截：浏览会员页唤起阿宝扫雷",
            "在点击“同意开通免密”前 3 秒拆穿首月 1 元涨价倍率与已有订阅重叠",
            "对比首期价与首年真实总成本，结合当前账单自动预警重复付费，支持设置到期前 48h 阿宝提醒",
            f"file://{raw_shots['precheck']}",
            ["精准识别 28 倍阶梯涨价陷阱", "自动碰撞已有同类订阅重叠", "一键设次期到期前 48h 提醒"],
        ),
        fig3,
    )

    fig4 = SUB_DIR / "fig4_auto_appeal.png"
    render_html_shot(
        build_framed_slide_html(
            "SCENE 04 / 事后追回：阿宝 + 订阅保镖自动申诉闭环",
            "依据《网络交易监督管理办法》第 18 条自动生成举证包，经用户确认解约免密并追回误扣",
            "内置支付宝/微信/iOS 精确关闭免密路径、商户客服话术与支付宝账单投诉单，一键复制即用",
            f"file://{raw_shots['appeal']}",
            ["预估追回胜率与合规法规依据", "4 步自动申诉编排 + 二次确认", "支付宝/微信/苹果全渠道解约指引"],
        ),
        fig4,
    )

    # 4. 合成 1080p 演示视频
    out_mp4 = SUB_DIR / "demo_video.mp4"
    create_demo_video([cover_png, fig1, fig2, fig3, fig4], out_mp4)
    print("Created:", out_mp4, f"({out_mp4.stat().st_size/(1024*1024):.2f} MB)")

    # 5. 打包可直传 ZIP
    out_zip = DIST_DIR / "earn-alipay-subguard.zip"
    package_zip(APP_DIR, out_zip)
    print("Created:", out_zip, f"({out_zip.stat().st_size/1024:.1f} KB)")


if __name__ == "__main__":
    main()
