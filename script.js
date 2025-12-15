let undoStack = [];
let redoStack = [];

let isPainting = false;
let currentStroke = null; // ⭐ 当前这一笔

const CELL_SIZE = 30; // 如果要手机小一点，改成 24

const grid = document.getElementById("grid");

/* ====== 网格尺寸 ====== */
let GRID = {
  cols: 10,
  rows: 15
};
/* ===================== */

let currentColor = "black";

 function buildGrid() {
  grid.innerHTML = "";

  grid.style.gridTemplateColumns = `repeat(${GRID.cols}, 30px)`;

  for (let r = 0; r < GRID.rows; r++) {
    for (let c = 0; c < GRID.cols; c++) {
      const pixel = document.createElement("div");
      pixel.className = "pixel white";

      const rowLabel = String.fromCharCode(65 + r);
      const colLabel = c + 1;
      pixel.dataset.label = `${rowLabel}${colLabel}`;

pixel.addEventListener("mousedown", () => {
  isPainting = true;

  currentStroke = {
    actions: [],
    changed: new Set()
  };

  // ⭐ 延后一拍，确保被记录进 stroke
  setTimeout(() => paintPixel(pixel), 0);
});

pixel.addEventListener("mouseenter", () => {
  if (isPainting) {
    paintPixel(pixel);
  }
});

/* 📱 手机 */
/* ===== 手机：pixel 只处理单指画 ===== */

pixel.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;

  e.preventDefault(); // 阻止单指滚动

  isPainting = true;
  currentStroke = {
    actions: [],
    changed: new Set()
  };

  paintPixel(pixel);
});

pixel.addEventListener(
  "touchmove",
  (e) => {
    if (!isPainting) return;
    if (e.touches.length !== 1) return;

    e.preventDefault();

    const t = e.touches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el && el.classList.contains("pixel")) {
      paintPixel(el);
    }
  },
  { passive: false }
);

      grid.appendChild(pixel);
    }
  }
}

if ("ontouchstart" in window && !localStorage.getItem("touchTipShown")) {
  alert("How to Used：\n One-finger(Draw)\n Two-finger(Scroll / Zoom)");
  localStorage.setItem("touchTipShown", "1");
}

/* ===== 结束拖拉 ===== */
document.addEventListener("mouseup", finishStroke);
document.addEventListener("touchend", finishStroke);

function finishStroke() {
  if (!isPainting) return;
  isPainting = false;

  if (currentStroke && currentStroke.actions.length > 0) {
    undoStack.push(currentStroke);
    redoStack = [];
  }

  currentStroke = null;
}

/* ===== 上色函数 ===== */
function paintPixel(pixel) {
  if (!currentStroke) return;

  const prevColor = pixel.dataset.color || "white";
  if (prevColor === currentColor) return;

  // 防止同一格在同一笔里被记录多次
  if (currentStroke.changed.has(pixel)) return;

  currentStroke.changed.add(pixel);

  currentStroke.actions.push({
    pixel,
    from: prevColor,
    to: currentColor
  });

  pixel.classList.remove(
  "white",
  "black",
  "gray",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "pink",
  "purple"
);

  pixel.classList.add(currentColor);
  pixel.dataset.color = currentColor;
}

function undo() {
  const stroke = undoStack.pop();
  if (!stroke) return;

  redoStack.push(stroke);

  stroke.actions.forEach(action => {
    action.pixel.classList.remove(
      "white","black","gray","red", "orange", "yellow", "green","blue","pink", "purple"
    );
    action.pixel.classList.add(action.from);
    action.pixel.dataset.color = action.from;
  });
}

function redo() {
  const stroke = redoStack.pop();
  if (!stroke) return;

  undoStack.push(stroke);

  stroke.actions.forEach(action => {
    action.pixel.classList.remove(
      "white","black","gray","red", "orange", "yellow", "green","blue","pink", "purple"
    );
    action.pixel.classList.add(action.to);
    action.pixel.dataset.color = action.to;
  });
}

/* ===== 选择颜色 ===== */
function setColor(color) {
  currentColor = color;

  // 移除所有颜色按钮的 active
  document.querySelectorAll(".color").forEach(btn => {
    btn.classList.remove("active");
  });

  // 给当前点击的颜色按钮加 active
  const activeBtn = document.querySelector(`.color.${color}`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
}

/* ===== 导出 PNG ===== */
function exportPNG() {
  const exportArea = document.getElementById("export-area");
  const grid = document.getElementById("grid");

  // ⭐ 强制 export-area 跟 grid 一样大
  exportArea.style.width = grid.scrollWidth + "px";
  exportArea.style.height = grid.scrollHeight + "px";

  html2canvas(exportArea, {
    backgroundColor: "#ffffff",
    scale: 3,
    useCORS: true
  }).then(canvas => {
    const link = document.createElement("a");
    link.download = "pixcore-design.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

function setOrientation(mode) {
  if (mode === "portrait") {
    GRID.cols = 10;
    GRID.rows = 15;
  }

  if (mode === "landscape") {
    GRID.cols = 15;
    GRID.rows = 10;
  }

  buildGrid();
}

// ⭐⭐ 非常重要：第一次载入要执行一次
buildGrid();

setColor("black");