/* 研究笔记工作台:纯文本 + 画板(拖拽/粘贴/连线思维导图) */
const LS_TEXT = "unprompted:research:text";
const LS_BOARD = "unprompted:research:board";
const SVG_NS = "http://www.w3.org/2000/svg";

/* ---------- 文本 ---------- */
const ta = document.getElementById("notes-text");
ta.value = localStorage.getItem(LS_TEXT) || "";
let textSaveTimer = null;
ta.addEventListener("input", () => {
  clearTimeout(textSaveTimer);
  textSaveTimer = setTimeout(() => {
    try {
      localStorage.setItem(LS_TEXT, ta.value);
    } catch {}
  }, 200);
});

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
  download("研究笔记.txt", ta.value, "text/plain;charset=utf-8");
});

/* ---------- 画板 ---------- */
const board = document.getElementById("board");
const itemsEl = document.getElementById("board-items");
const linksSvg = document.getElementById("board-links");

let items = [];
let links = [];
let selectedId = null;
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
  document.querySelectorAll(".board-item").forEach((el) => {
    el.classList.toggle("is-selected", el.dataset.id === id);
  });
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
    text.contentEditable = "true";
    text.textContent = it.text || "";
    wrap.appendChild(text);
    text.addEventListener("input", () => {
      it.text = text.textContent;
      saveBoard();
    });
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

  wrap.addEventListener("pointerdown", (e) => {
    if (e.target.classList.contains("board-link-handle")) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    selectItem(it.id);
    startDrag(it.id, e);
  });
  return wrap;
}

function renderBoard() {
  itemsEl.replaceChildren(...items.map((it) => makeItemEl(it)));
  renderLinks();
}

/* 拖拽移动 */
let drag = null;
function startDrag(id, e) {
  const it = items.find((i) => i.id === id);
  const rect = board.getBoundingClientRect();
  drag = { id, dx: e.clientX - rect.left - it.x, dy: e.clientY - rect.top - it.y };
}

board.addEventListener("pointermove", (e) => {
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
    links.push({ from: fromId, to: toId });
    saveBoard();
    renderLinks();
  }
}

let lastPointer = { clientX: 0, clientY: 0 };
board.addEventListener("pointermove", (e) => {
  lastPointer.clientX = e.clientX;
  lastPointer.clientY = e.clientY;
  if (linking) moveTempLine(e);
});

/* 添加文本框 */
function addTextBox(x, y, text) {
  const it = { id: "n" + uid++, type: "text", x: x ?? 60, y: y ?? 40, w: 220, h: 40, text: text || "" };
  items.push(it);
  itemsEl.appendChild(makeItemEl(it));
  const edit = itemsEl.lastElementChild.querySelector(".board-text-content");
  if (!text) edit.focus();
  saveBoard();
  renderLinks();
}

document.getElementById("btn-add-text").addEventListener("click", () => addTextBox());

board.addEventListener("dblclick", (e) => {
  if (e.target !== board && e.target !== linksSvg && e.target !== itemsEl) return;
  const rect = board.getBoundingClientRect();
  addTextBox(e.clientX - rect.left - 60, e.clientY - rect.top - 20);
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
    const maxW = 280;
    const w = Math.min(maxW, img.naturalWidth || maxW);
    const h = Math.round((w * img.naturalHeight) / (img.naturalWidth || 1));
    const rect = board.getBoundingClientRect();
    const it = {
      id: "img" + uid++,
      type: "image",
      x: Math.max(0, (rect.width - w) / 2),
      y: Math.max(0, (rect.height - h) / 2),
      w,
      h,
      dataUrl,
    };
    items.push(it);
    itemsEl.appendChild(makeItemEl(it));
    saveBoard();
    renderLinks();
  };
  img.src = dataUrl;
}

/* 删除 */
board.addEventListener("keydown", (e) => {
  if (e.target.isContentEditable) return;
  if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
    e.preventDefault();
    items = items.filter((i) => i.id !== selectedId);
    links = links.filter((l) => l.from !== selectedId && l.to !== selectedId);
    selectedId = null;
    renderBoard();
    saveBoard();
  }
});

document.getElementById("btn-clear-board").addEventListener("click", () => {
  if (!items.length) return;
  if (window.confirm("确定清空画板吗?此操作不可撤销。")) {
    items = [];
    links = [];
    selectedId = null;
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

/* 导出画板为矢量 PDF */
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
    const MARGIN = 60;
    let maxX = MARGIN;
    let maxY = MARGIN;
    for (const it of items) {
      maxX = Math.max(maxX, it.x + it.w + MARGIN);
      maxY = Math.max(maxY, it.y + it.h + MARGIN);
    }
    const { PDFDocument, rgb } = PDFLib;
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const fontBytes = await fetch("assets/cjk-font.ttf").then((r) => r.arrayBuffer());
    const font = await doc.embedFont(fontBytes);
    const page = doc.addPage([maxX, maxY]);

    for (const l of links) {
      const a = items.find((i) => i.id === l.from);
      const b = items.find((i) => i.id === l.to);
      if (!a || !b) continue;
      page.drawLine({
        start: { x: a.x + a.w, y: maxY - (a.y + a.h / 2) },
        end: { x: b.x, y: maxY - (b.y + b.h / 2) },
        thickness: 2,
        color: rgb(0.435, 0.765, 0.847),
      });
    }

    const ink = rgb(0.957, 0.91, 0.84);
    for (const it of items) {
      const top = maxY - it.y;
      if (it.type === "text") {
        const lines = (it.text || "").split("\n");
        const size = 15;
        lines.forEach((line, i) => {
          if (!line.trim()) return;
          page.drawText(line, { x: it.x + 8, y: top - 12 - i * (size + 6), size, font, color: ink });
        });
      } else if (it.dataUrl) {
        let img = null;
        try {
          if (it.dataUrl.startsWith("data:image/png")) img = await doc.embedPng(it.dataUrl);
          else if (it.dataUrl.startsWith("data:image/jpeg") || it.dataUrl.startsWith("data:image/jpg")) img = await doc.embedJpg(it.dataUrl);
        } catch {}
        if (img) page.drawImage(img, { x: it.x, y: top - it.h, width: it.w, height: it.h });
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
setTab("text");
