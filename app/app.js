import {
  MERCHANT_CATALOG,
  PERSONA_PRESETS,
  analyzePrePurchaseOffer,
  auditSubscriptions,
  buildAppealPackage,
  handleAbaoChat,
  parseBillText,
} from "./engine.js";

const state = {
  presetKey: "worker",
  sourceLabel: PERSONA_PRESETS.worker.label,
  items: structuredClone(PERSONA_PRESETS.worker.items),
  filter: "all",
  selectedAppealId: PERSONA_PRESETS.worker.items[5].id, // 默认选中知乎盐选昨晚误扣
  appealExecuted: false,
  precheckData: null,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function showToast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove("show"), 2400);
}

async function copyText(txt, tip = "已复制到剪贴板") {
  try {
    await navigator.clipboard.writeText(txt);
    showToast(tip);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    showToast(tip);
  }
}

function switchTab(tabId) {
  $$(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tabId));
  $$(".panel").forEach((p) => p.classList.toggle("active", p.id === `panel-${tabId}`));
}

function loadPreset(key, toastMsg) {
  const p = PERSONA_PRESETS[key];
  if (!p) return;
  state.presetKey = key;
  state.sourceLabel = p.label;
  state.items = structuredClone(p.items);
  state.appealExecuted = false;
  const audit = auditSubscriptions(state.items);
  state.selectedAppealId = (audit.items.find((x) => x.level === "red") || audit.items[0])?.id || "";
  renderAll();
  if (toastMsg) showToast(toastMsg);
}

/* ---------- Render Audit Dashboard ---------- */
const COLORS = ["#1677ff", "#dc2626", "#f59e0b", "#059669", "#7c3aed", "#0ea5e9", "#64748b"];

