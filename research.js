/* 研究笔记工作台:Markdown 文本 + 画板(拖拽/双击编辑/连线思维导图/矢量 PDF) */
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
const itemsEl = document.getElementById("board-items");
const linksSvg = document.getElementById("board-links");

let items = [];
let links = [];
let selectedId = null;
let selectedLinkId = null;
let uid = Math.floor(Math.random() * 1e6);

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

function selectItem(id) {
  selectedId = id;
  selectedLinkId = null;
  document.querySelectorAll(".board-item").forEach((el) => {
    el.classList.toggle("is-selected", el.dataset.id === id);
  });
  renderLinks();
  updateDelLinkBtn();
}

function selectLink(id) {
  selectedLinkId = id;
  selectedId = null;
  document.querySelectorAll(".board-item").forEach((el) => el.classList.remove("is-selected"));
  renderLinks();
  updateDelLinkBtn();
}

function clearSelection() {
  selectedId = null;
  selectedLinkId = null;
  document.querySelectorAll(".board-item").forEach((el) => el.classList.remove("is-selected"));
  renderLinks();
  updateDelLinkBtn();
}

function updateDelLinkBtn() {
  const btn = document.getElementById("btn-del-link");
  btn.disabled = !selectedLinkId;
}

function deleteItem(id) {
  items = items.filter((i) => i.id !== id);
  links = links.filter((l) => l.from !== id && l.to !== id);
  if (selectedId === id) selectedId = null;
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
        const line = document.createElementNS(SVG_NS, "line");
        line.setAttribute("x1", String(a.x + a.w));
        line.setAttribute("y1", String(a.y + a.h / 2));
        line.setAttribute("x2", String(b.x));
        line.setAttribute("y2", String(b.y + b.h / 2));
        line.setAttribute("stroke", "#6fc3d8");
        line.setAttribute("stroke-width", "2");
        if (l.id === selectedLinkId) line.classList.add("is-selected");
        line.addEventListener("click", (e) => {
          e.stopPropagation();
          selectLink(l.id);
        });
        return line;
      })
      .filter(Boolean)
  );
}

function makeItemEl(it) {
  const wrap = document.createElement("div");
  wrap.className = "board-item" + (it.id === selectedId ? " is-selected" : "");
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
      const h = wrap.offsetHeight || 40;
      it.h = h;
      saveBoard();
      renderLinks();
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
      selectItem(it.id);
      text.contentEditable = "true";
      text.focus();
      // 光标放到末尾
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

  // 单击选中 + 拖拽
  wrap.addEventListener("pointerdown", (e) => {
    if (e.target.classList.contains("board-del") || e.target.classList.contains("board-link-handle")) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    selectItem(it.id);
    startDrag(it.id, e);
  });
  return wrap;
}

function renderBoard() {
  itemsEl.replaceChildren(...items.map((it) => makeItemEl(it)));
  // 测量文本节点实际高度
  items.forEach((it) => {
    const el = document.querySelector(`[data-id="${it.id}"]`);
    if (el) it.h = el.offsetHeight || it.h || 40;
  });
  renderLinks();
  updateDelLinkBtn();
}

/* 拖拽移动 */
let drag = null;
function startDrag(id, e) {
  const it = items.find((i) => i.id === id);
  const rect = board.getBoundingClientRect();
  drag = { id, dx: e.clientX - rect.left - it.x, dy: e.clientY - rect.top - it.y };
}

board.addEventListener("pointermove", (e) => {
  lastPointer.clientX = e.clientX;
  lastPointer.clientY = e.clientY;
  if (linking) {
    moveTempLine(e);
    return;
  }
  if (!drag) return;
  const rect = board.getBoundingClientRect();
  const it = items.find((i) => i.id === drag.id);
  if (!it) return;
  it.x = Math.max(0, e.clientX - rect.left - drag.dx);
  it.y = Math.max(0, e.clientY - rect.top - drag.dy);
  const el = document.querySelector(`[data-id="${it.id}"]`);
  if (el) {
    el.style.left = it.x + "px";
    el.style.top = it.y + "px";
  }
  renderLinks();
});

board.addEventListener("pointerup", () => {
  if (drag) {
    drag = null;
    saveBoard();
  }
  if (linking) finishLink();
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
  const rect = board.getBoundingClientRect();
  const a = items.find((i) => i.id === linking.from);
  tempLine.setAttribute("x1", String(a.x + a.w));
  tempLine.setAttribute("y1", String(a.y + a.h / 2));
  tempLine.setAttribute("x2", String(e.clientX - rect.left));
  tempLine.setAttribute("y2", String(e.clientY - rect.top));
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
  const off = (spawnIdx % 6) * 30;
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
  if (e.target !== board && e.target !== linksSvg && e.target !== itemsEl) return;
  const rect = board.getBoundingClientRect();
  addTextBox(e.clientX - rect.left - 60, e.clientY - rect.top - 20);
});

/* 点击空白清除选中 */
board.addEventListener("pointerdown", (e) => {
  if (e.target === board || e.target === linksSvg || e.target === itemsEl) clearSelection();
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
    // 压缩/限制尺寸,减小内存与 PDF 体积
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
    const rect = board.getBoundingClientRect();
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
  };
  img.src = dataUrl;
}

/* 删除(键盘) */
board.addEventListener("keydown", (e) => {
  if (e.target.isContentEditable) return;
  if (e.key === "Delete" || e.key === "Backspace") {
    if (selectedLinkId) {
      e.preventDefault();
      deleteLink(selectedLinkId);
    } else if (selectedId) {
      e.preventDefault();
      deleteItem(selectedId);
    }
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
    selectedId = null;
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
  if (!isText) renderBoard();
}

document.getElementById("tab-text").addEventListener("click", () => setTab("text"));
document.getElementById("tab-board").addEventListener("click", () => setTab("board"));

/* 导出画板为矢量 PDF(所见即所得:深色背景 + 节点 + 连线 + 图片) */
document.getElementById("btn-dl-pdf").addEventListener("click", exportBoardPdf);

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

    // 深色背景(与浏览器一致)
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
    const accent = rgb(0.769, 0.478, 0.29);

    // 连线(先画,在节点下层)
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
      const h = it.h || 40;
      const topPdf = maxY - it.y; // 节点顶部在 PDF 坐标系中的 y
      const radius = Math.min(12, h / 2);
      if (it.type === "text") {
        page.drawRectangle({
          x: it.x,
          y: topPdf - h,
          width: it.w,
          height: h,
          color: nodeBg,
          borderColor: nodeBorder,
          borderWidth: 1,
          borderRadius: radius,
        });
        const lines = (it.text || "").split("\n");
        const size = 15;
        const pad = 9;
        lines.forEach((line, i) => {
          if (!line.trim()) return;
          page.drawText(line, {
            x: it.x + pad,
            y: topPdf - pad - size * 0.8 - i * (size + 6),
            size,
            font,
            color: ink,
          });
        });
      } else if (it.dataUrl) {
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
            borderRadius: radius,
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
