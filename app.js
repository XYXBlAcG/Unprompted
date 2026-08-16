/* =====================================================================
 * Unprompted — 口语练习(中文版)
 * 复刻自 https://www.unprompted.cool/ 的独立单页应用
 * ===================================================================== */

/* ------------------------- 数据 ------------------------- */

const PRACTICE_MODES = [
  { id: "off-the-cuff", label: "即兴演讲", emoji: "🧠", blurb: "几乎不需要准备,训练快速思考、临场发挥。" },
  { id: "deep-research", label: "深度研究", emoji: "🔍", blurb: "抽取一个话题,设定研究计时器,准备好后再开始演讲计时。" },
];

const MODES = [
  {
    id: "general",
    label: "综合",
    emoji: "✦",
    topics: ["怀旧", "舒适区", "肌肉记忆", "通勤", "骚扰电话", "语音信箱", "门铃", "旧物传承", "书架", "杂物抽屉", "信息过载", "镜子", "候诊室", "自动更正", "群聊", "剩菜剩饭", "红绿灯"],
  },
  {
    id: "deep-research",
    label: "深度研究",
    emoji: "🔎",
    topics: ["富兰克林效应", "透明度错觉", "情感预测(影响偏差)", "聚焦错觉", "历史终结错觉", "讽刺过程理论", "情绪标记", "谢林点", "以牙还牙(以及善良策略为何胜出)", "消耗战", "昂贵信号", "志愿者困境", "猎鹿博弈", "鸵鸟效应", "赌场盈利效应", "折中效应", "面额效应", "检察官谬误", "辛普森悖论", "伯克森悖论", "小数定律", "假阳性悖论", "林迪效应"],
  },
  {
    id: "personal-finance",
    label: "个人理财",
    emoji: "💰",
    topics: ["应急基金", "复利", "生活方式膨胀", "沉没成本", "机会成本", "净资产", "现金流", "高息债务", "未雨绸缪", "分散投资", "定投(DCA)", "流动性", "烧钱率", "安全网", "信用评分", "货币时间价值", "风险承受能力", "闲置现金", "订阅陷阱", "财务跑道", "延迟满足"],
  },
  {
    id: "entrepreneurship",
    label: "创业",
    emoji: "🚀",
    topics: ["切身利益", "第一个客户", "现金即氧气", "创始人模式", "学会说不", "分销渠道", "单位经济学", "护城河", "自筹资金", "产品市场契合", "声誉资本", "血汗股权", "苦干与杠杆", "独立创始人", "公开构建", "快速试错", "客户至上", "战略转型", "信任即货币", "一夜成功的神话", "副业天花板", "不完美也要交付"],
  },
  {
    id: "startups",
    label: "初创公司",
    emoji: "🌱",
    topics: ["最小可行产品", "资金跑道", "种子轮", "增长黑客", "客户流失", "网络效应", "烧钱率", "增长势头", "转型", "创始人-市场契合", "滩头市场", "病毒式传播循环", "演示日", "产品债务", "早期采用者", "过早扩张", "收购式招聘", "登月计划", "从零到一"],
  },
  {
    id: "tech-ai",
    label: "科技 / AI",
    emoji: "🤖",
    topics: ["黑盒", "训练数据", "提示词工程", "幻觉", "模型漂移", "延迟", "API 调用", "开源", "微调", "上下文窗口", "自动化偏见", "数据护城河", "边界情况", "技术债务", "单点故障", "云端与本地", "推理成本", "合成数据", "反馈回路", "零样本", "注意力机制", "智能体工作流"],
  },
  {
    id: "fitness",
    label: "健身",
    emoji: "💪",
    topics: "渐进式超负荷.休息日.肌肉记忆.动作质量优先于面子.平台期.热身.坚持胜过强度.减负周.活动范围.恢复欠账.个人纪录.身体成分.有氧基础.灵活性.酸痛作为信号.到场训练.负重呼吸.意念-肌肉连接.容量与强度.习惯叠加.健身房焦虑.保持期.功能性力量.睡眠也是训练.训练搭档.新手红利.长期运动员".split("."),
  },
  {
    id: "nutrition",
    label: "营养",
    emoji: "🥗",
    topics: ["空热量", "蛋白质", "补水", "备餐", "渴望与饥饿", "微量营养素", "膳食纤维", "血糖飙升", "正念饮食", "天然食物", "肠道健康", "欺骗餐", "情绪化进食", "可持续热量缺口", "早餐习惯", "深夜零食", "超加工食品", "吃够", "盘中色彩", "社交饮食", "进食时间", "补剂", "家庭烹饪", "能量可用性"],
  },
  {
    id: "productivity",
    label: "效率",
    emoji: "⚡",
    topics: ["深度工作", "情境切换", "收件箱清零", "时间盒", "帕金森定律", "两分钟法则", "批量处理", "精力管理", "完成优于完美", "未闭环事项", "专注模式", "会议税", "单任务处理", "晨间手记", "关机仪式", "第二大脑", "拖延", "减少摩擦", "注意力残留", "受保护时间", "产出大于工时", "分心节食"],
  },
  {
    id: "history",
    label: "历史",
    emoji: "📜",
    topics: "柏林墙倒塌.登月.印刷术的发明.大宪章签署.攻占巴士底狱.第一届奥运会.青霉素的发现.莱特兄弟首飞.君士坦丁堡陷落.波士顿倾茶事件.向华盛顿进军.丝绸之路的开通.切尔诺贝利灾难.长城的建成.凡尔赛条约.第一张照片.苏伊士运河通航.英国废除奴隶制.斯普特尼克发射.佛罗伦萨文艺复兴.1929 年股市崩盘.纳尔逊·曼德拉获释.金字塔的建造.首次妇女参政胜利.广岛原子弹.郑和下西洋.罗马帝国灭亡.互联网的发明".split("."),
  },
  {
    id: "literature",
    label: "文学",
    emoji: "📚",
    topics: ["1984", "白鲸", "傲慢与偏见", "百年孤独", "了不起的盖茨比", "罪与罚", "杀死一只知更鸟", "美丽新世界", "奥德赛", "弗兰肯斯坦", "堂吉诃德", "宠儿", "麦田里的守望者", "战争与和平", "第五号屠宰场", "欧内斯特·海明威", "弗朗茨·卡夫卡", "费奥多尔·陀思妥耶夫斯基", "埃德加·爱伦·坡", "詹姆斯·乔伊斯", "艾米莉·狄金森", "马克·吐温"],
  },
];

