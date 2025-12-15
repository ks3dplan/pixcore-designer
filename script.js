/* ===============================
   基本状态
================================ */
let undoStack = [];
let redoStack = [];

let isPainting = false;
let currentStroke = null;

const grid = document.getElementById("grid");

let GRID = {
  cols: 10,
  rows: 15
};

let currentColor = "black";

/* ===============================
   建立网格
================================ */
function buildGrid() {
  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${GRID.cols}, var(--cell-size))`;

  for (let r = 0; r < GRID.rows; r++) {
    for (let c = 0; c < GRID.cols; c++) {
      const pixel = document.createElement("div");
      pixel.className = "pixel white";

      const rowLabel = String.fromCharCode(65 + r);
      const colLabel = c + 1;
      pixel.dataset.label = `${rowLabel}${colLabel}`;
      pixel.dataset.color = "white";

      /* ===== 桌面 ===== */
      pixel.addEventListener("mousedown", () => {
        startStroke();
        paintPixel(pixel);
      });

      pixel.addEventListener("mouseenter", () => {
        if (isPainting) paintPixel(pixel);
      });

      /* ===== 手机：单指画，双指交给浏览器 ===== */
      pixel.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) return;

        startStroke();
        paintPixel(pixel);
      });

      pixel.addEventListener(
        "touchmove",
        (e) => {
          if (!isPainting) return;
          if (e.touches.length !== 1) return;

          const t = e.touches[0];
          const el = document.elementFromPoint(t.clientX, t.clientY);
          if (el && el.classList.contains("pixel")) {
            paintPixel(el);
          }
        },
        { passive: true } // ⭐ 允许双指滚动
      );

      grid.appendChild(pixel);
    }
  }
}

/* ===============================
   开始 / 结束一笔
================================ */
function startStroke() {
  isPainting = true;
  currentStroke = {
    actions: [],
    changed: new Set()
  };
}

function finishStroke() {
  if (!isPainting) return;

  isPainting = false;

  if (currentStroke && currentStroke.actions.length > 0) {
    undoStack.push(currentStroke);
    redoStack = [];
  }

  currentStroke = null;
}

document.addEventListener("mouseup", finishStroke);
document.addEventListener("touchend", finishStroke);

/* ===============================
   上色逻辑
================================ */
function paintPixel(pixel) {
  if (!currentStroke) return;

  const prevColor = pixel.dataset.color || "white";
  if (prevColor === currentColor) return;
  if (currentStroke.changed.has(pixel)) return;

  currentStroke.changed.add(pixel);

  currentStroke.actions.push({
    pixel,
    from: prevColor,
    to: currentColor
  });

  pixel.className = `pixel ${currentColor}`;
  pixel.dataset.color = currentColor;
}

/* ===============================
   Undo / Redo（整笔）
================================ */
function undo() {
  const stroke = undoStack.pop();
  if (!stroke) return;

  redoStack.push(stroke);

  stroke.actions.forEach(a => {
    a.pixel.className = `pixel ${a.from}`;
    a.pixel.dataset.color = a.from;
  });
}

function redo() {
  const stroke = redoStack.pop();
  if (!stroke) return;

  undoStack.push(stroke);

  stroke.actions.forEach(a => {
    a.pixel.className = `pixel ${a.to}`;
    a.pixel.dataset.color = a.to;
  });
}

/* ===============================
   工具
================================ */
function setColor(color) {
  currentColor = color;

  document.querySelectorAll(".color").forEach(btn => {
    btn.classList.remove("active");
  });

  const activeBtn = document.querySelector(`.color.${color}`);
  if (activeBtn) activeBtn.classList.add("active");
}

function eraseAll() {
  document.querySelectorAll(".pixel").forEach(p => {
    p.className = "pixel white";
    p.dataset.color = "white";
  });

  undoStack = [];
  redoStack = [];
}

function setOrientation(mode) {
  if (mode === "portrait") {
    GRID = { cols: 10, rows: 15 };
  } else {
    GRID = { cols: 15, rows: 10 };
  }

  buildGrid();
}

/* ===============================
   导出 PNG
================================ */
function exportPNG() {
  const exportArea = document.getElementById("export-area");
  const gridEl = document.getElementById("grid");

  exportArea.style.width = gridEl.scrollWidth + "px";
  exportArea.style.height = gridEl.scrollHeight + "px";

  html2canvas(exportArea, {
    backgroundColor: "#ffffff",
    scale: 3
  }).then(canvas => {
    const link = document.createElement("a");
    link.download = "pixcore-design.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

/* ===============================
   初始化
================================ */
buildGrid();
setColor("black");

if ("ontouchstart" in window && !localStorage.getItem("touchTipShown")) {
  alert("How to use:\n• One finger: Draw\n• Two fingers: Scroll / Zoom");
  localStorage.setItem("touchTipShown", "1");
}