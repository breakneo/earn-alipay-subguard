import {
  MERCHANT_CATALOG,
  PERSONA_PRESETS,
  analyzePrePurchaseOffer,
  auditSubscriptions,
  buildAppealPackage,
  handleAbaoChat,
  parseBillText,
} from "./engine.js";
import {
  LLM_PROVIDERS,
  clearLlmConfig,
  enhanceAbaoChatWithLLM,
  extractOfferWithLLM,
  isLlmActive,
  loadLlmConfig,
  saveLlmConfig,
  testLlmConnection,
} from "./llm.js";

const state = {
  presetKey: "worker",
  sourceLabel: "打工人（模拟）",
  items: structuredClone(PERSONA_PRESETS.worker.items),
  filter: "all",
  selectedAppealId: PERSONA_PRESETS.worker.items[5].id,
  appealExecuted: false,
  precheckData: null,
  llmConfig: loadLlmConfig(),
};

const SHORT_LABELS = { worker: "打工人（模拟）", elder: "长辈（模拟）", developer: "工具达人（模拟）" };
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function showToast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove("show"), 2300);
}

async function copyText(txt, tip = "已复制") {
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

function updateEngineStatusUi() {
  const active = isLlmActive(state.llmConfig);
  const pill = $("#engineStatusPill");
  if (!pill) return;
  if (active) {
    const pName = LLM_PROVIDERS[state.llmConfig.provider]?.name?.split("（")[0] || "大模型";
    pill.textContent = `🤖 ${pName}增强`;
    pill.className = "pill pill-blue";
  } else {
    pill.textContent = "🔒 本地离线";
    pill.className = "pill pill-green";
  }
}

function loadPreset(key, toastMsg) {
  const p = PERSONA_PRESETS[key];
  if (!p) return;
  state.presetKey = key;
  state.sourceLabel = SHORT_LABELS[key] || p.label;
  state.items = structuredClone(p.items);
  state.appealExecuted = false;
  $$("#presetBar .chip-btn").forEach((b) => b.classList.toggle("active", b.dataset.preset === key));
  const audit = auditSubscriptions(state.items);
  state.selectedAppealId = (audit.items.find((x) => x.level === "red") || audit.items[0])?.id || "";
  renderAll();
  if (toastMsg) showToast(toastMsg);
}

/* ---------- 查账单 ---------- */
const COLORS = ["#1677ff", "#dc2626", "#f59e0b", "#059669", "#7c3aed", "#0ea5e9", "#64748b"];

function renderDonut(byCategory, totalYearly) {
  if (!byCategory.length || totalYearly <= 0) {
    $("#donutChart").innerHTML = `<div style="text-align:center;padding-top:64px;color:var(--muted);">暂无数据</div>`;
    $("#categoryLegend").innerHTML = "";
    return;
  }
  const r = 62, cx = 85, cy = 85, circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = byCategory.map((c, i) => {
    const len = (c.yearly / totalYearly) * circ;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLORS[i % COLORS.length]}" stroke-width="20" stroke-dasharray="${len} ${circ - len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" />`;
    offset += len;
    return seg;
  });
  $("#donutChart").innerHTML = `
    <svg viewBox="0 0 170 170" width="170" height="170">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="20"/>
      ${arcs.join("")}
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="11.5" fill="#64748b">年总支出</text>
      <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="17" font-weight="800" fill="#0f172a">¥${Math.round(totalYearly)}</text>
    </svg>`;

  $("#categoryLegend").innerHTML = byCategory
    .map(
      (c, i) => `
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:12.5px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="width:9px;height:9px;border-radius:3px;background:${COLORS[i % COLORS.length]};display:inline-block;"></span>
          <span>${c.category}</span>
        </div>
        <div><strong>¥${c.yearly}</strong> <span style="color:var(--muted);">${c.pct}%</span></div>
      </div>`
    )
    .join("");
}

function renderAudit() {
  const audit = auditSubscriptions(state.items);
  const { stats } = audit;

  $("#sourceBadge").textContent = state.sourceLabel;
  $("#topSummaryStrip").innerHTML = `
    <span>今年预计可省 <strong>¥${stats.potentialSaveYearly}</strong></span>
    <span>红灯刺客 <strong class="red-num">${stats.redCount} 项</strong></span>
    <span>3 年防流失 <strong>¥${stats.threeYearDrain}</strong></span>`;

  $("#kpiGrid").innerHTML = `
    <div class="card kpi" style="--bar:#1677ff;">
      <div class="kpi-label">年总支出（${stats.count}项）</div>
      <div class="kpi-val">¥${stats.totalYearly}</div>
    </div>
    <div class="card kpi" style="--bar:#dc2626;--val-c:#dc2626;">
      <div class="kpi-label">红灯刺客</div>
      <div class="kpi-val">${stats.redCount} 项</div>
    </div>
    <div class="card kpi" style="--bar:#059669;--val-c:#059669;">
      <div class="kpi-label">预计年可省</div>
      <div class="kpi-val">¥${stats.potentialSaveYearly}</div>
    </div>`;

  renderDonut(audit.byCategory, stats.totalYearly);

  const filtered = state.filter === "all" ? audit.items : audit.items.filter((x) => x.level === state.filter);
  const lvlColor = { red: "#dc2626", yellow: "#d97706", green: "#059669" };
  const lvlPill = { red: "pill-red", yellow: "pill-amber", green: "pill-green" };
  const lvlTag = { red: "止血", yellow: "降级", green: "保留" };
  const cycleTxt = { monthly: "月", yearly: "年", quarterly: "季", weekly: "周" };

  $("#subList").innerHTML = filtered
    .map(
      (x) => `
      <div class="sub-card" style="--lvl:${lvlColor[x.level]};">
        <div class="sub-main">
          <div class="sub-title-row">
            <span class="sub-name">${x.merchant}</span>
            <span class="pill ${lvlPill[x.level]}">${lvlTag[x.level]}</span>
            <span class="pill pill-slate">${x.channel}</span>
          </div>
          <div class="sub-flags">
            ${x.flags.slice(0, 2).map((f) => `<span class="pill ${x.level === "red" ? "pill-red" : "pill-amber"}">${f}</span>`).join("")}
            ${!x.flags.length ? `<span class="pill pill-green">高频刚需</span>` : ""}
          </div>
        </div>
        <div class="sub-right">
          <div class="sub-price">¥${x.amount}<span style="font-size:12px;font-weight:500;color:var(--muted);">/${cycleTxt[x.cycle] || "月"}</span></div>
          <div class="sub-btns">
            <button class="btn btn-sm" data-cancel-id="${x.id}">关免密</button>
            ${x.level !== "green" ? `<button class="btn btn-primary btn-sm" data-appeal-id="${x.id}">去申诉</button>` : ""}
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
      <strong style="font-size:15.5px;">✂️ 关闭「${item.merchant}」免密</strong>
      <button class="btn btn-sm" id="btnCloseCancel">关闭</button>
    </div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:9px 11px;font-size:12.5px;color:#1e3a8a;margin-bottom:10px;">
      ⚡ ${g.abaoShortcut}
    </div>
    <ol style="padding-left:18px;font-size:13.5px;display:flex;flex-direction:column;gap:7px;margin-bottom:12px;">
      ${g.steps.map((s) => `<li>${s}</li>`).join("")}
    </ol>
    <div style="text-align:right;">
      <button class="btn btn-soft btn-sm" id="btnCopyCancel">复制发给家人</button>
    </div>`;
  $("#cancelModal").classList.add("open");
  $("#btnCloseCancel").onclick = () => $("#cancelModal").classList.remove("open");
  $("#btnCopyCancel").onclick = () => copyText(`【${item.merchant}关闭步骤】\n${g.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`, "已复制关闭步骤");
}

/* ---------- 买前扫雷 ---------- */
function renderPrecheck(res, llmTrap = "") {
  state.precheckData = res;
  const colors = {
    red: { vb: "#fecaca", vbg: "#fef2f2", tc: "#b91c1c", pill: "pill-red" },
    yellow: { vb: "#fde68a", vbg: "#fffbeb", tc: "#b45309", pill: "pill-amber" },
    green: { vb: "#a7f3d0", vbg: "#ecfdf5", tc: "#047857", pill: "pill-green" },
  }[res.verdictLevel];

  $("#precheckResult").innerHTML = `
    <div class="sec-title" style="margin-bottom:10px;"><span>扫雷结论</span><span class="pill ${colors.pill}">${res.category}</span></div>
    <div class="verdict-box" style="--vb:${colors.vb};--vbg:${colors.vbg};">
      <div style="font-size:12px;color:${colors.tc};font-weight:700;">${res.serviceName}</div>
      <div style="font-size:20px;font-weight:800;color:${colors.tc};">${res.verdict}</div>
    </div>
    <div class="grid-3" style="margin-bottom:12px;">
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:10px;">
        <div style="font-size:11.5px;color:var(--muted);">首期价</div>
        <div style="font-size:19px;font-weight:800;">¥${res.firstPrice}</div>
      </div>
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:10px;">
        <div style="font-size:11.5px;color:var(--muted);">首年真实花</div>
        <div style="font-size:19px;font-weight:800;color:#dc2626;">¥${res.year1Cost}</div>
      </div>
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:10px;">
        <div style="font-size:11.5px;color:var(--muted);">涨价倍率</div>
        <div style="font-size:19px;font-weight:800;color:#d97706;">${res.jumpMultiple}倍</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:12px;">
      ${llmTrap ? `<div style="padding:9px 11px;border-radius:9px;background:#eff6ff;font-size:12.5px;color:#1e3a8a;">🤖 ${llmTrap}</div>` : ""}
      ${
        res.warnings.length
          ? res.warnings.map((w) => `<div style="padding:9px 11px;border-radius:9px;background:#fef2f2;font-size:12.5px;color:#991b1b;">⚠️ ${w}</div>`).join("")
          : `<div style="padding:9px 11px;border-radius:9px;background:#ecfdf5;font-size:12.5px;color:#065f46;">✓ 价格透明，无重复订阅</div>`
      }
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
      <span style="font-size:12.5px;color:var(--ink-2);flex:1;">${res.advice}</span>
      <button class="btn btn-soft btn-sm" id="btnSetAbaoRemind">⏰ 到期前提醒</button>
    </div>`;

  $("#btnSetAbaoRemind").onclick = () => showToast(`已设「${res.serviceName}」到期前 48 小时提醒（演示）`);
}

/* ---------- 申诉退费 ---------- */
function renderAppeal() {
  const audit = auditSubscriptions(state.items);
  const sel = $("#appealSelect");
  sel.innerHTML = audit.items
    .map((x) => `<option value="${x.id}" ${x.id === state.selectedAppealId ? "selected" : ""}>${x.level === "red" ? "🔴" : x.level === "yellow" ? "🟡" : "🟢"} ${x.merchant} · ¥${x.amount}（${x.channel}）</option>`)
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
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:10px;background:#ecfdf5;border:1px solid #a7f3d0;margin-bottom:10px;font-size:13px;">
      <strong style="color:#065f46;">退费匹配度：${pkg.probabilityLabel}</strong>
      <strong style="color:#047857;">¥${pkg.amount}</strong>
    </div>
    ${pkg.abaoWorkflowSteps
      .map((s) => {
        const isDone = !s.requiresConfirm || state.appealExecuted;
        return `
        <div class="wf-step ${isDone ? "done" : ""}">
          <div class="wf-num">${isDone ? "✓" : s.step}</div>
          <div style="flex:1;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <strong style="font-size:13px;">${s.title}</strong>
            <span class="pill ${isDone ? "pill-green" : "pill-amber"}">${s.toolLabel || s.tool}</span>
          </div>
        </div>`;
      })
      .join("")}`;

  $("#btnConfirmAppealExec").textContent = state.appealExecuted
    ? "✅ 已确认：模拟完成解约免密 + 提交申诉"
    : "✅ 本人二次确认：解约免密并提交申诉（演示）";

  $("#appealScriptsPanel").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <strong style="font-size:13.5px;">支付宝账单投诉模板</strong>
      <button class="btn btn-primary btn-sm" id="btnCopyAlipayScript">复制模板</button>
    </div>
    <div class="script-box">${pkg.alipayComplaintScript}</div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <strong style="font-size:13.5px;">商户客服退费话术</strong>
      <button class="btn btn-soft btn-sm" id="btnCopyCsScript">复制话术</button>
    </div>
    <div class="script-box" style="background:#1e293b;">${pkg.merchantCsScript}</div>

    <div style="font-size:12.5px;color:var(--ink-2);background:#f8fafc;padding:9px 11px;border-radius:9px;border:1px solid var(--border);">
      <strong>✂️ ${pkg.cancelGuide.channel}：</strong>${pkg.cancelGuide.steps.join(" → ")}
    </div>
    <div class="compliance-note">注：模板与要素评估仅供自助维权参考，不构成法律意见。</div>`;

  $("#btnCopyAlipayScript").onclick = () => copyText(pkg.alipayComplaintScript, "已复制支付宝投诉模板");
  $("#btnCopyCsScript").onclick = () => copyText(pkg.merchantCsScript, "已复制客服退费话术");
}

/* ---------- 问阿宝对话 ---------- */
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
    const traceHtml = meta.toolTrace?.length
      ? `<details class="trace-details">
          <summary>✓ 已完成 ${meta.toolTrace.length} 步检查（点击展开）</summary>
          <div class="trace-list">
            ${meta.toolTrace.map((t) => `<div class="trace-row"><strong>${t.label || t.tool}</strong>：${t.summary}</div>`).join("")}
          </div>
        </details>`
      : "";
    const jumpLabels = { audit: "查看账单清单 →", precheck: "去买前扫雷 →", appeal: "去一键申诉 →" };
    const jumpHtml = meta.suggestedTab
      ? `<div style="margin-top:8px;"><button class="btn btn-soft btn-sm" data-chat-jump="${meta.suggestedTab}">${jumpLabels[meta.suggestedTab] || "查看详情 →"}</button></div>`
      : "";
    const engineTag = meta.engineTag || "本地引擎";
    div.innerHTML = `<div class="msg-head"><strong>🤖 阿宝 · 订阅保镖</strong><span>${engineTag}</span></div><div>${formatted}</div>${traceHtml}${jumpHtml}`;
  }
  stream.appendChild(div);
  stream.scrollTop = stream.scrollHeight;
  div.querySelectorAll("[data-chat-jump]").forEach((b) => {
    b.onclick = () => switchTab(b.dataset.chatJump);
  });
  return div;
}

