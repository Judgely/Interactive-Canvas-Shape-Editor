/**
 * script.js – Interactive Canvas Shape Editor
 * Allows users to create, select, move, resize, and delete circles.
 *
 * Rules followed:
 *  - External JS only (no inline event handlers)
 *  - All addEventListener calls use anonymous functions
 *  - Vanilla JavaScript — no libraries or frameworks
 */

// ─────────────────────────────────────────────
// 1. CANVAS SETUP
// ─────────────────────────────────────────────

const canvas = document.getElementById('myCanvas');
const ctx    = canvas.getContext('2d');

// UI status elements
const circleCountEl  = document.getElementById('circleCount');
const selectedInfoEl = document.getElementById('selectedInfo');
const statusMsgEl    = document.getElementById('statusMsg');

// Default circle settings
const DEFAULT_RADIUS = 20;
const MIN_RADIUS     = 5;
const RESIZE_STEP    = 3;       // pixels changed per scroll tick
const COLOR_NORMAL   = '#4fc3f7'; // blue
const COLOR_SELECTED = '#f44336'; // red

// Array that holds all circle objects
let circles = [];

// Index of the currently selected circle (-1 = none)
let selectedIndex = -1;

// Drag state
let isDragging  = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// ─────────────────────────────────────────────
// 2. HELPERS
// ─────────────────────────────────────────────

/**
 * Returns the mouse position relative to the canvas element.
 * Accounts for canvas CSS scaling vs. its internal resolution.
 */
function getCanvasPos(e) {
  const rect  = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top)  * scaleY
  };
}

/**
 * Returns true if point (px, py) is inside the circle at index i.
 */
function pointInCircle(px, py, circle) {
  const dx = px - circle.x;
  const dy = py - circle.y;
  return Math.sqrt(dx * dx + dy * dy) <= circle.r;
}

/**
 * Finds the topmost circle (last drawn) that contains (px, py).
 * Returns the index or -1.
 */
function findCircleAt(px, py) {
  for (let i = circles.length - 1; i >= 0; i--) {
    if (pointInCircle(px, py, circles[i])) return i;
  }
  return -1;
}

/** Updates the status bar text. */
function updateStatus() {
  circleCountEl.textContent = circles.length;
  if (selectedIndex === -1) {
    selectedInfoEl.textContent = 'none';
  } else {
    const c = circles[selectedIndex];
    selectedInfoEl.textContent = `#${selectedIndex + 1}  r=${c.r}px`;
  }
}

/** Shows a brief message in the status bar. */
function flashMsg(msg) {
  statusMsgEl.textContent = msg;
  clearTimeout(flashMsg._timer);
  flashMsg._timer = setTimeout(function() {
    statusMsgEl.textContent = '';
  }, 1800);
}

// ─────────────────────────────────────────────
// 3. DRAW / RENDER
// ─────────────────────────────────────────────

/**
 * Clears the canvas and redraws every circle.
 * Selected circle is drawn in red with a dark outline.
 */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  circles.forEach(function(circle, index) {
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);

    // Fill
    ctx.fillStyle = (index === selectedIndex) ? COLOR_SELECTED : COLOR_NORMAL;
    ctx.fill();

    // Outline — thicker for selected
    ctx.strokeStyle = (index === selectedIndex) ? '#b71c1c' : '#1565c0';
    ctx.lineWidth   = (index === selectedIndex) ? 3 : 1.5;
    ctx.stroke();
  });

  updateStatus();
}

// ─────────────────────────────────────────────
// 4. MOUSE DOWN  – select or add circle
// ─────────────────────────────────────────────

canvas.addEventListener('mousedown', function(e) {
  const pos   = getCanvasPos(e);
  const found = findCircleAt(pos.x, pos.y);

  if (found !== -1) {
    // ── SELECT an existing circle ──
    selectedIndex = found;
    isDragging    = true;
    dragOffsetX   = pos.x - circles[found].x;
    dragOffsetY   = pos.y - circles[found].y;
    flashMsg('Circle selected — drag to move, scroll to resize, Delete to remove.');
  } else {
    // ── ADD a new circle on blank space ──
    selectedIndex = -1;   // deselect any previous
    circles.push({ x: pos.x, y: pos.y, r: DEFAULT_RADIUS });
    flashMsg('Circle added!');
  }

  draw();
});

// ─────────────────────────────────────────────
// 5. MOUSE MOVE  – drag selected circle
// ─────────────────────────────────────────────

canvas.addEventListener('mousemove', function(e) {
  if (!isDragging || selectedIndex === -1) return;

  const pos = getCanvasPos(e);

  // Move the selected circle, keeping the grab offset consistent
  circles[selectedIndex].x = pos.x - dragOffsetX;
  circles[selectedIndex].y = pos.y - dragOffsetY;

  draw();
});

// ─────────────────────────────────────────────
// 6. MOUSE UP  – stop dragging
// ─────────────────────────────────────────────

canvas.addEventListener('mouseup', function() {
  isDragging = false;
});

// Also stop dragging if mouse leaves the canvas
canvas.addEventListener('mouseleave', function() {
  isDragging = false;
});

// ─────────────────────────────────────────────
// 7. SCROLL / WHEEL  – resize selected circle
// ─────────────────────────────────────────────

canvas.addEventListener('wheel', function(e) {
  // Prevent page from scrolling while resizing
  e.preventDefault();

  if (selectedIndex === -1) return;

  const circle = circles[selectedIndex];

  if (e.deltaY < 0) {
    // Scroll up → increase radius
    circle.r += RESIZE_STEP;
    flashMsg('Radius: ' + circle.r + 'px ▲');
  } else {
    // Scroll down → decrease radius (clamp to minimum)
    circle.r = Math.max(MIN_RADIUS, circle.r - RESIZE_STEP);
    flashMsg('Radius: ' + circle.r + 'px ▼');
  }

  draw();
}, { passive: false }); // passive:false required to call preventDefault()

// ─────────────────────────────────────────────
// 8. KEYBOARD  – delete selected circle
// ─────────────────────────────────────────────

document.addEventListener('keydown', function(e) {
  if (e.key === 'Delete' && selectedIndex !== -1) {
    circles.splice(selectedIndex, 1);
    selectedIndex = -1;
    isDragging    = false;
    flashMsg('Circle deleted.');
    draw();
  }
});

// ─────────────────────────────────────────────
// 9. INITIAL RENDER
// ─────────────────────────────────────────────

// Draw empty canvas on load so the white background is visible
draw();
