/* 研究笔记工作台:Markdown 文本 + 画板(框选/拖拽/双击编辑/连线思维导图/矢量 PDF) */
const LS_TEXT = "unprompted:research:text";
const LS_BOARD = "unprompted:research:board";
const SVG_NS = "http://www.w3.org/2000/svg";

/* ---------- 文本(Markdown + 实时预览) ---------- */
const ta = document.getElementById("notes-text");
const preview = document.getElementById("notes-preview");
ta.value = localStorage.getItem(LS_TEXT) || "";
let textSaveTimer = null;
let mdTimer = null;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderPreview() {
  const src = ta.value || "";
  let html = src;
  try {
    html = typeof marked !== "undefined" ? marked.parse(src) : "<p>" + escapeHtml(src).replace(/\n/g, "<br>") + "</p>";
  } catch {
    html = "<p>" + escapeHtml(src).replace(/\n/g, "<br>") + "</p>";
  }
  preview.innerHTML = html;
}

function onTextInput() {
  clearTimeout(textSaveTimer);
  clearTimeout(mdTimer);
  textSaveTimer = setTimeout(() => {
    try {
      localStorage.setItem(LS_TEXT, ta.value);
    } catch {}
  }, 200);
  mdTimer = setTimeout(renderPreview, 250);
}

ta.addEventListener("input", onTextInput);

let mdMode = "edit";
function setMdMode(mode) {
  mdMode = mode;
  document.getElementById("md-mode-edit").classList.toggle("is-active", mode === "edit");
  document.getElementById("md-mode-split").classList.toggle("is-active", mode === "split");
  document.getElementById("md-mode-preview").classList.toggle("is-active", mode === "preview");
  document.getElementById("md-mode-edit").setAttribute("aria-selected", String(mode === "edit"));
  document.getElementById("md-mode-split").setAttribute("aria-selected", String(mode === "split"));
  document.getElementById("md-mode-preview").setAttribute("aria-selected", String(mode === "preview"));
  document.getElementById("md-body").classList.toggle("is-split", mode === "split");
  preview.hidden = mode === "edit";
  ta.hidden = mode === "preview";
  if (mode === "preview") renderPreview();
}

document.getElementById("md-mode-edit").addEventListener("click", () => setMdMode("edit"));
document.getElementById("md-mode-split").addEventListener("click", () => setMdMode("split"));
document.getElementById("md-mode-preview").addEventListener("click", () => setMdMode("preview"));

function download(filename, data, mime) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.getElementById("btn-dl-text").addEventListener("click", () => {
  if (!ta.value.trim()) {
    ta.focus();
    return;
  }
  download("研究笔记.md", ta.value, "text/markdown;charset=utf-8");
});

/* ---------- 画板 ---------- */
const board = document.getElementById("board");
const canvas = document.getElementById("board-canvas");
const itemsEl = document.getElementById("board-items");
const linksSvg = document.getElementById("board-links");
const marqueeEl = document.getElementById("board-marquee");

let items = [];
let links = [];
let selectedIds = new Set();
let selectedLinkId = null;
let uid = Math.floor(Math.random() * 1e6);

/* 坐标:把视口事件坐标转换为画布坐标(考虑滚动) */
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function saveBoard() {
  try {
    localStorage.setItem(LS_BOARD, JSON.stringify({ items, links }));
  } catch {}
}

function loadBoard() {
  try {
    const raw = localStorage.getItem(LS_BOARD);
    if (raw) {
      const d = JSON.parse(raw);
      if (Array.isArray(d.items)) items = d.items;
      if (Array.isArray(d.links)) links = d.links;
    }
  } catch {}
}

/* 画布尺寸:根据最远的节点动态扩展,保证内容都能显示/滚动 */
function updateCanvasSize() {
  let maxX = 0;
  let maxY = 0;
  for (const it of items) {
    maxX = Math.max(maxX, it.x + (it.w || 220));
    maxY = Math.max(maxY, it.y + (it.h || 40));
  }
  maxX = Math.max(maxX, board.clientWidth);
  maxY = Math.max(maxY, board.clientHeight);
  canvas.style.width = maxX + "px";
  canvas.style.height = maxY + "px";
}