async function sendAbaoQuery(text) {
  const q = text.trim();
  if (!q) return;
  appendChatMessage("user", q);
  const res = handleAbaoChat(q, state.items);

  if (res.parsedItems?.length) {
    state.items = [...res.parsedItems, ...state.items];
    state.sourceLabel = `短信解析（+${res.parsedItems.length}项）`;
    renderAll();
  } else if (res.switchPreset) {
    loadPreset(res.switchPreset);
  }
  if (res.intent === "precheck" && res.payload) {
    renderPrecheck(res.payload);
  }

  if (isLlmActive(state.llmConfig)) {
    const pendingEl = appendChatMessage("bot", "阿宝正在思考中...", { engineTag: "大模型" });
    try {
      const auditSummary = auditSubscriptions(state.items);
      const llmReply = await enhanceAbaoChatWithLLM(state.llmConfig, q, auditSummary, res);
      pendingEl.remove();
      appendChatMessage("bot", llmReply, {
        ...res,
        engineTag: state.llmConfig.model || "大模型",
        toolTrace: [...(res.toolTrace || []), { label: "大模型解读", status: "ok", summary: "已结合本地账单生成建议" }],
      });
      return;
    } catch (err) {
      pendingEl.remove();
      appendChatMessage("bot", `${res.reply}\n（大模型暂不可用，已自动切回本地引擎）`, { ...res, engineTag: "本地兜底" });
      return;
    }
  }

  appendChatMessage("bot", res.reply, { ...res, engineTag: "本地离线" });
}

