import {
  MERCHANT_CATALOG,
  SAMPLE_BILL_ITEMS,
  analyzePrePurchaseOffer,
  auditSubscriptions,
  buildAppealPackage,
  buildReminderICS,
  handleAbaoChat,
  matchMerchantMeta,
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

const ITEMS_KEY = "subguard_real_items_v2";

function loadSavedItems() {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (!raw) return { items: [], isSample: false };
    const parsed = JSON.parse(raw);
    return { items: Array.isArray(parsed.items) ? parsed.items : [], isSample: Boolean(parsed.isSample) };
  } catch {
    return { items: [], isSample: false };
  }
}

function persistItems() {
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify({ items: state.items, isSample: state.isSample }));
  } catch {}
}

const initial = loadSavedItems();
const state = {
  items: initial.items,
  isSample: initial.isSample,
  filter: "all",
  selectedAppealId: "",
  llmConfig: loadLlmConfig(),
};

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

function downloadFile(filename, content, mime = "text/calendar;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function switchTab(tabId) {
  $$(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tabId));
  $$(".panel").forEach((p) => p.classList.toggle("active", p.id === `panel-${tabId}`));
}

/* ---------- 查账单 ---------- */
const COLORS = ["#1677ff", "#dc2626", "#f59e0b", "#059669", "#7c3aed", "#0ea5e9", "#64748b"];

function renderDonut(byCategory, totalYearly) {
  if (!byCategory.length || totalYearly <= 0) {
    $("#donutChart").innerHTML = `<div style="text-align:center;padding-top:64px;color:var(--muted);">暂无支出</div>`;
    $("#categoryLegend").innerHTML = "";
    return;
  }
  const r = 60, cx = 83, cy = 83, circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = byCategory.map((c, i) => {
    const len = (c.yearly / totalYearly) * circ;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLORS[i % COLORS.length]}" stroke-width="20" stroke-dasharray="${len} ${circ - len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" />`;
    offset += len;
    return seg;
  });
  $("#donutChart").innerHTML = `
    <svg viewBox="0 0 166 166" width="166" height="166">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="20"/>
      ${arcs.join("")}
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="11.5" fill="#64748b">一年总计</text>
      <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="16.5" font-weight="800" fill="#0f172a">¥${Math.round(totalYearly)}</text>
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
  const hasItems = state.items.length > 0;
  $("#emptyStateCard").style.display = hasItems ? "none" : "block";
  $("#auditContent").style.display = hasItems ? "block" : "none";
  $("#sampleBanner").style.display = hasItems && state.isSample ? "flex" : "none";
  if (!hasItems) return;

  const activeItems = state.items.filter((x) => !x.cancelled);
  const auditAll = auditSubscriptions(state.items);
  const auditActive = auditSubscriptions(activeItems);

  $("#summaryNums").innerHTML = `
    <span>每月 <strong>¥${auditActive.stats.totalMonthly}</strong></span>
    <span>每年 <strong>¥${auditActive.stats.totalYearly}</strong></span>
    <span>可省 <strong class="save-num">¥${auditActive.stats.potentialSaveYearly}</strong></span>`;

  renderDonut(auditActive.byCategory, auditActive.stats.totalYearly);

  const filtered = state.filter === "all" ? auditAll.items : auditAll.items.filter((x) => x.level === state.filter);
  const lvlColor = { red: "#dc2626", yellow: "#d97706", green: "#059669" };
  const lvlPill = { red: "pill-red", yellow: "pill-amber", green: "pill-green" };
  const cycleTxt = { monthly: "月", yearly: "年", quarterly: "季", weekly: "周" };

  $("#subList").innerHTML = filtered
    .map(
      (x) => `
      <div class="sub-card ${x.cancelled ? "cancelled" : ""}" style="--lvl:${x.cancelled ? "#94a3b8" : lvlColor[x.level]};">
        <div class="sub-main">
          <div class="sub-title-row">
            <span class="sub-name">${x.merchant}</span>
            <span class="pill ${x.cancelled ? "pill-slate" : lvlPill[x.level]}">${x.cancelled ? "已退订" : x.actionLabel}</span>
            <span class="pill pill-slate">${x.channel}</span>
          </div>
          <div class="sub-flags">
            ${x.flags.slice(0, 2).map((f) => `<span class="pill ${x.level === "red" ? "pill-red" : "pill-amber"}">${f}</span>`).join("")}
            ${!x.flags.length ? `<span class="pill pill-green">常用项目</span>` : ""}
          </div>
        </div>
        <div class="sub-right">
          <div class="sub-price">¥${x.amount}<span style="font-size:12px;font-weight:500;color:var(--muted);">/${cycleTxt[x.cycle] || "月"}</span></div>
          <div class="sub-btns">
            <button class="btn btn-sm" data-cancel-id="${x.id}">去退订</button>
            ${!x.cancelled && x.level !== "green" ? `<button class="btn btn-primary btn-sm" data-appeal-id="${x.id}">要退费</button>` : ""}
            <button class="btn btn-sm" data-toggle-done="${x.id}" title="标记已退订">${x.cancelled ? "恢复" : "已退"}</button>
            <button class="btn btn-sm" data-del-id="${x.id}" title="删除">✕</button>
          </div>
        </div>
      </div>`
    )
    .join("");

  $$("[data-cancel-id]").forEach((btn) => {
    btn.onclick = () => openCancelModal(auditAll.items.find((i) => i.id === btn.dataset.cancelId));
  });
  $$("[data-appeal-id]").forEach((btn) => {
    btn.onclick = () => {
      const target = auditAll.items.find((i) => i.id === btn.dataset.appealId);
      if (target) fillAppealForm(target);
      switchTab("appeal");
    };
  });
  $$("[data-toggle-done]").forEach((btn) => {
    btn.onclick = () => {
      const target = state.items.find((i) => i.id === btn.dataset.toggleDone);
      if (target) {
        target.cancelled = !target.cancelled;
        persistItems();
        renderAll();
        showToast(target.cancelled ? "已标记为退订，金额已从年度支出减去" : "已恢复统计");
      }
    };
  });
  $$("[data-del-id]").forEach((btn) => {
    btn.onclick = () => {
      state.items = state.items.filter((i) => i.id !== btn.dataset.delId);
      if (!state.items.length) state.isSample = false;
      persistItems();
      renderAll();
    };
  });
}

function openCancelModal(item) {
  if (!item) return;
  const g = item.cancelGuide;
  $("#cancelModalBody").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <strong style="font-size:15.5px;">怎么关闭「${item.merchant}」自动扣款</strong>
      <button class="btn btn-sm" id="btnCloseCancel">关闭</button>
    </div>
    <div class="pill pill-blue" style="margin-bottom:10px;">${g.channel}</div>
    <ol style="padding-left:18px;font-size:14px;display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
      ${g.steps.map((s) => `<li>${s}</li>`).join("")}
    </ol>
    <div style="display:flex;justify-content:flex-end;gap:8px;">
      <button class="btn btn-soft btn-sm" id="btnCopyCancel">复制发给家人</button>
    </div>`;
  $("#cancelModal").classList.add("open");
  $("#btnCloseCancel").onclick = () => $("#cancelModal").classList.remove("open");
  $("#btnCopyCancel").onclick = () => copyText(`关闭「${item.merchant}」步骤：\n${g.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`, "已复制步骤");
}