const NICHE_MODES = MODES.filter((m) => m.id !== "deep-research");
const DEEP_RESEARCH_MODE = MODES.find((m) => m.id === "deep-research");
const SPEECH_STAGES = ["是什么?", "所以呢?", "然后呢?"];

/* ------------------------- 工具函数 ------------------------- */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

function modeByNiche(id) {
  return MODES.find((m) => m.id === id) ?? MODES[0];
}

function practiceMode(id) {
  return PRACTICE_MODES.find((m) => m.id === id) ?? PRACTICE_MODES[0];
}

/** M:SS 格式(如 1:05) */
function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** 人类可读时长(如 "5 分钟"、"1 分钟 30 秒") */
function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m && r) return `${m} 分钟 ${r} 秒`;
  if (m) return `${m} 分钟`;
  return s === 0 ? "0 分钟" : `${r} 秒`;
}

/* ------------------------- 本地存储 ------------------------- */

const LS_PREFIX = "unprompted:";

function clampSpeech(seconds) {
  const m = Math.round(seconds / 60);
  return clamp(m, 1, 10) * 60;
}

function clampResearch(seconds) {
  const m = Math.round(seconds / 60);
  return clamp(m, 1, 60) * 60;
}

function readSeconds(key, fallback, clampFn) {
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + key);
    if (raw === null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? clampFn(n) : fallback;
  } catch {
    return fallback;
  }
}

function writeSeconds(key, seconds) {
  try {
    window.localStorage.setItem(LS_PREFIX + key, String(seconds));
  } catch {}
}

function readMuted() {
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + "muted");
    if (raw === null) return false;
    return raw === "true" || (raw !== "false" && false);
  } catch {
    return false;
  }
}

function writeMuted(v) {
  try {
    window.localStorage.setItem(LS_PREFIX + "muted", String(v));
  } catch {}
}

/* ------------------------- 音效(Web Audio) ------------------------- */

let audioCtx = null;
let muted = readMuted();

function getAudio() {
  audioCtx = audioCtx || new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function unlockAudio() {
  if (muted) return;
  getAudio();
}

function playNote(freq, startTime, dur, type, gain, dest) {
  const ctx = getAudio();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  g.gain.setValueAtTime(1e-4, startTime);
  g.gain.exponentialRampToValueAtTime(gain, startTime + 0.01);
  g.gain.exponentialRampToValueAtTime(1e-4, startTime + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + dur + 0.02);
}

/** 转盘滴答声(噪声脉冲) */
function playTick(volume = 1) {
  if (muted) return;
  const ctx = getAudio();
  const t = ctx.currentTime;
  const dur = 0.018;
  const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(2200 + Math.random() * 800, t);
  filter.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(1e-4, t);
  g.gain.exponentialRampToValueAtTime(0.55 * volume, t + 0.001);
  g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);
  src.start(t);
  src.stop(t + dur + 0.01);
}