function exportFamilyReport() {
  const audit = auditSubscriptions(state.items);
  const lines = [
    `【家庭订阅止血单 · ${state.sourceLabel}】`,
    `年总支出 ¥${audit.stats.totalYearly} | 红灯刺客 ${audit.stats.redCount} 项 | 年可省 ¥${audit.stats.potentialSaveYearly}`,
    ...audit.items.map((x, i) => `${i + 1}. [${x.level === "red" ? "止血" : x.level === "yellow" ? "降级" : "保留"}] ${x.merchant} ¥${x.amount}/${x.cycle}（${x.channel}）`),
  ].join("\n");
  copyText(lines, "已复制《家庭订阅止血单》");
}

function openLlmModal() {
  const cfg = state.llmConfig;
  $("#llmProvider").innerHTML = Object.values(LLM_PROVIDERS)
    .map((p) => `<option value="${p.id}" ${p.id === cfg.provider ? "selected" : ""}>${p.name}</option>`)
    .join("");
  $("#llmEnabled").checked = Boolean(cfg.enabled);
  $("#llmEndpoint").value = cfg.endpoint || "";
  $("#llmModel").value = cfg.model || "";
  $("#llmApiKey").value = cfg.apiKey || "";
  $("#llmTestStatus").textContent = LLM_PROVIDERS[cfg.provider]?.note || "";
  $("#llmModal").classList.add("open");
}