/* 选择 */
function applySelectionUI() {
  document.querySelectorAll(".board-item").forEach((el) => {
    el.classList.toggle("is-selected", selectedIds.has(el.dataset.id));
  });
  renderLinks();
  updateDelLinkBtn();
}

function setSelection(ids) {
  selectedIds = new Set(ids);
  selectedLinkId = null;
  applySelectionUI();
}

function selectItem(id) {
  setSelection([id]);
  board.focus();
}

function clearSelection() {
  selectedIds.clear();
  selectedLinkId = null;
  applySelectionUI();
}

function selectLink(id) {
  selectedLinkId = id;
  selectedIds.clear();
  applySelectionUI();
  board.focus();
}

function updateDelLinkBtn() {
  const btn = document.getElementById("btn-del-link");
  btn.disabled = !selectedLinkId;
}

function deleteItem(id) {
  items = items.filter((i) => i.id !== id);
  links = links.filter((l) => l.from !== id && l.to !== id);
  selectedIds.delete(id);
  renderBoard();
  saveBoard();
}

function deleteSelected() {
  const ids = [...selectedIds];
  if (!ids.length) return;
  items = items.filter((i) => !ids.includes(i.id));
  links = links.filter((l) => !ids.includes(l.from) && !ids.includes(l.to));
  selectedIds.clear();
  renderBoard();
  saveBoard();
}

function deleteLink(id) {
  links = links.filter((l) => l.id !== id);
  selectedLinkId = null;
  renderBoard();
  saveBoard();
  updateDelLinkBtn();
}

function renderLinks() {
  linksSvg.replaceChildren(
    ...links
      .map((l) => {
        const a = items.find((i) => i.id === l.from);
        const b = items.find((i) => i.id === l.to);
        if (!a || !b) return null;
        const selected = l.id === selectedLinkId;
        // 透明加宽命中线(便于点击) + 可见细线
        const hit = document.createElementNS(SVG_NS, "line");
        hit.classList.add("board-link-hit");
        if (selected) hit.classList.add("is-selected");
        hit.setAttribute("x1", String(a.x + a.w));
        hit.setAttribute("y1", String(a.y + (a.h || 40) / 2));
        hit.setAttribute("x2", String(b.x));
        hit.setAttribute("y2", String(b.y + (b.h || 40) / 2));
        hit.setAttribute("stroke", "transparent");
        hit.setAttribute("stroke-width", "14");
        hit.addEventListener("pointerup", (e) => {
          e.stopPropagation();
          selectLink(l.id);
        });
        const line = document.createElementNS(SVG_NS, "line");
        line.classList.add("board-link-line");
        if (selected) line.classList.add("is-selected");
        line.setAttribute("x1", String(a.x + a.w));
        line.setAttribute("y1", String(a.y + (a.h || 40) / 2));
        line.setAttribute("x2", String(b.x));
        line.setAttribute("y2", String(b.y + (b.h || 40) / 2));
        line.setAttribute("stroke", "#6fc3d8");
        line.setAttribute("stroke-width", "2");
        return [hit, line];
      })
      .filter(Boolean)
      .flat()
  );
}