/** 落地 / 研究完成音(C 大调琶音) */
function playLandChime() {
  if (muted) return;
  const ctx = getAudio();
  const t = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.value = 0.45;
  g.connect(ctx.destination);
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    playNote(freq, t + i * 0.07, 0.45, "sine", 0.28, g);
  });
}

/** 演讲结束音(G 大调 + 高音 C) */
function playDoneChime() {
  if (muted) return;
  const ctx = getAudio();
  const t = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.value = 0.5;
  g.connect(ctx.destination);
  [392, 523.25, 659.25, 784].forEach((freq, i) => {
    playNote(freq, t + i * 0.12, 0.55, "triangle", 0.32, g);
  });
  playNote(1046.5, t + 0.55, 0.9, "sine", 0.22, g);
}

/* ------------------------- DOM 工具 ------------------------- */

const root = document.getElementById("root");

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "checked" || k === "disabled" || k === "inert" || k === "hidden") {
      if (v) node.setAttribute(k, "");
    } else node.setAttribute(k, v);
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

/* ------------------------- 状态 ------------------------- */

const state = {
  mode: "off-the-cuff",
  niche: "general",
  speechSeconds: readSeconds("speech", 60, clampSpeech),
  researchSeconds: readSeconds("research", 600, clampResearch),
  settingsOpen: false,
  spinning: false,
  landed: null, // 已落定的话题
  shown: null, // 转盘当前显示的话题
  phase: "idle", // idle | research | ready | speech | done
  remaining: 0,
  spinCount: 0,
};

let currentIndex = 0;
let rafId = null;
let forceTimer = null;
let countdownTimer = null;
let lastFocusedBeforeTimer = null;

const timerActive = () => state.phase !== "idle";
const mainInert = () => timerActive() || state.settingsOpen;
const researchActive = () => state.phase === "research";
const speechOrDone = () => state.phase === "speech" || state.phase === "done";

function currentPool() {
  return state.mode === "deep-research" ? DEEP_RESEARCH_MODE.topics : modeByNiche(state.niche).topics;
}

/* ------------------------- 渲染 ------------------------- */