/* ---------- 买前算账 ---------- */
function renderPrecheck(res, llmTrap = "") {
  const colors = {
    red: { vb: "#fecaca", vbg: "#fef2f2", tc: "#b91c1c", pill: "pill-red" },
    yellow: { vb: "#fde68a", vbg: "#fffbeb", tc: "#b45309", pill: "pill-amber" },
    green: { vb: "#a7f3d0", vbg: "#ecfdf5", tc: "#047857", pill: "pill-green" },
  }[res.verdictLevel];

  $("#precheckResult").innerHTML = `
    <div class="sec-title" style="margin-bottom:10px;"><span>算账结果</span><span class="pill ${colors.pill}">${res.category}</span></div>
    <div class="verdict-box" style="--vb:${colors.vb};--vbg:${colors.vbg};">
      <div style="font-size:12px;color:${colors.tc};font-weight:700;">${res.serviceName}</div>
      <div style="font-size:21px;font-weight:800;color:${colors.tc};">${res.verdict}</div>
    </div>
    <div class="grid-3" style="margin-bottom:12px;">
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:10px;">
        <div style="font-size:11.5px;color:var(--muted);">首期付</div>
        <div style="font-size:19px;font-weight:800;">¥${res.firstPrice}</div>
      </div>
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:10px;">
        <div style="font-size:11.5px;color:var(--muted);">一年实花</div>
        <div style="font-size:19px;font-weight:800;color:#dc2626;">¥${res.year1Cost}</div>
      </div>
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:10px;">
        <div style="font-size:11.5px;color:var(--muted);">涨价倍数</div>
        <div style="font-size:19px;font-weight:800;color:#d97706;">${res.jumpMultiple}倍</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:12px;">
      ${llmTrap ? `<div style="padding:9px 11px;border-radius:9px;background:#eff6ff;font-size:12.5px;color:#1e3a8a;">${llmTrap}</div>` : ""}
      ${
        res.warnings.length
          ? res.warnings.map((w) => `<div style="padding:9px 11px;border-radius:9px;background:#fef2f2;font-size:12.5px;color:#991b1b;">⚠️ ${w}</div>`).join("")
          : `<div style="padding:9px 11px;border-radius:9px;background:#ecfdf5;font-size:12.5px;color:#065f46;">✓ 价格透明，没有和已有会员重复</div>`
      }
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
      <span style="font-size:13px;color:var(--ink-2);flex:1;">建议：${res.advice}</span>
      <button class="btn btn-soft btn-sm" id="btnDownloadIcs">📅 加到手机日历提醒</button>
    </div>`;

  $("#btnDownloadIcs").onclick = () => {
    const days = res.cycle === "yearly" ? 360 : res.cycle === "quarterly" ? 88 : 28;
    const ics = buildReminderICS(res.serviceName, res.renewPrice, days);
    downloadFile(`续费提醒-${res.serviceName}.ics`, ics);
    showToast("已生成日历文件，点开即可加入手机提醒");
  };
}