function makeItemEl(it) {
  const wrap = document.createElement("div");
  wrap.className = "board-item" + (selectedIds.has(it.id) ? " is-selected" : "");
  wrap.dataset.id = it.id;
  wrap.style.left = it.x + "px";
  wrap.style.top = it.y + "px";

  if (it.type === "image") {
    wrap.style.width = it.w + "px";
    wrap.style.height = it.h + "px";
    const img = document.createElement("img");
    img.src = it.dataUrl;
    img.draggable = false;
    img.alt = "粘贴的图片";
    wrap.appendChild(img);
  } else {
    wrap.classList.add("board-text");
    wrap.style.width = it.w + "px";
    const text = document.createElement("div");
    text.className = "board-text-content";
    text.contentEditable = "false";
    text.textContent = it.text || "";
    wrap.appendChild(text);
    const resize = () => {
      it.text = text.textContent;
      it.h = wrap.offsetHeight || 40;
      saveBoard();
      renderLinks();
      updateCanvasSize();
    };
    text.addEventListener("input", resize);
    text.addEventListener("blur", () => {
      text.contentEditable = "false";
      resize();
    });
    // 双击进入编辑
    wrap.addEventListener("dblclick", (e) => {
      if (e.target.classList.contains("board-del")) return;
      e.preventDefault();
      e.stopPropagation();
      setSelection([it.id]);
      text.contentEditable = "true";
      text.focus();
      const range = document.createRange();
      range.selectNodeContents(text);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
    // 连线手柄
    const handle = document.createElement("span");
    handle.className = "board-link-handle";
    handle.title = "拖拽到另一个节点建立连线";
    wrap.appendChild(handle);
    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      startLink(it.id, e);
    });
  }

  // 删除按钮(悬停/选中显示)
  const del = document.createElement("button");
  del.type = "button";
  del.className = "board-del";
  del.textContent = "×";
  del.title = "删除节点";
  del.setAttribute("aria-label", "删除节点");
  del.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    deleteItem(it.id);
  });
  del.addEventListener("dblclick", (e) => e.stopPropagation());
  wrap.appendChild(del);

  // 单击选中 + 拖拽(已在选区内则整体拖动)
  wrap.addEventListener("pointerdown", (e) => {
    if (e.target.classList.contains("board-del") || e.target.classList.contains("board-link-handle")) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    if (!selectedIds.has(it.id)) setSelection([it.id]);
    startDrag(it.id, e);
  });
  return wrap;
}

function renderBoard() {
  itemsEl.replaceChildren(...items.map((it) => makeItemEl(it)));
  items.forEach((it) => {
    const el = document.querySelector(`[data-id="${it.id}"]`);
    if (el) it.h = el.offsetHeight || it.h || 40;
  });
  applySelectionUI();
  updateCanvasSize();
}

/* 拖拽移动(支持多选整体移动) */
let drag = null;
function startDrag(id, e) {
  const p = canvasPoint(e);
  const ids = [...selectedIds].filter((iid) => items.some((i) => i.id === iid));
  if (!ids.includes(id)) ids.push(id);
  const offsets = {};
  for (const iid of ids) {
    const it = items.find((i) => i.id === iid);
    offsets[iid] = { dx: p.x - it.x, dy: p.y - it.y };
  }
  drag = { ids, offsets };
}

board.addEventListener("pointermove", (e) => {
  lastPointer.clientX = e.clientX;
  lastPointer.clientY = e.clientY;
  if (linking) {
    moveTempLine(e);
    return;
  }
  if (marquee) {
    const p = canvasPoint(e);
    marquee.x1 = p.x;
    marquee.y1 = p.y;
    renderMarquee();
    return;
  }
  if (!drag) return;
  const p = canvasPoint(e);
  for (const iid of drag.ids) {
    const it = items.find((i) => i.id === iid);
    if (!it) continue;
    const o = drag.offsets[iid];
    it.x = Math.max(0, p.x - o.dx);
    it.y = Math.max(0, p.y - o.dy);
    const el = document.querySelector(`[data-id="${iid}"]`);
    if (el) {
      el.style.left = it.x + "px";
      el.style.top = it.y + "px";
    }
  }
  renderLinks();
});

board.addEventListener("pointerup", () => {
  if (drag) {
    drag = null;
    saveBoard();
    updateCanvasSize();
  }
  if (linking) finishLink();
  if (marquee) finishMarquee();
});