function build() {
  root.append(
    el("div", { class: "page" },
      el("div", { class: "atmosphere", "aria-hidden": "true" }),
      el("header", { class: "brand", id: "brand" },
        el("p", { class: "brand-mark", text: "Unprompted" }),
        el("h1", { class: "brand-line" },
          "由 ",
          el("a", {
            class: "brand-link",
            href: "https://www.instagram.com/bitterbuilds/",
            target: "_blank",
            rel: "noopener noreferrer",
            "aria-label": "@bitterbuilds 在 Instagram 上",
          },
            el("svg", { class: "brand-link-icon", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" },
              el("rect", { x: "3", y: "3", width: "18", height: "18", rx: "5", ry: "5" }),
              el("circle", { cx: "12", cy: "12", r: "4.2" }),
              el("circle", { cx: "17.4", cy: "6.6", r: "1.1", fill: "currentColor", stroke: "none" })
            ),
            el("span", { text: "@bitterbuilds" })
          ),
          " 制作"
        )
      ),
      el("main", { class: "stage" },
        el("div", { class: "stage-body", id: "stage-body" },
          el("div", { class: "controls" },
            el("div", { class: "mode-switch", id: "mode-switch", role: "radiogroup", "aria-label": "练习模式" },
              el("span", { class: "mode-thumb", "aria-hidden": "true", id: "mode-thumb" }),
              PRACTICE_MODES.map((m, i) =>
                el("button", {
                  type: "button",
                  class: "mode-option",
                  role: "radio",
                  "aria-checked": String(m.id === state.mode),
                  tabindex: m.id === state.mode ? "0" : "-1",
                  "data-mode": m.id,
                  "data-index": String(i),
                },
                  el("span", { class: "mode-emoji", "aria-hidden": "true", text: m.emoji }),
                  el("span", { class: "mode-label", text: m.label })
                )
              )
            ),
            el("p", { class: "mode-blurb", id: "mode-blurb", text: practiceMode(state.mode).blurb }),
            el("div", { class: "niche-select", id: "niche-select" },
              el("button", { type: "button", class: "niche-trigger", id: "niche-trigger", "aria-haspopup": "listbox", "aria-expanded": "false" },
                el("span", { class: "niche-emoji", "aria-hidden": "true", id: "niche-emoji" }),
                el("span", { class: "niche-label", id: "niche-label" }),
                el("span", { class: "niche-caret", "aria-hidden": "true" })
              ),
              el("div", { class: "niche-menu", id: "niche-menu", role: "listbox", "aria-label": "话题领域", hidden: true },
                NICHE_MODES.map((m, i) =>
                  el("div", {
                    class: "niche-option",
                    role: "option",
                    "aria-selected": String(m.id === state.niche),
                    tabindex: "-1",
                    "data-niche": m.id,
                    "data-index": String(i),
                  },
                    el("span", { class: "niche-emoji", "aria-hidden": "true", text: m.emoji }),
                    el("span", { class: "niche-label", text: m.label })
                  )
                )
              )
            )
          ),
          el("section", { class: "reel", id: "reel" },
            el("p", { class: "reel-eyebrow", id: "reel-eyebrow", text: "就绪" }),
            el("p", { class: "reel-phrase", id: "reel-phrase" })
          ),
          el("p", { class: "sr-only", "aria-live": "polite", id: "sr-live" })
        ),
        el("div", { class: "actions" },
          el("div", { class: "actions-main", id: "actions-main" },
            el("button", { type: "button", class: "btn primary", id: "btn-spin", text: "抽取" }),
            el("button", { type: "button", class: "btn secondary", id: "btn-start", disabled: true })
          ),
          el("div", { class: "settings", id: "settings" },
            el("button", { type: "button", class: "settings-trigger", id: "settings-trigger", "aria-haspopup": "dialog", "aria-expanded": "false", "aria-label": "设置", title: "设置" },
              el("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" },
                el("path", { d: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" }),
                el("path", { d: "M19.4 13.05a7.4 7.4 0 0 0 0-2.1l1.7-1.32a.55.55 0 0 0 .13-.7l-1.7-2.94a.55.55 0 0 0-.66-.24l-2 .8a7.6 7.6 0 0 0-1.82-1.05l-.3-2.13A.55.55 0 0 0 14.2 3h-4.4a.55.55 0 0 0-.55.46l-.3 2.13a7.6 7.6 0 0 0-1.82 1.05l-2-.8a.55.55 0 0 0-.66.24L2.77 8.93a.55.55 0 0 0 .13.7L4.6 10.95a7.4 7.4 0 0 0 0 2.1l-1.7 1.32a.55.55 0 0 0-.13.7l1.7 2.94c.14.25.43.35.66.24l2-.8c.55.42 1.16.76 1.82 1.05l.3 2.13c.05.26.28.46.55.46h4.4c.27 0 .5-.2.55-.46l.3-2.13c.66-.29 1.27-.63 1.82-1.05l2 .8c.23.11.52 0 .66-.24l1.7-2.94a.55.55 0 0 0-.13-.7l-1.7-1.32Z" })
              )
            )
          )
        )
      )
    )
  );
}

/* 设置面板(渲染到 body) */
function buildSettings() {
  return el("div", { class: "settings-overlay", id: "settings-overlay", role: "presentation", hidden: true },
    el("div", { class: "settings-panel", id: "settings-panel", role: "dialog", "aria-modal": "true", "aria-labelledby": "settings-title" },
      el("header", { class: "settings-panel-head" },
        el("h2", { class: "settings-panel-title", id: "settings-title", text: "设置" }),
        el("p", { class: "settings-panel-blurb", text: "计时长度以整分钟为单位。" })
      ),
      durationField("演讲", state.speechSeconds / 60, 1, 10, (mins) => {
        const secs = clampSpeech(mins * 60);
        state.speechSeconds = secs;
        writeSeconds("speech", secs);
        renderSettingsValues();
      }),
      durationField("研究", state.researchSeconds / 60, 1, 60, (mins) => {
        const secs = clampResearch(mins * 60);
        state.researchSeconds = secs;
        writeSeconds("research", secs);
        renderSettingsValues();
      }, "仅深度研究模式"),
      el("div", { class: "settings-mute" },
        el("input", { type: "checkbox", id: "settings-mute-input", checked: muted }),
        el("label", { for: "settings-mute-input", text: "静音音效" })
      ),
      el("p", { class: "settings-note", text: "设置将保存到下次使用。" }),
      el("button", { type: "button", class: "btn primary settings-done", id: "settings-done", text: "完成" })
    )
  );
}

function durationField(label, minutes, min, max, onChange, hint) {
  const id = `duration-${label}-${min}-${max}`;
  const field = el("div", { class: "duration-field" },
    el("div", { class: "duration-head" },
      el("label", { class: "duration-label", for: id, text: label }),
      el("span", { class: "duration-value", "aria-live": "polite" })
    ),
    el("input", {
      type: "range",
      id,
      class: "duration-slider",
      min: String(min),
      max: String(max),
      step: "1",
      value: String(Math.round(minutes)),
      "aria-valuemin": String(min),
      "aria-valuemax": String(max),
      "aria-valuenow": String(Math.round(minutes)),
    }),
    el("div", { class: "duration-ends", "aria-hidden": "true" },
      el("span", { text: `${min} 分钟` }),
      el("span", { text: `${max} 分钟` })
    ),
    hint ? el("p", { class: "duration-hint", text: hint }) : null
  );
  const valueEl = field.querySelector(".duration-value");
  const slider = field.querySelector("input");
  const setValue = (secs) => {
    valueEl.textContent = formatDuration(secs);
    slider.setAttribute("aria-valuenow", String(Math.round(secs / 60)));
    slider.setAttribute("aria-valuetext", formatDuration(secs));
  };
  setValue(minutes * 60);
  slider.addEventListener("input", () => onChange(Number(slider.value)));
  return field;
}

/* ------------------------- 计时器渲染 ------------------------- */

let overlayPhase = null; // 上一次渲染的 phase,用于判断是否需要重建按钮

function renderTimerOverlay() {
  let overlay = document.getElementById("timer-overlay");
  if (!timerActive()) {
    if (overlay) overlay.remove();
    overlayPhase = null;
    return;
  }
  const research = researchActive();
  const ready = state.phase === "ready";
  const done = state.phase === "done";

  const classes = ["timer-overlay"];
  classes.push(done ? "is-done" : "is-live");
  if (research) classes.push("is-research");
  const ariaLabel = research ? "研究计时" : ready ? "准备演讲" : "演讲计时";

  if (!overlay) {
    lastFocusedBeforeTimer = document.activeElement;
    overlay = el("div", { class: classes.join(" "), id: "timer-overlay", role: "dialog", "aria-modal": "true", "aria-label": ariaLabel },
      el("div", { class: "timer-overlay-inner" },
        el("p", { class: "timer-topic", id: "timer-topic" }),
        el("p", { class: "timer-phase", id: "timer-phase", text: "研究中" }),
        el("ol", { class: "speech-stages", id: "speech-stages", "aria-label": "演讲结构" }),
        el("div", { class: "timer-ring", id: "timer-ring", role: "timer" },
          el("span", { class: "timer-digits", id: "timer-digits" })
        ),
        el("p", { class: "timer-status", id: "timer-status", "aria-live": "polite" }),
        el("p", { class: "timer-next", id: "timer-next", hidden: true }),
        el("div", { class: "timer-actions", id: "timer-actions" })
      )
    );
    document.body.appendChild(overlay);
  }

  overlay.className = classes.join(" ");
  overlay.setAttribute("aria-label", ariaLabel);

  // 话题
  const topicEl = document.getElementById("timer-topic");
  topicEl.hidden = !state.landed;
  if (state.landed) topicEl.textContent = state.landed;

  // 研究中标记
  document.getElementById("timer-phase").hidden = !research;

  // 演讲结构(仅即兴演讲模式)
  const stagesEl = document.getElementById("speech-stages");
  const showStages = state.mode === "off-the-cuff" && speechOrDone();
  stagesEl.hidden = !showStages;
  if (showStages && stagesEl.children.length === 0) {
    stagesEl.append(...SPEECH_STAGES.map((label) =>
      el("li", { class: "speech-stage is-pending" },
        el("span", { class: "speech-stage-label", text: label })
      )
    ));
  }
  if (showStages) {
    const hit = stageHitCount();
    [...stagesEl.children].forEach((li, i) => {
      li.classList.toggle("is-hit", i < hit);
      li.classList.toggle("is-pending", i >= hit);
    });
  }

  // 计时圆环与数字
  const total = research ? state.researchSeconds : state.speechSeconds;
  const progress = ready ? 0 : total <= 0 ? 1 : clamp(1 - state.remaining / total, 0, 1);
  document.getElementById("timer-ring").style.setProperty("--p", String(progress));
  document.getElementById("timer-digits").textContent = formatClock(state.remaining);

  // 状态与下一步提示
  document.getElementById("timer-status").textContent = statusText();
  const nextEl = document.getElementById("timer-next");
  nextEl.hidden = !ready;
  if (ready) {
    nextEl.replaceChildren("接下来:", formatDuration(state.speechSeconds), " 开始演讲。");
  }

  // 操作按钮(仅在 phase 变化时重建,避免打断动画与焦点)
  if (state.phase !== overlayPhase) {
    const actions = document.getElementById("timer-actions");
    actions.replaceChildren(
      research
        ? el("button", { type: "button", class: "btn primary", onclick: finishResearchEarly, text: "研究完成" })
        : null,
      ready
        ? el("button", { type: "button", class: "btn primary", onclick: startSpeechFromReady, text: "准备开始演讲" })
        : null,
      el("button", { type: "button", class: "btn ghost", onclick: closeTimer, text: "关闭" })
    );
    const primary = actions.querySelector(".btn.primary");
    (primary ?? actions.querySelector(".btn.ghost"))?.focus();
    overlayPhase = state.phase;
  }
}

function stageHitCount() {
  const total = state.speechSeconds;
  if (state.phase === "done" || total <= 0) return SPEECH_STAGES.length;
  const elapsed = total - state.remaining;
  const seg = total / SPEECH_STAGES.length;
  return elapsed >= seg * 2 ? 3 : elapsed >= seg ? 2 : 1;
}

function statusText() {
  if (researchActive()) return "研究中。";
  if (state.phase === "ready") return "研究完成。";
  if (state.phase === "done") return "时间到。";
  return "开始演讲。";
}

/* ------------------------- 主界面渲染 ------------------------- */

function renderMain() {
  // 模式
  document.querySelectorAll(".mode-option").forEach((btn) => {
    const active = btn.dataset.mode === state.mode;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-checked", String(active));
    btn.tabIndex = active ? 0 : -1;
  });
  document.getElementById("mode-thumb").style.setProperty("--i", String(PRACTICE_MODES.findIndex((m) => m.id === state.mode)));
  document.getElementById("mode-blurb").textContent = practiceMode(state.mode).blurb;

  // 领域选择(仅即兴演讲模式显示)
  const niche = document.getElementById("niche-select");
  const showNiche = state.mode === "off-the-cuff";
  niche.hidden = !showNiche;

  const nicheMode = modeByNiche(state.niche);
  document.getElementById("niche-emoji").textContent = nicheMode.emoji;
  document.getElementById("niche-label").textContent = nicheMode.label;
  document.querySelectorAll(".niche-option").forEach((opt) => {
    const active = opt.dataset.niche === state.niche;
    opt.classList.toggle("is-active", active);
    opt.setAttribute("aria-selected", String(active));
  });

  // 转盘
  const reel = document.getElementById("reel");
  reel.classList.toggle("is-spinning", state.spinning);
  reel.classList.toggle("is-landed", !!state.landed);
  document.getElementById("reel-eyebrow").textContent = state.spinning ? "抽取中…" : state.landed ? "你的话题" : "就绪";
  document.getElementById("reel-phrase").textContent = state.shown;
  document.getElementById("sr-live").textContent = state.landed ? `你的话题:${state.landed}` : "";

  // 按钮
  const spinBtn = document.getElementById("btn-spin");
  spinBtn.textContent = state.spinning ? "抽取中…" : state.landed ? "重新抽取" : "抽取";
  spinBtn.disabled = state.spinning || timerActive();

  const startBtn = document.getElementById("btn-start");
  startBtn.textContent = state.mode === "deep-research"
    ? `开始 ${formatDuration(state.researchSeconds)} 研究`
    : `开始 ${formatDuration(state.speechSeconds)} 计时`;
  startBtn.disabled = !state.landed || state.spinning || timerActive();

  // inert
  const inert = mainInert();
  document.getElementById("brand").inert = inert;
  document.getElementById("stage-body").inert = inert;
  document.getElementById("actions-main").inert = inert;
  document.getElementById("settings-trigger").disabled = state.spinning || timerActive();
}

function renderSettingsValues() {
  document.querySelectorAll(".duration-slider").forEach((slider) => {
    const label = slider.closest(".duration-field").querySelector(".duration-label").textContent;
    const secs = label === "演讲" ? state.speechSeconds : state.researchSeconds;
    const mins = Math.round(secs / 60);
    slider.value = String(mins);
    slider.setAttribute("aria-valuenow", String(mins));
    slider.setAttribute("aria-valuetext", formatDuration(secs));
    slider.closest(".duration-field").querySelector(".duration-value").textContent = formatDuration(secs);
  });
  document.getElementById("btn-start").textContent = state.mode === "deep-research"
    ? `开始 ${formatDuration(state.researchSeconds)} 研究`
    : `开始 ${formatDuration(state.speechSeconds)} 计时`;
}

/* ------------------------- 启动 ------------------------- */

try {
  build();
  document.body.appendChild(buildSettings());
  const initial = currentPool();
  state.shown = rand(initial);
  currentIndex = Math.max(0, initial.indexOf(state.shown));
  renderMain();
} catch (err) {
  console.error("Unprompted 启动失败", err);
  showErrorScreen();
}

/* ------------------------- 交互:转盘 ------------------------- */

function pickTopic(pool) {
  const topic = rand(pool);
  currentIndex = Math.max(0, pool.indexOf(topic));
  state.shown = topic;
  state.landed = null;
  renderMain();
}

const SPIN_MS = 4800;

function spinPlan(startIdx, len) {
  const cycles = 3 + Math.floor(Math.random() * 3);
  const offset = len > 1 ? Math.floor(Math.random() * (len - 1)) : 0;
  const totalSteps = cycles * len + offset;
  return { totalSteps, landIndex: (startIdx + totalSteps) % len };
}

function cancelSpin() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  if (forceTimer !== null) clearTimeout(forceTimer);
  rafId = null;
  forceTimer = null;
}

function spin() {
  if (state.spinning || timerActive()) return;
  unlockAudio();
  cancelSpin();
  state.spinning = true;
  state.landed = null;
  renderMain();

  const pool = currentPool();
  const len = pool.length;
  const startIdx = currentIndex % len;
  const { totalSteps, landIndex } = spinPlan(startIdx, len);
  const t0 = performance.now();
  let lastStep = -1;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    cancelSpin();
    currentIndex = landIndex;
    state.shown = pool[landIndex];
    state.landed = pool[landIndex];
    state.spinning = false;
    state.spinCount++;
    renderMain();
    playLandChime();
  };

  const step = (now) => {
    const s = Math.min(1, (now - t0) / SPIN_MS);
    const eased = easeOutCubic(s);
    const steps = Math.min(totalSteps, Math.floor(eased * totalSteps));
    if (steps !== lastStep) {
      const idx = (startIdx + steps) % len;
      currentIndex = idx;
      state.shown = pool[idx];
      state.spinCount++;
      playTick(1 - s * 0.6);
      lastStep = steps;
      renderMain();
    }
    if (s < 1) rafId = requestAnimationFrame(step);
    else finish();
  };
  rafId = requestAnimationFrame(step);
  forceTimer = setTimeout(finish, 5100);
}