function renderDonut(byCategory, totalYearly) {
  if (!byCategory.length || totalYearly <= 0) {
    $("#donutChart").innerHTML = `<div style="text-align:center;padding-top:70px;color:var(--muted);">暂无数据</div>`;
    $("#categoryLegend").innerHTML = "";
    return;
  }
  const r = 68, cx = 92, cy = 92, circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = byCategory.map((c, i) => {
    const len = (c.yearly / totalYearly) * circ;
    const col = COLORS[i % COLORS.length];
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="22" stroke-dasharray="${len} ${circ - len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" />`;
    offset += len;
    return seg;
  });
  $("#donutChart").innerHTML = `
    <svg viewBox="0 0 184 184" width="184" height="184">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="22"/>
      ${arcs.join("")}
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="12" fill="#64748b">年度总支出</text>
      <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="18" font-weight="800" fill="#0f172a">¥${Math.round(totalYearly)}</text>
    </svg>`;

  $("#categoryLegend").innerHTML = byCategory
    .map(
      (c, i) => `
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="width:10px;height:10px;border-radius:3px;background:${COLORS[i % COLORS.length]};display:inline-block;"></span>
          <span>${c.category}</span>
        </div>
        <div><strong>¥${c.yearly}</strong> <span style="color:var(--muted);">(${c.pct}%)</span></div>
      </div>`
    )
    .join("");
}

function renderAudit() {
  const audit = auditSubscriptions(state.items);
  const { stats } = audit;

  $("#sourceBadge").textContent = `当前：${state.sourceLabel}`;
  $("#abaoLiveSummary").innerHTML = `
    <div style="font-size:12.5px;color:var(--muted);margin-bottom:8px;">当前账单体检快照（${state.sourceLabel}）</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div><div style="font-size:12px;color:var(--muted);">年度可立省</div><div style="font-size:22px;font-weight:800;color:var(--red);">¥${stats.potentialSaveYearly}</div></div>
      <div><div style="font-size:12px;color:var(--muted);">刺客分布</div><div style="font-size:15px;font-weight:800;padding-top:4px;">🔴 ${stats.redCount} &nbsp;🟡 ${stats.yellowCount} &nbsp;🟢 ${stats.greenCount}</div></div>
    </div>`;

  $("#kpiGrid").innerHTML = `
    <div class="card kpi" style="--bar:#1677ff;">
      <div class="kpi-label">年度订阅总支出（${stats.count} 项）</div>
      <div class="kpi-val">¥${stats.totalYearly}</div>
      <div class="kpi-foot">折合月均 ¥${stats.totalMonthly} / 月</div>
    </div>
    <div class="card kpi" style="--bar:#dc2626;--val-c:#dc2626;">
      <div class="kpi-label">建议立刻止血（红灯刺客）</div>
      <div class="kpi-val">${stats.redCount} 项</div>
      <div class="kpi-foot">含首月涨价 / 沉睡零使用 / 误触免密</div>
    </div>
    <div class="card kpi" style="--bar:#059669;--val-c:#059669;">
      <div class="kpi-label">预计年度可立省金额</div>
      <div class="kpi-val">¥${stats.potentialSaveYearly}</div>
      <div class="kpi-foot">退订红灯项 + 优化黄灯降级平替</div>
    </div>
    <div class="card kpi" style="--bar:#d97706;--val-c:#b45309;">
      <div class="kpi-label">3 年累计止损（防温水煮青蛙）</div>
      <div class="kpi-val">¥${stats.threeYearDrain}</div>
      <div class="kpi-foot">不关免密 3 年将静默流失的真金白银</div>
    </div>`;

  renderDonut(audit.byCategory, stats.totalYearly);

  const filtered = state.filter === "all" ? audit.items : audit.items.filter((x) => x.level === state.filter);
  const lvlColor = { red: "#dc2626", yellow: "#d97706", green: "#059669" };
  const lvlPill = { red: "pill-red", yellow: "pill-amber", green: "pill-green" };
  const cycleTxt = { monthly: "月", yearly: "年", quarterly: "季", weekly: "周" };

  $("#subList").innerHTML = filtered
    .map(
      (x) => `
      <div class="sub-card" style="--lvl:${lvlColor[x.level]};">
        <div class="sub-main">
          <div class="sub-title-row">
            <span class="sub-name">${x.merchant}</span>
            <span class="pill ${lvlPill[x.level]}">${x.actionLabel}</span>
            <span class="pill pill-slate">${x.channel} · ${x.category}</span>
          </div>
          <div class="sub-flags">
            ${x.flags.map((f) => `<span class="pill ${x.level === "red" ? "pill-red" : "pill-amber"}">⚠️ ${f}</span>`).join("")}
            ${!x.flags.length ? `<span class="pill pill-green">✓ 高频刚需，无明显涨价异常</span>` : ""}
          </div>
          <div class="sub-note"><strong>体检建议：</strong>${x.altAdvice}（最近扣款：${x.lastDate}${x.note ? ` · ${x.note}` : ""}）</div>
        </div>
        <div class="sub-right">
          <div class="sub-price">¥${x.amount}<span style="font-size:13px;font-weight:500;color:var(--muted);">/${cycleTxt[x.cycle] || "月"}</span></div>
          <div class="sub-year">折合年支出 ¥${x.yearly}${x.saveYearly > 0 ? ` · 可省 <strong style="color:#059669;">¥${x.saveYearly}</strong>` : ""}</div>
          <div class="sub-btns">
            <button class="btn btn-sm" data-cancel-id="${x.id}">关免密路径</button>
            ${x.level !== "green" ? `<button class="btn btn-primary btn-sm" data-appeal-id="${x.id}">一键申诉追回</button>` : ""}
          </div>
        </div>
      </div>`
    )
    .join("");

  $$("[data-cancel-id]").forEach((btn) => {
    btn.onclick = () => openCancelModal(audit.items.find((i) => i.id === btn.dataset.cancelId));
  });
  $$("[data-appeal-id]").forEach((btn) => {
    btn.onclick = () => {
      state.selectedAppealId = btn.dataset.appealId;
      state.appealExecuted = false;
      renderAppeal();
      switchTab("appeal");
    };
  });
}

function openCancelModal(item) {
  if (!item) return;
  const g = item.cancelGuide;
  $("#cancelModalBody").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <strong style="font-size:16px;">✂️ 「${item.merchant}」关闭免密指南</strong>
      <button class="btn btn-sm" id="btnCloseCancel">关闭</button>
    </div>
    <div class="pill pill-blue" style="margin-bottom:10px;">渠道：${g.channel}</div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 12px;font-size:13px;color:#1e3a8a;margin-bottom:12px;">
      <strong>⚡ 阿宝直达口令：</strong>${g.abaoShortcut}
    </div>
    <ol style="padding-left:20px;font-size:13.8px;display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
      ${g.steps.map((s) => `<li>${s}</li>`).join("")}
    </ol>
    <div style="display:flex;justify-content:flex-end;gap:8px;">
      <button class="btn btn-soft btn-sm" id="btnCopyCancel">复制关闭步骤发给家人</button>
    </div>`;
  $("#cancelModal").classList.add("open");
  $("#btnCloseCancel").onclick = () => $("#cancelModal").classList.remove("open");
  $("#btnCopyCancel").onclick = () => copyText(`【${item.merchant}关闭免密步骤】\n${g.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`, "已复制关闭步骤");
}

/* ---------- Render Pre-Purchase Interceptor ---------- */
function renderPrecheck(res) {
  state.precheckData = res;
  const colors = {
    red: { vb: "#fecaca", vbg: "#fef2f2", tc: "#b91c1c", pill: "pill-red" },
    yellow: { vb: "#fde68a", vbg: "#fffbeb", tc: "#b45309", pill: "pill-amber" },
    green: { vb: "#a7f3d0", vbg: "#ecfdf5", tc: "#047857", pill: "pill-green" },
  }[res.verdictLevel];

  $("#precheckResult").innerHTML = `
    <div class="sec-title"><span>🛡️ 阿宝买前扫雷报告</span><span class="pill ${colors.pill}">${res.category}</span></div>
    <div class="sec-sub">在点击“同意并开通免密”前，把隐形账本算到明面上。</div>
    <div class="verdict-box" style="--vb:${colors.vb};--vbg:${colors.vbg};">
      <div style="font-size:12px;font-weight:700;color:${colors.tc};margin-bottom:4px;">阿宝买前裁决 · ${res.serviceName}</div>
      <div style="font-size:21px;font-weight:800;color:${colors.tc};">${res.verdict}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:12px;">
        <div style="font-size:12px;color:var(--muted);">表面首期价</div>
        <div style="font-size:20px;font-weight:800;">¥${res.firstPrice}</div>
      </div>
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:12px;">
        <div style="font-size:12px;color:var(--muted);">首年真实总成本</div>
        <div style="font-size:20px;font-weight:800;color:#dc2626;">¥${res.year1Cost}</div>
      </div>
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:12px;">
        <div style="font-size:12px;color:var(--muted);">次期涨价倍率</div>
        <div style="font-size:20px;font-weight:800;color:#d97706;">${res.jumpMultiple}x</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
      ${
        res.warnings.length
          ? res.warnings.map((w) => `<div style="padding:10px 12px;border-radius:10px;background:#fef2f2;border:1px solid #fecaca;font-size:13px;color:#991b1b;">⚠️ ${w}</div>`).join("")
          : `<div style="padding:10px 12px;border-radius:10px;background:#ecfdf5;border:1px solid #a7f3d0;font-size:13px;color:#065f46;">✓ 未发现剧烈涨价或同类重复订阅冲突</div>`
      }
    </div>
    <div style="padding:12px 14px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe;font-size:13.2px;color:#1e3a8a;margin-bottom:12px;">
      <strong>阿宝行动建议：</strong>${res.advice}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
      <span style="font-size:12px;color:var(--muted);">${res.abaoReminder}</span>
      <button class="btn btn-soft btn-sm" id="btnSetAbaoRemind">⏰ 模拟设“到期前48h阿宝提醒”</button>
    </div>`;

  $("#btnSetAbaoRemind").onclick = () => showToast(`已为「${res.serviceName}」创建阿宝次期到期前 48 小时强提醒（沙盒）`);
}

/* ---------- Render Appeal Orchestrator ---------- */
function renderAppeal() {
  const audit = auditSubscriptions(state.items);
  const sel = $("#appealSelect");
  sel.innerHTML = audit.items
    .map((x) => `<option value="${x.id}" ${x.id === state.selectedAppealId ? "selected" : ""}>${x.level === "red" ? "🔴" : x.level === "yellow" ? "🟡" : "🟢"} ${x.merchant}（¥${x.amount} · ${x.lastDate} · ${x.channel}）</option>`)
    .join("");

  const target = audit.items.find((x) => x.id === state.selectedAppealId) || audit.items[0];
  if (!target) return;

  const pkg = buildAppealPackage(target, {
    within7Days: $("#chk7d").checked,
    unusedAfterRenew: $("#chkUnused").checked,
    noAdvanceNotice: $("#chkNoNotice").checked,
    isElderAccidental: $("#chkElder").checked,
  });

  $("#appealWorkflow").innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:12px;background:#ecfdf5;border:1px solid #a7f3d0;margin-bottom:12px;">
      <div>
        <div style="font-size:12px;color:#047857;font-weight:700;">退费追回胜率评估</div>
        <div style="font-size:20px;font-weight:800;color:#065f46;">${pkg.probabilityLabel}</div>
      </div>
      <div style="font-size:12px;color:#047857;text-align:right;">目标追回金额：<strong>¥${pkg.amount}</strong><br/>命中 ${pkg.grounds.length} 条合规退费依据</div>
    </div>
    ${pkg.abaoWorkflowSteps
      .map((s) => {
        const isDone = !s.requiresConfirm || state.appealExecuted;
        return `
        <div class="wf-step ${isDone ? "done" : ""}">
          <div class="wf-num">${isDone ? "✓" : s.step}</div>
          <div style="flex:1;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
              <strong style="font-size:13.5px;">${s.title}</strong>
              <span class="pill ${isDone ? "pill-green" : "pill-amber"} mono">${s.tool}</span>
            </div>
            <div style="font-size:12.5px;color:var(--muted);margin-top:3px;">${s.detail}</div>
          </div>
        </div>`;
      })
      .join("")}`;

  $("#btnConfirmAppealExec").textContent = state.appealExecuted
    ? "✅ 已授权完成解约免密 + 提交申诉（阿宝已开启退款进度跟踪）"
    : "✅ 我已核对证据，授权阿宝执行解约 + 提交申诉（沙盒演示）";

  $("#appealScriptsPanel").innerHTML = `
    <div class="sec-title"><span>📝 一键可用的举证申诉材料与解约步骤</span></div>
    <div class="sec-sub">即使现在直接在现实中维权，也可以一键复制发给支付宝账单投诉或商户客服。</div>

    <div style="display:flex;justify-content:space-between;align-items:center;">
      <strong style="font-size:13.5px;">1. 支付宝账单投诉 / 12315 举证申诉单（含法规依据）</strong>
      <button class="btn btn-primary btn-sm" id="btnCopyAlipayScript">一键复制投诉单</button>
    </div>
    <div class="script-box">${pkg.alipayComplaintScript}</div>

    <div style="display:flex;justify-content:space-between;align-items:center;">
      <strong style="font-size:13.5px;">2. 商户在线客服极速退费话术</strong>
      <button class="btn btn-soft btn-sm" id="btnCopyCsScript">复制客服话术</button>
    </div>
    <div class="script-box" style="background:#1e293b;">${pkg.merchantCsScript}</div>

    <div style="padding:12px 14px;border-radius:12px;background:#f8fafc;border:1px solid var(--border);font-size:13px;">
      <strong style="display:block;margin-bottom:6px;">✂️ ${pkg.cancelGuide.channel} 关闭路径</strong>
      <ol style="padding-left:18px;display:flex;flex-direction:column;gap:4px;color:var(--ink-2);">
        ${pkg.cancelGuide.steps.map((s) => `<li>${s}</li>`).join("")}
      </ol>
    </div>`;

  $("#btnCopyAlipayScript").onclick = () => copyText(pkg.alipayComplaintScript, "已复制支付宝投诉举证单");
  $("#btnCopyCsScript").onclick = () => copyText(pkg.merchantCsScript, "已复制商户客服退费话术");
}

/* ---------- Abao Chat ---------- */
function appendChatMessage(role, contentHtml, meta = {}) {
  const stream = $("#chatStream");
  const div = document.createElement("div");
  div.className = `msg ${role === "user" ? "msg-user" : "msg-bot"}`;
  if (role === "user") {
    div.textContent = contentHtml;
  } else {
    const formatted = contentHtml
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
    const traceHtml = meta.toolTrace
      ? `<div class="trace-box">
          <div style="font-weight:700;color:#475569;margin-bottom:4px;">🔧 阿宝 × 订阅保镖 Skill 工具调用轨迹（<span class="mono">${meta.skillBadge}</span>）</div>
          ${meta.toolTrace
            .map(
              (t) => `<div class="trace-row">
                <span class="trace-dot" style="background:${t.status === "ok" ? "#059669" : "#d97706"};"></span>
                <span class="mono" style="font-weight:700;">${t.tool}</span>
                <span>→ ${t.summary}</span>
              </div>`
            )
            .join("")}
        </div>`
      : "";
    const jumpHtml = meta.suggestedTab
      ? `<div style="margin-top:9px;"><button class="btn btn-soft btn-sm" data-chat-jump="${meta.suggestedTab}">打开对应操作台查看详情 →</button></div>`
      : "";
    div.innerHTML = `<div class="msg-head"><strong>🤖 支付宝阿宝 · 订阅保镖</strong><span>本地离线推理</span></div><div>${formatted}</div>${traceHtml}${jumpHtml}`;
  }
  stream.appendChild(div);
  stream.scrollTop = stream.scrollHeight;
  div.querySelectorAll("[data-chat-jump]").forEach((b) => {
    b.onclick = () => switchTab(b.dataset.chatJump);
  });
}

function sendAbaoQuery(text) {
  const q = text.trim();
  if (!q) return;
  appendChatMessage("user", q);
  const res = handleAbaoChat(q, state.items);
  if (res.switchPreset) {
    loadPreset(res.switchPreset);
  }
  if (res.intent === "precheck" && res.payload) {
    renderPrecheck(res.payload);
  }
  appendChatMessage("bot", res.reply, res);
}

/* ---------- Export Family Checklist ---------- */
function exportFamilyReport() {
  const audit = auditSubscriptions(state.items);
  const lines = [
    `=== 家庭订阅刺客止血体检单（${state.sourceLabel}）===`,
    `生成时间：${new Date().toLocaleString("zh-CN")}`,
    `年度总支出：¥${audit.stats.totalYearly} | 红灯刺客：${audit.stats.redCount} 项 | 年度可立省：¥${audit.stats.potentialSaveYearly}（3年止损 ¥${audit.stats.threeYearDrain}）`,
    "",
    ...audit.items.map(
      (x, idx) =>
        `${idx + 1}. [${x.actionLabel}] ${x.merchant} | ¥${x.amount}/${x.cycle}（年¥${x.yearly}）| 渠道：${x.channel}\n   风险：${x.flags.join("；") || "无"}\n   建议：${x.altAdvice}`
    ),
  ].join("\n");
  copyText(lines, "已复制《家庭订阅止血体检单》，可直接粘贴发给家人");
}

/* ---------- Init & Events ---------- */
function renderCatalog() {
  $("#catalogGrid").innerHTML = MERCHANT_CATALOG.map(
    (m, i) => `
    <label class="cat-item">
      <input type="checkbox" value="${i}" />
      <span>${m.key} <small style="color:var(--muted);">¥${m.typicalMonthly}/月</small></span>
    </label>`
  ).join("");
}

function renderAll() {
  renderAudit();
  renderAppeal();
  const initialPre = analyzePrePurchaseOffer(
    { serviceName: "芒果TV连续包月", firstPrice: 1, renewPrice: 28, cycle: "monthly", promoText: "芒果TV首月1元体验，次月起自动连续包月28元" },
    auditSubscriptions(state.items).items
  );
  renderPrecheck(initialPre);
}

function init() {
  renderCatalog();
  renderAll();

  // 欢迎消息
  appendChatMessage(
    "bot",
    "你好！我是接入了**「订阅保镖 Skill」**的支付宝阿宝。点击上方快捷指令，或直接输入你的账单/会员促销条款，我会立刻帮你完成 **事前扫雷 / 事中体检 / 事后申诉追回**。",
    {
      skillBadge: "alipay-subguard.ready",
      toolTrace: [
        { tool: "subguard.privacy_guard", status: "ok", summary: "本地离线解析已就绪（0 字节上传云端）" },
        { tool: "abao.sandbox.init", status: "ok", summary: `已加载「${state.sourceLabel}」脱敏账单（${state.items.length} 项周期扣款）` },
      ],
    }
  );

  $$(".tab-btn").forEach((b) => (b.onclick = () => switchTab(b.dataset.tab)));
  $$("[data-jump]").forEach((b) => (b.onclick = () => switchTab(b.dataset.jump)));
  $$("[data-preset]").forEach((b) => {
    b.onclick = () => loadPreset(b.dataset.preset, `已切换至「${PERSONA_PRESETS[b.dataset.preset].label}」`);
  });

  $("#btnSendChat").onclick = () => {
    sendAbaoQuery($("#chatInput").value);
    $("#chatInput").value = "";
  };
  $("#chatInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendAbaoQuery($("#chatInput").value);
      $("#chatInput").value = "";
    }
  });
  $$("#quickPrompts [data-q]").forEach((b) => (b.onclick = () => sendAbaoQuery(b.dataset.q)));

  $$("#filterBar [data-filter]").forEach((b) => {
    b.onclick = () => {
      state.filter = b.dataset.filter;
      $$("#filterBar [data-filter]").forEach((x) => x.classList.toggle("btn-primary", x === b));
      renderAudit();
    };
  });

  $("#btnFillSmsDemo").onclick = () => {
    $("#billTextInput").value = [
      "【支付宝】2026-11-24 通过免密自动扣款向扫描全能王支付30.00元（首月1元，未使用）",
      "【微信支付】2026-11-23 向QQ音乐绿钻自动续费15.00元",
      "Cursor Pro 自动续费 $20.00/月",
    ].join("\n");
  };

  $("#btnParseBill").onclick = () => {
    const newItems = parseBillText($("#billTextInput").value);
    if (!newItems.length) {
      showToast("未识别到带金额的账单/短信行，请检查输入格式");
      return;
    }
    state.items = [...newItems, ...state.items];
    state.sourceLabel = `离线解析 + ${newItems.length} 条新明细`;
    renderAll();
    showToast(`本地离线解析成功，已新增 ${newItems.length} 项并刷新体检报告`);
  };

  $("#csvFileInput").onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    let txt = new TextDecoder("utf-8").decode(buf);
    if (txt.includes("\uFFFD")) {
      try {
        txt = new TextDecoder("gbk").decode(buf);
      } catch {}
    }
    const newItems = parseBillText(txt);
    if (!newItems.length) {
      showToast("CSV 中未匹配到含金额的支出行，可尝试粘贴文本明细");
      return;
    }
    state.items = newItems;
    state.sourceLabel = `本地 CSV（${file.name}）`;
    renderAll();
    showToast(`已纯本地解析 ${file.name}，识别出 ${newItems.length} 项周期订阅`);
  };

  $("#btnToggleCatalog").onclick = () => {
    const d = $("#catalogDrawer");
    d.style.display = d.style.display === "none" ? "block" : "none";
  };

  $("#btnApplyCatalog").onclick = () => {
    const checked = $$("#catalogGrid input:checked").map((el) => MERCHANT_CATALOG[Number(el.value)]);
    if (!checked.length) {
      showToast("请先勾选至少 1 个订阅项");
      return;
    }
    const added = checked.map((m, i) => ({
      id: `cat-${Date.now()}-${i}`,
      merchant: m.key,
      category: m.category,
      channel: m.channel,
      amount: m.typicalMonthly,
      prevAmount: m.typicalMonthly,
      cycle: "monthly",
      lastDate: "2026-11-24",
      usedDays30: 2,
      orderNo: `CHECK-${i + 1}`,
      note: "来自30+常见订阅自查清单",
    }));
    state.items = [...added, ...state.items];
    state.sourceLabel = `自定义自查（+${added.length} 项）`;
    renderAll();
    showToast(`已加入 ${added.length} 项常见订阅并更新体检`);
  };

  // Precheck
  $$("#promoPresets .promo-btn").forEach((b) => {
    b.onclick = () => {
      $("#preName").value = b.dataset.name;
      $("#preFirst").value = b.dataset.first;
      $("#preRenew").value = b.dataset.renew;
      $("#preCycle").value = b.dataset.cycle;
      $("#prePromoText").value = b.dataset.text;
      const res = analyzePrePurchaseOffer(
        {
          serviceName: b.dataset.name,
          firstPrice: Number(b.dataset.first),
          renewPrice: Number(b.dataset.renew),
          cycle: b.dataset.cycle,
          promoText: b.dataset.text,
          manualOverride: true,
        },
        auditSubscriptions(state.items).items
      );
      renderPrecheck(res);
    };
  });

  $("#btnRunPrecheck").onclick = () => {
    const hasManual = $("#preFirst").value !== "" && $("#preRenew").value !== "";
    const res = analyzePrePurchaseOffer(
      {
        serviceName: $("#preName").value,
        firstPrice: $("#preFirst").value === "" ? NaN : Number($("#preFirst").value),
        renewPrice: $("#preRenew").value === "" ? NaN : Number($("#preRenew").value),
        cycle: $("#preCycle").value,
        promoText: $("#prePromoText").value,
        manualOverride: hasManual,
      },
      auditSubscriptions(state.items).items
    );
    renderPrecheck(res);
    showToast("阿宝买前扫雷已完成");
  };

  // Appeal
  $("#appealSelect").onchange = (e) => {
    state.selectedAppealId = e.target.value;
    state.appealExecuted = false;
    renderAppeal();
  };
  ["#chk7d", "#chkUnused", "#chkNoNotice", "#chkElder"].forEach((id) => {
    $(id).onchange = () => renderAppeal();
  });
  $("#btnConfirmAppealExec").onclick = () => {
    state.appealExecuted = true;
    renderAppeal();
    showToast("二次确认完成！阿宝已解约免密并提交申诉单（沙盒演示）");
  };

  // Modals & Export
  $("#btnOpenAbaoSync").onclick = () => $("#syncModal").classList.add("open");
  $("#btnCloseModal").onclick = () => $("#syncModal").classList.remove("open");
  $$("[data-sync-preset]").forEach((b) => {
    b.onclick = () => {
      loadPreset(b.dataset.syncPreset, `阿宝已只读同步「${PERSONA_PRESETS[b.dataset.syncPreset].label}」`);
      $("#syncModal").classList.remove("open");
      switchTab("audit");
    };
  });
  $("#btnExportReport").onclick = exportFamilyReport;

  // 支持通过 ?demo=abao|audit|precheck|appeal 直接展示对应场景（便于演示与自动化截图）
  const demoTab = new URLSearchParams(location.search).get("demo");
  if (demoTab && ["abao", "audit", "precheck", "appeal"].includes(demoTab)) {
    document.documentElement.classList.add("demo-mode");
    const hero = $(".hero");
    if (hero) hero.style.display = "none";
    if (demoTab === "abao") {
      sendAbaoQuery("阿宝，帮我拉取近 90 天支付宝账单，查查有哪些自动续费刺客");
    }
    switchTab(demoTab);
    void document.body.offsetHeight;
  }
}

init();