/* 框选(像桌面一样拖动选择多个节点) */
let marquee = null;
function renderMarquee() {
  if (!marquee) return;
  const x = Math.min(marquee.x0, marquee.x1);
  const y = Math.min(marquee.y0, marquee.y1);
  const w = Math.abs(marquee.x1 - marquee.x0);
  const h = Math.abs(marquee.y1 - marquee.y0);
  marqueeEl.hidden = false;
  marqueeEl.style.left = x + "px";
  marqueeEl.style.top = y + "px";
  marqueeEl.style.width = w + "px";
  marqueeEl.style.height = h + "px";
}

function finishMarquee() {
  if (!marquee) return;
  const x = Math.min(marquee.x0, marquee.x1);
  const y = Math.min(marquee.y0, marquee.y1);
  const w = Math.abs(marquee.x1 - marquee.x0);
  const h = Math.abs(marquee.y1 - marquee.y0);
  marquee = null;
  marqueeEl.hidden = true;
  const hits = [];
  for (const it of items) {
    const iw = it.w || 220;
    const ih = it.h || 40;
    if (it.x < x + w && it.x + iw > x && it.y < y + h && it.y + ih > y) hits.push(it.id);
  }
  setSelection(hits);
  board.focus();
}

/* 画布背景:按下开始框选 */
board.addEventListener("pointerdown", (e) => {
  const t = e.target;
  const isBg = t === board || t === canvas || t === itemsEl || t === linksSvg || t.classList.contains("board-marquee");
  if (!isBg) return;
  if (e.button !== undefined && e.button !== 0) return;
  const p = canvasPoint(e);
  marquee = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
  selectedIds.clear();
  applySelectionUI();
  renderMarquee();
});

/* 连线(思维导图) */
let linking = null;
let tempLine = null;
let lastPointer = { clientX: 0, clientY: 0 };

function startLink(fromId, e) {
  linking = { from: fromId };
  tempLine = document.createElementNS(SVG_NS, "line");
  tempLine.setAttribute("stroke", "#6fc3d8");
  tempLine.setAttribute("stroke-width", "2");
  tempLine.setAttribute("stroke-dasharray", "5 4");
  linksSvg.appendChild(tempLine);
  moveTempLine(e);
}

function moveTempLine(e) {
  if (!linking || !tempLine) return;
  const a = items.find((i) => i.id === linking.from);
  const p = canvasPoint(e);
  tempLine.setAttribute("x1", String(a.x + a.w));
  tempLine.setAttribute("y1", String(a.y + (a.h || 40) / 2));
  tempLine.setAttribute("x2", String(p.x));
  tempLine.setAttribute("y2", String(p.y));
}

function finishLink() {
  tempLine?.remove();
  tempLine = null;
  if (!linking) return;
  const fromId = linking.from;
  linking = null;
  const el = document.elementFromPoint(lastPointer.clientX, lastPointer.clientY);
  const target = el?.closest?.(".board-item");
  const toId = target?.dataset?.id;
  if (toId && toId !== fromId && !links.some((l) => l.from === fromId && l.to === toId)) {
    links.push({ id: "l" + uid++, from: fromId, to: toId });
    saveBoard();
    renderLinks();
  }
}

/* 添加文本框(默认位置错开,避免互相重叠) */
let spawnIdx = 0;
function spawnPos() {
  const off = (spawnIdx % 8) * 34;
  spawnIdx++;
  return { x: 60 + off, y: 40 + off };
}

function addTextBox(x, y, text) {
  const pos = spawnPos();
  const it = { id: "n" + uid++, type: "text", x: x ?? pos.x, y: y ?? pos.y, w: 220, h: 40, text: text || "" };
  items.push(it);
  itemsEl.appendChild(makeItemEl(it));
  const el = itemsEl.lastElementChild;
  it.h = el.offsetHeight || 40;
  updateCanvasSize();
  const edit = el.querySelector(".board-text-content");
  if (!text) {
    edit.contentEditable = "true";
    edit.focus();
  }
  saveBoard();
  renderLinks();
}