/* ------------------------- 交互:模式与领域 ------------------------- */

const modeSwitch = document.getElementById("mode-switch");
modeSwitch.addEventListener("keydown", (e) => {
  const idx = PRACTICE_MODES.findIndex((m) => m.id === state.mode);
  let next = null;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % PRACTICE_MODES.length;
  else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + PRACTICE_MODES.length) % PRACTICE_MODES.length;
  if (next === null) return;
  e.preventDefault();
  selectMode(PRACTICE_MODES[next].id);
  document.querySelectorAll(".mode-option")[next]?.focus();
});

document.querySelectorAll(".mode-option").forEach((btn) => {
  btn.addEventListener("click", () => selectMode(btn.dataset.mode));
});

function selectMode(id) {
  if (state.spinning || timerActive() || id === state.mode) return;
  if (id !== "off-the-cuff") setNicheOpen(false);
  state.mode = id;
  pickTopic(id === "deep-research" ? DEEP_RESEARCH_MODE.topics : modeByNiche(state.niche).topics);
  renderMain();
}

/* 领域下拉 */
const nicheSelect = document.getElementById("niche-select");
const nicheTrigger = document.getElementById("niche-trigger");
const nicheMenu = document.getElementById("niche-menu");
let nicheOpen = false;
let nicheActiveIdx = Math.max(0, NICHE_MODES.findIndex((m) => m.id === state.niche));

