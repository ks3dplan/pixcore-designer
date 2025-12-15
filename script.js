/* ===============================
   全局状态
================================ */
let undoStack = [];
let redoStack = [];

let isPainting = false;
let currentStroke = null;

let scale = 1;
let offsetX = 0;
let offsetY = 0;

let isPanning = false;
let panStart = { x: 0, y: 0 };

let lastTouchDistance = null;
let lastTouchCenter = null;

const grid = document.getElementById("grid");

let GRID = { cols: 10, rows: 15 };
let currentColor = "black";

/* ===============================
   Transform
================================ */
function updateTransform() {
  grid.style.transform =
    `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

/* ===============================
   建立网格
================================ */
function buildGrid() {
  grid.innerHTML = "";
  grid.style.gridTemplateColumns =
    `repeat(${GRID.cols}, var(--cell-size))`;

  for (let r = 0; r < GRID.rows; r++) {
    for (let c = 0; c < GRID.cols; c++) {
      const p = document.createElement("div");
      p.className = "pixel white";
      p.dataset.color = "white";
      p.dataset.label = `${String.fromCharCode(65 + r)}${c + 1}`;

      // 桌面画画
      p.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        startStroke();
        paintPixel(p);
      });

      p.addEventListener("mouseenter", () => {
        if (isPainting) paintPixel(p);
      });

      // 手机单指画
      p.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) return;
        startStroke();
        paintPixel(p);
      }, { passive: true });

      p.addEventListener("touchmove", (e) => {
        if (!isPainting || e.touches.length !== 1) return;
        const t = e.touches[0];
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (el?.classList.contains("pixel")) paintPixel(el);
      }, { passive: true });

      grid.appendChild(p);
    }
  }

  updateTransform();
}

/* ===============================
   笔画
================================ */
function startStroke() {
  isPainting = true;
  currentStroke = { actions: [], changed: new Set() };
}

function finishStroke() {
  if (!isPainting) return;
  isPainting = false;

  if (currentStroke.actions.length) {
    undoStack.push(currentStroke);
    redoStack = [];
  }

  currentStroke = null;
}

document.addEventListener("mouseup", finishStroke);
document.addEventListener("touchend", () => {
  finishStroke();
  lastTouchDistance = null;
  lastTouchCenter = null;
});

/* ===============================
   上色
================================ */
function paintPixel(p) {
  if (!currentStroke) return;
  if (p.dataset.color === currentColor) return;
  if (currentStroke.changed.has(p)) return;

  currentStroke.changed.add(p);
  currentStroke.actions.push({
    pixel: p,
    from: p.dataset.color,
    to: currentColor
  });

  p.className = `pixel ${currentColor}`;
  p.dataset.color = currentColor;
}

function setColor(color) {
  currentColor = color;

  document.querySelectorAll(".color").forEach(btn => {
    btn.classList.remove("active");
  });

  const btn = document.querySelector(`.color.${color}`);
  if (btn) btn.classList.add("active");
}

/* ===============================
   手机：双指缩放 / 拖动画布
================================ */
grid.addEventListener("touchmove", (e) => {
  if (e.touches.length !== 2) return;
  e.preventDefault();

  isPainting = false;
  currentStroke = null;

  const [t1, t2] = e.touches;
  const dx = t2.clientX - t1.clientX;
  const dy = t2.clientY - t1.clientY;
  const dist = Math.hypot(dx, dy);

  const cx = (t1.clientX + t2.clientX) / 2;
  const cy = (t1.clientY + t2.clientY) / 2;

  if (lastTouchDistance) {
    scale *= dist / lastTouchDistance;
    scale = Math.min(Math.max(scale, 0.5), 4);
  }

  if (lastTouchCenter) {
    offsetX += cx - lastTouchCenter.x;
    offsetY += cy - lastTouchCenter.y;
  }

  lastTouchDistance = dist;
  lastTouchCenter = { x: cx, y: cy };

  updateTransform();
}, { passive: false });

/* ===============================
   缩放 / 平移
================================ */

// 滚轮缩放（电脑）
grid.addEventListener("wheel", (e) => {
  e.preventDefault();

  const prev = scale;
  scale += -e.deltaY * 0.001;
  scale = Math.min(Math.max(scale, 0.5), 4);

  const rect = grid.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  offsetX -= mx * (scale / prev - 1);
  offsetY -= my * (scale / prev - 1);

  updateTransform();
}, { passive: false });

/* ===============================
   电脑：右键拖动画布
================================ */
grid.addEventListener("mousedown", (e) => {
  if (e.button !== 2) return;

  isPanningMouse = true;
  lastMouse = { x: e.clientX, y: e.clientY };
  e.preventDefault();
});

document.addEventListener("mousemove", (e) => {
  if (!isPanningMouse) return;

  offsetX += e.clientX - lastMouse.x;
  offsetY += e.clientY - lastMouse.y;
  lastMouse = { x: e.clientX, y: e.clientY };

  updateTransform();
});

document.addEventListener("mouseup", () => {
  isPanningMouse = false;
  lastMouse = null;
});

grid.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

/* ===============================
   Undo / Redo
================================ */
function undo() {
  const stroke = undoStack.pop();
  if (!stroke) return;

  redoStack.push(stroke);
  stroke.actions.forEach(a => {
    a.pixel.classList.remove(
      "white","black","gray","red","orange",
      "yellow","green","blue","pink","purple"
    );
    a.pixel.classList.add(a.from);
    a.pixel.dataset.color = a.from;
  });
}

function redo() {
  const stroke = redoStack.pop();
  if (!stroke) return;

  undoStack.push(stroke);
  stroke.actions.forEach(a => {
    a.pixel.classList.remove(
      "white","black","gray","red","orange",
      "yellow","green","blue","pink","purple"
    );
    a.pixel.classList.add(a.to);
    a.pixel.dataset.color = a.to;
  });
}

/* ===============================
   工具
================================ */
function setOrientation(mode) {
  GRID = mode === "portrait"
    ? { cols: 10, rows: 15 }
    : { cols: 15, rows: 10 };
  buildGrid();
}

/* ===============================
   初始化
================================ */
buildGrid();
setColor("black");

if ("ontouchstart" in window && !localStorage.getItem("touchTipShown")) {
  alert("How to use:\n• One finger: Draw\n• Two fingers: Zoom & Pan");
  localStorage.setItem("touchTipShown", "1");
}