function renderCatalog() {
  $("#catalogGrid").innerHTML = MERCHANT_CATALOG.map(
    (m, i) => `<label class="cat-item"><input type="checkbox" value="${i}" /><span>${m.key} ¥${m.typicalMonthly}</span></label>`
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
  updateEngineStatusUi();

  appendChatMessage("bot", "点上方快捷按钮，或直接发我促销文案、扣费短信，帮你查自动续费刺客。", { engineTag: "本地离线" });

  $$(".tab-btn").forEach((b) => (b.onclick = () => switchTab(b.dataset.tab)));
  $$("[data-preset]").forEach((b) => {
    b.onclick = () => loadPreset(b.dataset.preset, `已切换：${SHORT_LABELS[b.dataset.preset]}`);
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

  $("#btnToggleSms").onclick = () => {
    const d = $("#smsDrawer");
    d.style.display = d.style.display === "none" ? "block" : "none";
  };
  $("#btnFillSmsDemo").onclick = () => {
    $("#billTextInput").value = [
      "【支付宝】2026-11-24 通过免密自动扣款向扫描全能王支付30.00元（首月1元，未使用）",
      "【微信支付】2026-11-23 向QQ音乐绿钻自动续费15.00元",
      "海外AI工具自动续费 $20.00/月",
    ].join("\n");
  };
  $("#btnParseBill").onclick = () => {
    const newItems = parseBillText($("#billTextInput").value);
    if (!newItems.length) return showToast("未识别到带金额的短信行");
    state.items = [...newItems, ...state.items];
    state.sourceLabel = `短信解析（+${newItems.length}项）`;
    renderAll();
    showToast(`已解析新增 ${newItems.length} 项`);
  };

  $("#csvFileInput").onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    let txt = new TextDecoder("utf-8").decode(buf);
    if (txt.includes("\uFFFD")) {
      try { txt = new TextDecoder("gbk").decode(buf); } catch {}
    }
    const newItems = parseBillText(txt);
    if (!newItems.length) return showToast("表格中未匹配到含金额行");
    state.items = newItems;
    state.sourceLabel = file.name;
    renderAll();
    showToast(`已识别 ${newItems.length} 项周期订阅`);
  };

  $("#btnToggleCatalog").onclick = () => {
    const d = $("#catalogDrawer");
    d.style.display = d.style.display === "none" ? "block" : "none";
  };
  $("#btnApplyCatalog").onclick = () => {
    const checked = $$("#catalogGrid input:checked").map((el) => MERCHANT_CATALOG[Number(el.value)]);
    if (!checked.length) return showToast("请先勾选至少 1 项");
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
      orderNo: `自查-${i + 1}`,
      note: "",
    }));
    state.items = [...added, ...state.items];
    state.sourceLabel = `自查（+${added.length}项）`;
    $("#catalogDrawer").style.display = "none";
    renderAll();
    showToast(`已加入 ${added.length} 项`);
  };

  $$("#promoPresets .promo-btn").forEach((b) => {
    b.onclick = () => {
      $("#preName").value = b.dataset.name;
      $("#preFirst").value = b.dataset.first;
      $("#preRenew").value = b.dataset.renew;
      $("#preCycle").value = b.dataset.cycle;
      $("#prePromoText").value = b.dataset.text;
      const res = analyzePrePurchaseOffer(
        { serviceName: b.dataset.name, firstPrice: Number(b.dataset.first), renewPrice: Number(b.dataset.renew), cycle: b.dataset.cycle, promoText: b.dataset.text, manualOverride: true },
        auditSubscriptions(state.items).items
      );
      renderPrecheck(res);
    };
  });

  $("#btnRunPrecheck").onclick = async () => {
    const promoText = $("#prePromoText").value.trim();
    const hasManual = $("#preFirst").value !== "" && $("#preRenew").value !== "";
    let llmTrap = "";
    let extra = {};

    if (!hasManual && promoText.length >= 12 && isLlmActive(state.llmConfig)) {
      showToast("大模型拆解条款中...");
      try {
        const extracted = await extractOfferWithLLM(state.llmConfig, promoText);
        if (extracted.serviceName) $("#preName").value = extracted.serviceName;
        if (extracted.firstPrice != null) $("#preFirst").value = extracted.firstPrice;
        if (extracted.renewPrice != null) $("#preRenew").value = extracted.renewPrice;
        if (extracted.cycle) $("#preCycle").value = extracted.cycle;
        llmTrap = extracted.hiddenTrap || "";
        extra = { serviceName: extracted.serviceName, firstPrice: Number(extracted.firstPrice), renewPrice: Number(extracted.renewPrice), cycle: extracted.cycle, manualOverride: true };
      } catch {}
    }

    const res = analyzePrePurchaseOffer(
      {
        serviceName: extra.serviceName ?? $("#preName").value,
        firstPrice: extra.firstPrice ?? ($("#preFirst").value === "" ? NaN : Number($("#preFirst").value)),
        renewPrice: extra.renewPrice ?? ($("#preRenew").value === "" ? NaN : Number($("#preRenew").value)),
        cycle: extra.cycle ?? $("#preCycle").value,
        promoText,
        manualOverride: extra.manualOverride ?? hasManual,
      },
      auditSubscriptions(state.items).items
    );
    renderPrecheck(res, llmTrap);
    showToast("扫雷完成");
  };

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
    showToast("已确认：模拟解约免密并提交申诉");
  };

  $("#btnOpenAbaoSync").onclick = () => $("#syncModal").classList.add("open");
  $("#btnCloseModal").onclick = () => $("#syncModal").classList.remove("open");
  $$("[data-sync-preset]").forEach((b) => {
    b.onclick = () => {
      loadPreset(b.dataset.syncPreset, `已载入：${SHORT_LABELS[b.dataset.syncPreset]}`);
      $("#syncModal").classList.remove("open");
      switchTab("audit");
    };
  });
  $("#btnExportReport").onclick = exportFamilyReport;

  $("#btnOpenLlmModal").onclick = openLlmModal;
  $("#btnCloseLlmModal").onclick = () => $("#llmModal").classList.remove("open");
  $("#llmProvider").onchange = (e) => {
    const p = LLM_PROVIDERS[e.target.value];
    if (p) {
      $("#llmEndpoint").value = p.endpoint;
      $("#llmModel").value = p.model;
      $("#llmTestStatus").textContent = p.note;
    }
  };
  $("#btnSaveLlm").onclick = () => {
    state.llmConfig = {
      enabled: $("#llmEnabled").checked,
      provider: $("#llmProvider").value,
      endpoint: $("#llmEndpoint").value.trim(),
      model: $("#llmModel").value.trim(),
      apiKey: $("#llmApiKey").value.trim(),
    };
    saveLlmConfig(state.llmConfig);
    updateEngineStatusUi();
    $("#llmModal").classList.remove("open");
    showToast(isLlmActive(state.llmConfig) ? "已开启大模型增强" : "已保存（本地离线）");
  };
  $("#btnClearLlm").onclick = () => {
    clearLlmConfig();
    state.llmConfig = loadLlmConfig();
    $("#llmEnabled").checked = false;
    $("#llmApiKey").value = "";
    $("#llmTestStatus").textContent = "已清空本地密钥";
    updateEngineStatusUi();
  };
  $("#btnTestLlm").onclick = async () => {
    const tempCfg = {
      enabled: true,
      provider: $("#llmProvider").value,
      endpoint: $("#llmEndpoint").value.trim(),
      model: $("#llmModel").value.trim(),
      apiKey: $("#llmApiKey").value.trim(),
    };
    $("#llmTestStatus").textContent = "测试中...";
    try {
      const reply = await testLlmConnection(tempCfg);
      $("#llmTestStatus").textContent = `✅ ${reply}`;
    } catch (err) {
      $("#llmTestStatus").textContent = `❌ ${err.message}`;
    }
  };

  const demoTab = new URLSearchParams(location.search).get("demo");
  if (demoTab && ["abao", "audit", "precheck", "appeal"].includes(demoTab)) {
    document.documentElement.classList.add("demo-mode");
    if (demoTab === "abao") {
      sendAbaoQuery("阿宝，帮我拉取近 90 天支付宝账单，查查有哪些自动续费刺客");
    }
    switchTab(demoTab);
    void document.body.offsetHeight;
  }
}

init();