function setNicheOpen(open) {
  nicheOpen = open;
  nicheMenu.hidden = !open;
  nicheSelect.classList.toggle("is-open", open);
  nicheTrigger.setAttribute("aria-expanded", String(open));
  nicheTrigger.setAttribute("aria-controls", open ? "niche-menu" : "");
  if (open) {
    document.querySelectorAll(".niche-option")[nicheActiveIdx]?.focus();
  }
}

function selectNiche(index) {
  state.niche = NICHE_MODES[index].id;
  pickTopic(modeByNiche(state.niche).topics);
  setNicheOpen(false);
  nicheTrigger.focus();
}

nicheTrigger.addEventListener("click", () => {
  nicheActiveIdx = Math.max(0, NICHE_MODES.findIndex((m) => m.id === state.niche));
  setNicheOpen(!nicheOpen);
});

nicheTrigger.addEventListener("keydown", (e) => {
  if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !nicheOpen) {
    e.preventDefault();
    nicheActiveIdx = Math.max(0, NICHE_MODES.findIndex((m) => m.id === state.niche));
    setNicheOpen(true);
  }
});

document.addEventListener("mousedown", (e) => {
  if (nicheOpen && !nicheSelect.contains(e.target)) setNicheOpen(false);
});

nicheMenu.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      nicheActiveIdx = (nicheActiveIdx + 1) % NICHE_MODES.length;
      document.querySelectorAll(".niche-option")[nicheActiveIdx]?.focus();
      break;
    case "ArrowUp":
      e.preventDefault();
      nicheActiveIdx = (nicheActiveIdx - 1 + NICHE_MODES.length) % NICHE_MODES.length;
      document.querySelectorAll(".niche-option")[nicheActiveIdx]?.focus();
      break;
    case "Home":
      e.preventDefault();
      nicheActiveIdx = 0;
      document.querySelectorAll(".niche-option")[0]?.focus();
      break;
    case "End":
      e.preventDefault();
      nicheActiveIdx = NICHE_MODES.length - 1;
      document.querySelectorAll(".niche-option")[NICHE_MODES.length - 1]?.focus();
      break;
    case "Enter":
    case " ":
      e.preventDefault();
      selectNiche(nicheActiveIdx);
      break;
    case "Escape":
      e.preventDefault();
      setNicheOpen(false);
      nicheTrigger.focus();
      break;
    case "Tab":
      setNicheOpen(false);
      break;
  }
});