document.getElementById("btn-add-text").addEventListener("click", () => addTextBox());

board.addEventListener("dblclick", (e) => {
  if (e.target !== board && e.target !== canvas && e.target !== itemsEl && e.target !== linksSvg) return;
  const p = canvasPoint(e);
  addTextBox(p.x - 110, p.y - 20);
});

/* 粘贴图片 / 文本 */
board.addEventListener("paste", (e) => {
  e.preventDefault();
  const cdt = e.clipboardData;
  if (!cdt) return;
  for (const it of cdt.items || []) {
    if (it.type && it.type.startsWith("image/")) {
      const file = it.getAsFile();
      if (!file) continue;
      const reader = new FileReader();
      reader.onload = () => addImage(reader.result);
      reader.readAsDataURL(file);
      return;
    }
  }
  const text = cdt.getData("text");
  if (text && text.trim()) addTextBox(80, 80, text.trim());
});

function addImage(dataUrl) {
  const img = new Image();
  img.onload = () => {
    const MAX = 1200;
    let w = img.naturalWidth || 1;
    let h = img.naturalHeight || 1;
    let storedUrl = dataUrl;
    if (w > MAX || h > MAX) {
      const s = Math.min(MAX / w, MAX / h);
      w = Math.round(w * s);
      h = Math.round(h * s);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      storedUrl = c.toDataURL("image/jpeg", 0.85);
    }
    const dispW = Math.min(280, w);
    const dispH = Math.round((dispW * h) / w);
    const rect = canvas.getBoundingClientRect();
    const it = {
      id: "img" + uid++,
      type: "image",
      x: Math.max(0, (rect.width - dispW) / 2),
      y: Math.max(0, (rect.height - dispH) / 2),
      w: dispW,
      h: dispH,
      dataUrl: storedUrl,
    };
    items.push(it);
    itemsEl.appendChild(makeItemEl(it));
    saveBoard();
    renderLinks();
    updateCanvasSize();
  };
  img.src = dataUrl;
}

/* 删除(键盘) */
board.addEventListener("keydown", (e) => {
  if (e.target.isContentEditable) return;
  if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    if (selectedLinkId) deleteLink(selectedLinkId);
    else if (selectedIds.size) deleteSelected();
  }
});

document.getElementById("btn-del-link").addEventListener("click", () => {
  if (selectedLinkId) deleteLink(selectedLinkId);
});

document.getElementById("btn-clear-board").addEventListener("click", () => {
  if (!items.length) return;
  if (window.confirm("确定清空画板吗?此操作不可撤销。")) {
    items = [];
    links = [];
    selectedIds.clear();
    selectedLinkId = null;
    renderBoard();
    saveBoard();
  }
});

/* 标签切换 */
function setTab(tab) {
  const isText = tab === "text";
  document.getElementById("tab-text").classList.toggle("is-active", isText);
  document.getElementById("tab-board").classList.toggle("is-active", !isText);
  document.getElementById("tab-text").setAttribute("aria-selected", String(isText));
  document.getElementById("tab-board").setAttribute("aria-selected", String(!isText));
  document.getElementById("panel-text").hidden = !isText;
  document.getElementById("panel-board").hidden = isText;
  if (!isText) {
    renderBoard();
    updateCanvasSize();
  }
}

document.getElementById("tab-text").addEventListener("click", () => setTab("text"));
document.getElementById("tab-board").addEventListener("click", () => setTab("board"));

/* ---------- 导出画板为矢量 PDF(所见即所得 + 文字自动换行) ---------- */
document.getElementById("btn-dl-pdf").addEventListener("click", exportBoardPdf);

