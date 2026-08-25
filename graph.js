/**
 * Graphing Calculator Engine for Scientific Calculator Pro
 * HTML5 Canvas 2D function plotter with pan, zoom, grid lines, and cursor inspection
 */

class GraphingEngine {
  constructor(canvasId, engine) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.mathEngine = engine || new MathEngine();

    // Viewport State
    this.originX = 0; // In canvas coordinates (center)
    this.originY = 0;
    this.scale = 40; // Pixels per math unit
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.mouseX = 0;
    this.mouseY = 0;

    // Equations to plot: array of { id, expr, color, enabled }
    this.equations = [
      { id: 1, expr: 'sin(x)', color: '#06b6d4', enabled: true },
      { id: 2, expr: 'x^2 - 4', color: '#6366f1', enabled: true }
    ];

    this.initCanvas();
    this.bindEvents();
    this.render();
  }

  initCanvas() {
    this.resizeCanvas();
    this.originX = this.canvas.width / 2;
    this.originY = this.canvas.height / 2;
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth || 800;
      this.canvas.height = Math.max(parent.clientHeight, 480) || 500;
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.render();
    });

    // Mouse Pan
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX - this.originX;
      this.dragStartY = e.clientY - this.originY;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;

      if (this.isDragging) {
        this.originX = e.clientX - this.dragStartX;
        this.originY = e.clientY - this.dragStartY;
        this.render();
      } else {
        // Redraw to update hover coordinate inspector
        this.render();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Zoom on wheel
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      
      // Zoom centered on cursor
      const mathX = (this.mouseX - this.originX) / this.scale;
      const mathY = (this.originY - this.mouseY) / this.scale;

      this.scale = Math.max(5, Math.min(500, this.scale * zoomFactor));

      this.originX = this.mouseX - mathX * this.scale;
      this.originY = this.mouseY + mathY * this.scale;

      this.render();
    }, { passive: false });
  }

  // Convert Math coords to Canvas coords
  toCanvasX(x) {
    return this.originX + x * this.scale;
  }

  toCanvasY(y) {
    return this.originY - y * this.scale;
  }

  // Convert Canvas coords to Math coords
  toMathX(canvasX) {
    return (canvasX - this.originX) / this.scale;
  }

  toMathY(canvasY) {
    return (this.originY - canvasY) / this.scale;
  }

  zoomIn() {
    this.scale *= 1.25;
    this.render();
  }

  zoomOut() {
    this.scale *= 0.8;
    this.render();
  }

  resetView() {
    this.scale = 40;
    this.originX = this.canvas.width / 2;
    this.originY = this.canvas.height / 2;
    this.render();
  }

  // Main Render Loop
  render() {
    if (!this.ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear background
    const isDark = document.documentElement.classList.contains('dark');
    this.ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
    this.ctx.fillRect(0, 0, w, h);

    // Draw Grid Lines & Axes
    this.drawGrid(w, h, isDark);

    // Draw Functions
    this.equations.forEach(eq => {
      if (eq.enabled && eq.expr.trim() !== '') {
        this.drawFunction(eq.expr, eq.color);
      }
    });

    // Draw Hover Inspector Tooltip
    this.drawInspector(w, h, isDark);
  }

  drawGrid(w, h, isDark) {
    const ctx = this.ctx;

    // Calculate grid step (1, 2, 5, 10...) based on scale
    let rawStep = 80 / this.scale;
    let magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    let residual = rawStep / magnitude;
    let step = 1;
    if (residual > 5) step = 10 * magnitude;
    else if (residual > 2) step = 5 * magnitude;
    else step = 2 * magnitude;
    if (step <= 0) step = 1;

    const gridPixelStep = step * this.scale;

    // Grid line styling
    ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(203, 213, 225, 0.6)';
    ctx.lineWidth = 1;
    ctx.font = '11px "Fira Code", monospace';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';

    // Vertical Grid Lines
    const startMathX = Math.floor(-this.originX / gridPixelStep) * step;
    const endMathX = Math.ceil((w - this.originX) / gridPixelStep) * step;

    for (let x = startMathX; x <= endMathX; x += step) {
      const cx = this.toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.stroke();

      // Label X axis tick
      if (Math.abs(x) > 1e-6) {
        const labelY = Math.min(Math.max(this.originY + 15, 20), h - 10);
        ctx.fillText(x.toString(), cx - 8, labelY);
      }
    }

    // Horizontal Grid Lines
    const startMathY = Math.floor((this.originY - h) / gridPixelStep) * step;
    const endMathY = Math.ceil(this.originY / gridPixelStep) * step;

    for (let y = startMathY; y <= endMathY; y += step) {
      const cy = this.toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      // Label Y axis tick
      if (Math.abs(y) > 1e-6) {
        const labelX = Math.min(Math.max(this.originX + 8, 10), w - 30);
        ctx.fillText(y.toString(), labelX, cy + 4);
      }
    }

    // Draw Main X & Y Axes (Thicker)
    ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 2;

    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, this.originY);
    ctx.lineTo(w, this.originY);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(this.originX, 0);
    ctx.lineTo(this.originX, h);
    ctx.stroke();

    // Origin (0,0) label
    ctx.fillText('0', this.originX - 12, this.originY + 15);
  }

  drawFunction(expr, color) {
    const ctx = this.ctx;
    const w = this.canvas.width;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let started = false;
    const stepPx = 2; // Evaluate every 2 pixels for smooth performance

    // Save current angle mode and enforce RAD for graphing functions standard x
    const prevMode = this.mathEngine.angleMode;
    this.mathEngine.setAngleMode('RAD');

    for (let cx = 0; cx <= w; cx += stepPx) {
      const mathX = this.toMathX(cx);
      
      // Substitute x in expression
      let evalExpr = expr.replace(/x/g, `(${mathX})`);
      const res = this.mathEngine.calculate(evalExpr);

      if (res.success && res.numeric !== null && !isNaN(res.numeric) && isFinite(res.numeric)) {
        const cy = this.toCanvasY(res.numeric);

        // Prevent drawing wild asymptote spikes (e.g. tan(x))
        if (cy >= -1000 && cy <= this.canvas.height + 1000) {
          if (!started) {
            ctx.moveTo(cx, cy);
            started = true;
          } else {
            ctx.lineTo(cx, cy);
          }
        } else {
          started = false;
        }
      } else {
        started = false;
      }
    }

    ctx.stroke();
    this.mathEngine.setAngleMode(prevMode);
  }

  drawInspector(w, h, isDark) {
    if (this.mouseX < 0 || this.mouseX > w || this.mouseY < 0 || this.mouseY > h) return;

    const mathX = this.toMathX(this.mouseX);
    const mathY = this.toMathY(this.mouseY);

    const ctx = this.ctx;

    // Draw crosshair
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(this.mouseX, 0);
    ctx.lineTo(this.mouseX, h);
    ctx.moveTo(0, this.mouseY);
    ctx.lineTo(w, this.mouseY);
    ctx.stroke();

    ctx.setLineDash([]); // Reset line dash

    // Draw coordinate pill tag
    const coordText = `(${mathX.toFixed(2)}, ${mathY.toFixed(2)})`;
    ctx.font = '12px "Fira Code", monospace';
    const textWidth = ctx.measureText(coordText).width;

    const badgeX = Math.min(Math.max(this.mouseX + 12, 10), w - textWidth - 20);
    const badgeY = Math.min(Math.max(this.mouseY - 12, 25), h - 10);

    ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(badgeX - 6, badgeY - 14, textWidth + 12, 20, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.fillText(coordText, badgeX, badgeY);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GraphingEngine;
} else {
  window.GraphingEngine = GraphingEngine;
}