document.querySelectorAll(".niche-option").forEach((opt) => {
  opt.addEventListener("click", () => selectNiche(Number(opt.dataset.index)));
});

/* ------------------------- 交互:计时器 ------------------------- */

function stopCountdown() {
  if (countdownTimer !== null) clearInterval(countdownTimer);
  countdownTimer = null;
}

function runCountdown(seconds, onDone) {
  stopCountdown();
  state.remaining = seconds;
  const end = Date.now() + seconds * 1000;
  renderTimerOverlay();
  countdownTimer = setInterval(() => {
    const rem = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    state.remaining = rem;
    if (rem <= 0) {
      stopCountdown();
      onDone();
      return;
    }
    renderTimerOverlay();
  }, 100);
}

function startSpeech() {
  state.phase = "speech";
  runCountdown(state.speechSeconds, () => {
    state.phase = "done";
    renderTimerOverlay();
    playDoneChime();
  });
}

function beginFromIdle() {
  if (!state.landed || state.spinning || timerActive()) return;
  unlockAudio();
  if (state.mode === "deep-research") {
    state.phase = "research";
    runCountdown(state.researchSeconds, () => {
      state.phase = "ready";
      state.remaining = state.speechSeconds;
      renderTimerOverlay();
      playDoneChime();
    });
  } else {
    startSpeech();
  }
}