/* ---------- 退费助手 ---------- */
function fillAppealForm(item) {
  state.selectedAppealId = item.id || "";
  $("#apMerchant").value = item.merchant || "";
  $("#apAmount").value = item.amount || "";
  $("#apChannel").value = item.channel || "支付宝";
  $("#apOrderNo").value = item.orderNo || "";
  renderAppeal();
}

function renderAppeal() {
  const audit = auditSubscriptions(state.items);
  const wrap = $("#appealSelectWrap");
  const sel = $("#appealSelect");

  if (audit.items.length > 0) {
    wrap.style.display = "block";
    sel.innerHTML =
      `<option value="">从我的账单里直接选一笔...</option>` +
      audit.items
        .map((x) => `<option value="${x.id}" ${x.id === state.selectedAppealId ? "selected" : ""}>${x.merchant} · ¥${x.amount}（${x.channel}）</option>`)
        .join("");
    if (!$("#apMerchant").value) {
      const first = audit.items.find((x) => x.level === "red") || audit.items[0];
      state.selectedAppealId = first.id;
      $("#apMerchant").value = first.merchant;
      $("#apAmount").value = first.amount;
      $("#apChannel").value = first.channel;
      $("#apOrderNo").value = first.orderNo || "";
    }
  } else {
    wrap.style.display = "none";
  }

  const merchant = $("#apMerchant").value.trim() || "某会员服务";
  const amount = Number($("#apAmount").value) || 0;
  const channel = $("#apChannel").value || "支付宝";
  const orderNo = $("#apOrderNo").value.trim();

  const pkg = buildAppealPackage(
    { merchant, amount: amount || "（金额）", channel, orderNo, lastDate: new Date().toISOString().slice(0, 10) },
    {
      within7Days: $("#chk7d").checked,
      unusedAfterRenew: $("#chkUnused").checked,
      noAdvanceNotice: $("#chkNoNotice").checked,
      isElderAccidental: $("#chkElder").checked,
    }
  );

  $("#appealStatusCard").innerHTML = `
    <div style="padding:10px 12px;border-radius:10px;background:#ecfdf5;border:1px solid #a7f3d0;font-size:13px;color:#065f46;">
      <strong>退费评估：</strong>${pkg.probabilityLabel}
    </div>
    <div style="margin-top:10px;font-size:13px;color:var(--ink-2);background:#f8fafc;padding:10px 12px;border-radius:10px;border:1px solid var(--border);">
      <strong>先关自动扣款（${pkg.cancelGuide.channel}）：</strong>
      <ol style="padding-left:18px;margin-top:6px;display:flex;flex-direction:column;gap:4px;">
        ${pkg.cancelGuide.steps.map((s) => `<li>${s}</li>`).join("")}
      </ol>
    </div>`;

  $("#appealScriptsPanel").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <strong style="font-size:14px;">发给支付宝账单投诉</strong>
      <button class="btn btn-primary btn-sm" id="btnCopyAlipayScript">一键复制</button>
    </div>
    <div class="script-box">${pkg.alipayComplaintScript}</div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <strong style="font-size:14px;">发给商家在线客服</strong>
      <button class="btn btn-soft btn-sm" id="btnCopyCsScript">一键复制</button>
    </div>
    <div class="script-box" style="background:#1e293b;">${pkg.merchantCsScript}</div>`;

  $("#btnCopyAlipayScript").onclick = () => copyText(pkg.alipayComplaintScript, "已复制，直接去支付宝账单投诉粘贴");
  $("#btnCopyCsScript").onclick = () => copyText(pkg.merchantCsScript, "已复制，直接发给商家客服");
}

/* ---------- 问阿宝 ---------- */
function appendChatMessage(role, contentHtml) {
  const stream = $("#chatStream");
  const div = document.createElement("div");
  div.className = `msg ${role === "user" ? "msg-user" : "msg-bot"}`;
  if (role === "user") {
    div.textContent = contentHtml;
  } else {
    div.innerHTML = contentHtml.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");
  }
  stream.appendChild(div);
  stream.scrollTop = stream.scrollHeight;
  return div;
}

async function sendAbaoQuery(text) {
  const q = text.trim();
  if (!q) return;
  appendChatMessage("user", q);
  const res = handleAbaoChat(q, state.items);

  if (res.parsedItems?.length) {
    if (state.isSample) {
      state.items = [];
      state.isSample = false;
    }
    state.items = [...res.parsedItems, ...state.items];
    persistItems();
    renderAll();
  }
  if (res.intent === "precheck" && res.payload) {
    renderPrecheck(res.payload);
  }

  if (isLlmActive(state.llmConfig)) {
    const pendingEl = appendChatMessage("bot", "正在帮你算...");
    try {
      const auditSummary = auditSubscriptions(state.items);
      const llmReply = await enhanceAbaoChatWithLLM(state.llmConfig, q, auditSummary, res);
      pendingEl.remove();
      appendChatMessage("bot", llmReply);
      return;
    } catch {
      pendingEl.remove();
    }
  }

  const botEl = appendChatMessage("bot", res.reply);
  if (res.suggestedTab) {
    const jumpNames = { audit: "去查账单 →", precheck: "去买前算账 →", appeal: "去退费助手 →" };
    const btn = document.createElement("button");
    btn.className = "btn btn-soft btn-sm";
    btn.style.marginTop = "8px";
    btn.textContent = jumpNames[res.suggestedTab] || "查看 →";
    btn.onclick = () => switchTab(res.suggestedTab);
    botEl.appendChild(document.createElement("br"));
    botEl.appendChild(btn);
  }
}

/* ---------- 弹窗控制 ---------- */
function openAddModal(mode = "sms") {
  $("#addModal").classList.add("open");
  $$("#addModeTabs .chip-tab").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  $("#addPaneSms").style.display = mode === "sms" ? "block" : "none";
  $("#addPanePick").style.display = mode === "pick" ? "block" : "none";
  $("#addPaneManual").style.display = mode === "manual" ? "block" : "none";
}

async function handleCsvFile(file) {
  if (!file) return;
  const buf = await file.arrayBuffer();
  let txt = new TextDecoder("utf-8").decode(buf);
  if (txt.includes("\uFFFD")) {
    try { txt = new TextDecoder("gbk").decode(buf); } catch {}
  }
  const parsed = parseBillText(txt);
  if (!parsed.length) {
    showToast("账单里没发现周期会员扣款，也可试试粘贴短信");
    return;
  }
  state.items = parsed;
  state.isSample = false;
  persistItems();
  renderAll();
  showToast(`已从账单识别出 ${parsed.length} 笔周期扣款`);
}

function renderCatalog() {
  $("#catalogGrid").innerHTML = MERCHANT_CATALOG.map(
    (m, i) => `<label class="cat-item"><input type="checkbox" value="${i}" /><span>${m.key} · ¥${m.typicalMonthly}</span></label>`
  ).join("");
}

function renderAll() {
  renderAudit();
  renderAppeal();
}

function init() {
  renderCatalog();
  renderAll();
  renderPrecheck(
    analyzePrePurchaseOffer(
      { serviceName: "芒果TV", firstPrice: 1, renewPrice: 28, cycle: "monthly" },
      auditSubscriptions(state.items).items
    )
  );
  appendChatMessage("bot", "发我扣费短信，或粘贴想开的会员活动文案，我帮你算清账。");

  $$(".tab-btn").forEach((b) => (b.onclick = () => switchTab(b.dataset.tab)));

  // 空态入口
  $("#csvFileInputEmpty").onchange = (e) => handleCsvFile(e.target.files?.[0]);
  $("#csvFileInput").onchange = (e) => handleCsvFile(e.target.files?.[0]);
  $("#btnOpenSmsEmpty").onclick = () => openAddModal("sms");
  $("#btnOpenPickEmpty").onclick = () => openAddModal("pick");
  $("#btnOpenAddModal").onclick = () => openAddModal("sms");
  $("#btnCloseAddModal").onclick = () => $("#addModal").classList.remove("open");
  $$("#addModeTabs .chip-tab").forEach((b) => (b.onclick = () => openAddModal(b.dataset.mode)));

  $("#btnHowExport").onclick = () => $("#exportGuideModal").classList.add("open");
  $("#btnCloseExportGuide").onclick = () => $("#exportGuideModal").classList.remove("open");

  $("#btnLoadSample").onclick = () => {
    state.items = structuredClone(SAMPLE_BILL_ITEMS);
    state.isSample = true;
    persistItems();
    renderAll();
  };
  const clearItems = () => {
    state.items = [];
    state.isSample = false;
    persistItems();
    renderAll();
    showToast("已清空");
  };
  $("#btnClearAll").onclick = clearItems;
  $("#btnExitSample").onclick = clearItems;

  // 解析短信 / 勾选 / 手动记一笔
  $("#btnParseBill").onclick = () => {
    const parsed = parseBillText($("#billTextInput").value);
    if (!parsed.length) return showToast("没识别到金额，请确认包含“元”或“¥”");
    if (state.isSample) {
      state.items = [];
      state.isSample = false;
    }
    state.items = [...parsed, ...state.items];
    $("#billTextInput").value = "";
    $("#addModal").classList.remove("open");
    persistItems();
    renderAll();
    showToast(`已加入 ${parsed.length} 笔扣款`);
  };

  $("#btnApplyCatalog").onclick = () => {
    const checked = $$("#catalogGrid input:checked").map((el) => MERCHANT_CATALOG[Number(el.value)]);
    if (!checked.length) return showToast("先勾至少一项");
    if (state.isSample) {
      state.items = [];
      state.isSample = false;
    }
    const added = checked.map((m, i) => ({
      id: `pick-${Date.now()}-${i}`,
      merchant: m.key,
      category: m.category,
      channel: m.channel,
      amount: m.typicalMonthly,
      prevAmount: m.typicalMonthly,
      cycle: "monthly",
      lastDate: new Date().toISOString().slice(0, 10),
      usedDays30: 2,
      orderNo: "",
    }));
    state.items = [...added, ...state.items];
    $$("#catalogGrid input:checked").forEach((el) => (el.checked = false));
    $("#addModal").classList.remove("open");
    persistItems();
    renderAll();
    showToast(`已加入 ${added.length} 项会员`);
  };

  $("#btnSaveManual").onclick = () => {
    const merchant = $("#manName").value.trim();
    const amount = Number($("#manAmount").value);
    if (!merchant || !amount || amount <= 0) return showToast("请填写服务名和金额");
    if (state.isSample) {
      state.items = [];
      state.isSample = false;
    }
    const meta = matchMerchantMeta(merchant);
    state.items.unshift({
      id: `man-${Date.now()}`,
      merchant,
      category: meta.category,
      channel: $("#manChannel").value,
      amount,
      prevAmount: amount,
      cycle: $("#manCycle").value,
      lastDate: new Date().toISOString().slice(0, 10),
      usedDays30: $("#manUnused").checked ? 0 : 10,
      orderNo: "",
    });
    $("#manName").value = "";
    $("#manAmount").value = "";
    $("#addModal").classList.remove("open");
    persistItems();
    renderAll();
    showToast(`已记入「${merchant}」`);
  };

  $$("#filterBar [data-filter]").forEach((b) => {
    b.onclick = () => {
      state.filter = b.dataset.filter;
      $$("#filterBar [data-filter]").forEach((x) => x.classList.toggle("btn-primary", x === b));
      renderAudit();
    };
  });

  // 买前算账
  $$("#promoPresets .tag-btn").forEach((b) => {
    b.onclick = () => {
      $("#preName").value = b.dataset.name;
      $("#preFirst").value = b.dataset.first;
      $("#preRenew").value = b.dataset.renew;
      $("#preCycle").value = b.dataset.cycle;
      $("#prePromoText").value = b.dataset.text;
      renderPrecheck(
        analyzePrePurchaseOffer(
          { serviceName: b.dataset.name, firstPrice: Number(b.dataset.first), renewPrice: Number(b.dataset.renew), cycle: b.dataset.cycle, promoText: b.dataset.text, manualOverride: true },
          auditSubscriptions(state.items).items
        )
      );
    };
  });

  $("#btnRunPrecheck").onclick = async () => {
    const promoText = $("#prePromoText").value.trim();
    const hasManual = $("#preFirst").value !== "" && $("#preRenew").value !== "";
    let llmTrap = "";
    let extra = {};

    if (!hasManual && promoText.length >= 12 && isLlmActive(state.llmConfig)) {
      showToast("正在解读条款...");
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

    renderPrecheck(
      analyzePrePurchaseOffer(
        {
          serviceName: extra.serviceName ?? $("#preName").value,
          firstPrice: extra.firstPrice ?? ($("#preFirst").value === "" ? NaN : Number($("#preFirst").value)),
          renewPrice: extra.renewPrice ?? ($("#preRenew").value === "" ? NaN : Number($("#preRenew").value)),
          cycle: extra.cycle ?? $("#preCycle").value,
          promoText,
          manualOverride: extra.manualOverride ?? hasManual,
        },
        auditSubscriptions(state.items).items
      ),
      llmTrap
    );
  };

  // 退费助手实时刷新
  $("#appealSelect").onchange = (e) => {
    const target = state.items.find((x) => x.id === e.target.value);
    if (target) fillAppealForm(target);
  };
  ["#apMerchant", "#apAmount", "#apOrderNo"].forEach((id) => {
    $(id).oninput = () => renderAppeal();
  });
  ["#apChannel", "#chk7d", "#chkUnused", "#chkNoNotice", "#chkElder"].forEach((id) => {
    $(id).onchange = () => renderAppeal();
  });

  // 问阿宝
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

  // 复制清单
  $("#btnExportReport").onclick = () => {
    if (!state.items.length) return showToast("先导入或添加账单再复制");
    const audit = auditSubscriptions(state.items.filter((x) => !x.cancelled));
    const txt = [
      `我的自动扣款清单（每月 ¥${audit.stats.totalMonthly} / 每年 ¥${audit.stats.totalYearly}）`,
      ...audit.items.map((x, i) => `${i + 1}. ${x.merchant} ¥${x.amount}（${x.channel} · ${x.actionLabel}）`),
    ].join("\n");
    copyText(txt, "已复制账单清单");
  };

  // AI 设置
  $("#btnOpenLlmModal").onclick = () => {
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
  };
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
    $("#llmModal").classList.remove("open");
    showToast(isLlmActive(state.llmConfig) ? "已开启在线大模型" : "已保存");
  };
  $("#btnClearLlm").onclick = () => {
    clearLlmConfig();
    state.llmConfig = loadLlmConfig();
    $("#llmEnabled").checked = false;
    $("#llmApiKey").value = "";
    $("#llmTestStatus").textContent = "已清除";
  };
  $("#btnTestLlm").onclick = async () => {
    const tempCfg = {
      enabled: true,
      provider: $("#llmProvider").value,
      endpoint: $("#llmEndpoint").value.trim(),
      model: $("#llmModel").value.trim(),
      apiKey: $("#llmApiKey").value.trim(),
    };
    $("#llmTestStatus").textContent = "连接中...";
    try {
      const reply = await testLlmConnection(tempCfg);
      $("#llmTestStatus").textContent = `连接成功：${reply}`;
    } catch (err) {
      $("#llmTestStatus").textContent = `连接失败：${err.message}`;
    }
  };

  // 支持 ?demo=audit|precheck|appeal|abao 截图模式（仅截配图脚本使用，普通用户访问为空白真实入口）
  const demoTab = new URLSearchParams(location.search).get("demo");
  if (demoTab && ["abao", "audit", "precheck", "appeal"].includes(demoTab)) {
    document.documentElement.classList.add("demo-mode");
    if (demoTab !== "audit_empty" && !state.items.length) {
      state.items = structuredClone(SAMPLE_BILL_ITEMS);
      state.isSample = false;
      renderAll();
    }
    if (demoTab === "abao") {
      sendAbaoQuery("【支付宝】2026-11-24 向扫描全能王自动扣款30元（首月1元，未使用）");
    }
    switchTab(demoTab);
    void document.body.offsetHeight;
  }
}

init();