function wrapPdfLines(text, font, size, maxWidth) {
  const lines = [];
  for (const para of String(text || "").split("\n")) {
    let line = "";
    for (const ch of para) {
      const test = line + ch;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

async function exportBoardPdf() {
  const btn = document.getElementById("btn-dl-pdf");
  const old = btn.textContent;
  if (!items.length) {
    alert("画板为空,请先添加内容。");
    return;
  }
  btn.textContent = "生成中…";
  btn.disabled = true;
  try {
    const MARGIN = 80;
    let maxX = MARGIN;
    let maxY = MARGIN;
    for (const it of items) {
      maxX = Math.max(maxX, it.x + it.w + MARGIN);
      maxY = Math.max(maxY, it.y + (it.h || 40) + MARGIN);
    }
    const { PDFDocument, rgb } = PDFLib;
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const fontBytes = await fetch("assets/cjk-font.ttf").then((r) => r.arrayBuffer());
    const font = await doc.embedFont(fontBytes, { subset: true }); // 子集化,PDF 体积更小
    const page = doc.addPage([maxX, maxY]);

    page.drawRectangle({
      x: 0,
      y: 0,
      width: maxX,
      height: maxY,
      color: rgb(15 / 255, 20 / 255, 18 / 255),
    });

    const linkColor = rgb(0.435, 0.765, 0.847);
    const nodeBg = rgb(28 / 255, 36 / 255, 33 / 255);
    const nodeBorder = rgb(90 / 255, 104 / 255, 98 / 255);
    const ink = rgb(0.957, 0.91, 0.84);

    // 连线
    for (const l of links) {
      const a = items.find((i) => i.id === l.from);
      const b = items.find((i) => i.id === l.to);
      if (!a || !b) continue;
      page.drawLine({
        start: { x: a.x + a.w, y: maxY - (a.y + (a.h || 40) / 2) },
        end: { x: b.x, y: maxY - (b.y + (b.h || 40) / 2) },
        thickness: 2,
        color: linkColor,
      });
    }

    // 节点与内容
    for (const it of items) {
      const topPdf = maxY - it.y;
      if (it.type === "text") {
        const size = 15;
        const pad = 9;
        const maxW = Math.max(40, it.w - pad * 2);
        const lines = wrapPdfLines(it.text, font, size, maxW);
        const lineH = size + 6;
        const boxH = Math.max(40, pad * 2 + lines.length * lineH - 6);
        page.drawRectangle({
          x: it.x,
          y: topPdf - boxH,
          width: it.w,
          height: boxH,
          color: nodeBg,
          borderColor: nodeBorder,
          borderWidth: 1,
          borderRadius: Math.min(12, boxH / 2),
        });
        lines.forEach((line, i) => {
          page.drawText(line, {
            x: it.x + pad,
            y: topPdf - pad - size * 0.8 - i * lineH,
            size,
            font,
            color: ink,
          });
        });
      } else if (it.dataUrl) {
        const h = it.h || 80;
        let img = null;
        try {
          if (it.dataUrl.startsWith("data:image/png")) img = await doc.embedPng(it.dataUrl);
          else if (it.dataUrl.startsWith("data:image/jpeg") || it.dataUrl.startsWith("data:image/jpg")) img = await doc.embedJpg(it.dataUrl);
        } catch {}
        if (img) {
          page.drawRectangle({
            x: it.x,
            y: topPdf - h,
            width: it.w,
            height: h,
            color: nodeBg,
            borderColor: nodeBorder,
            borderWidth: 1,
            borderRadius: Math.min(12, h / 2),
          });
          page.drawImage(img, { x: it.x + 4, y: topPdf - h + 4, width: it.w - 8, height: h - 8 });
        }
      }
    }

    const bytes = await doc.save();
    download("研究画板.pdf", bytes, "application/pdf");
    btn.textContent = "已导出 ✓";
  } catch (err) {
    alert("导出失败:" + err.message);
    btn.textContent = old;
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      if (btn.textContent === "已导出 ✓") btn.textContent = old;
    }, 1600);
  }
}

/* 启动 */
loadBoard();
renderBoard();
renderPreview();
setTab("text");