function finishResearchEarly() {
  stopCountdown();
  state.phase = "ready";
  state.remaining = state.speechSeconds;
  renderTimerOverlay();
  playLandChime();
}

function startSpeechFromReady() {
  startSpeech();
}

function closeTimer() {
  stopCountdown();
  state.phase = "idle";
  state.remaining = state.speechSeconds;
  renderTimerOverlay();
  renderMain();
  if (lastFocusedBeforeTimer) lastFocusedBeforeTimer.focus();
}

document.getElementById("btn-spin").addEventListener("click", spin);
document.getElementById("btn-start").addEventListener("click", beginFromIdle);

document.addEventListener("keydown", (e) => {
  if (timerActive() && e.key === "Escape") closeTimer();
});

/* ------------------------- 交互:设置 ------------------------- */

const settingsWrap = document.getElementById("settings");
const settingsTrigger = document.getElementById("settings-trigger");
const settingsOverlay = document.getElementById("settings-overlay");
const settingsPanel = document.getElementById("settings-panel");

function setSettingsOpen(open) {
  state.settingsOpen = open;
  settingsWrap.classList.toggle("is-open", open);
  settingsOverlay.hidden = !open;
  settingsTrigger.setAttribute("aria-expanded", String(open));
  settingsTrigger.setAttribute("aria-controls", open ? "settings-panel" : "");
  renderMain();
  if (open) {
    settingsPanel.querySelector("input, button")?.focus();
  } else {
    settingsTrigger.focus();
  }
}

settingsTrigger.addEventListener("click", () => setSettingsOpen(!state.settingsOpen));

settingsOverlay.addEventListener("mousedown", (e) => {
  if (e.target === settingsOverlay) setSettingsOpen(false);
});

document.getElementById("settings-mute-input").addEventListener("change", (e) => {
  muted = e.target.checked;
  writeMuted(muted);
});

document.getElementById("settings-done").addEventListener("click", () => setSettingsOpen(false));

/* 焦点陷阱 */
document.addEventListener("keydown", (e) => {
  if (!state.settingsOpen) return;
  if (e.key === "Escape") {
    e.preventDefault();
    setSettingsOpen(false);
    return;
  }
  if (e.key !== "Tab") return;
  const focusables = [...settingsPanel.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")]
    .filter((n) => n.tabIndex !== -1);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

/* ------------------------- 错误处理 ------------------------- */

function showErrorScreen() {
  document.getElementById("root").replaceChildren(
    el("div", { class: "error-screen", role: "alert" },
      el("p", { class: "error-screen-mark", text: "Unprompted" }),
      el("h1", { class: "error-screen-title", text: "出了点问题" }),
      el("p", { class: "error-screen-body", text: "刷新页面继续练习。你的计时设置仍会保留。" }),
      el("button", { type: "button", class: "btn primary", onclick: () => location.reload(), text: "重试" })
    )
  );
}

window.addEventListener("error", showErrorScreen);
window.addEventListener("unhandledrejection", showErrorScreen);

