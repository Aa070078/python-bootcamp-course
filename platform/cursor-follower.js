/* ============================================================
   GRID GLOW BACKGROUND — canvas-rendered 50px grid with
   mouse-interactive glow + drifting ambient blobs
   ============================================================ */

(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const CELL = 50;
  const GLOW_COUNT = 6;
  const GLOW_COLORS = ['#3b82f6', '#f97316', '#6366f1', '#22d3ee'];

  const canvas = document.createElement('canvas');
  canvas.id = 'grid-glow-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '0'
  });
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W, H;
  let glows = [];
  let mouseX = -1000, mouseY = -1000;
  let mouseActive = false;
  let mouseAlpha = 0;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    glows = Array.from({ length: GLOW_COUNT }, () => new Glow());
  }

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseActive = true;
  });

  document.addEventListener('mouseleave', function () {
    mouseActive = false;
  });

  class Glow {
    constructor() {
      this.x = Math.floor(Math.random() * (W / CELL)) * CELL;
      this.y = Math.floor(Math.random() * (H / CELL)) * CELL;
      this.targetX = this.x;
      this.targetY = this.y;
      this.radius = Math.random() * 80 + 40;
      this.speed = Math.random() * 0.012 + 0.008;
      this.color = GLOW_COLORS[Math.floor(Math.random() * GLOW_COLORS.length)];
      this.alpha = 0;
      this.setNewTarget();
    }

    setNewTarget() {
      this.targetX = Math.floor(Math.random() * (W / CELL)) * CELL;
      this.targetY = Math.floor(Math.random() * (H / CELL)) * CELL;
    }

    update() {
      this.x += (this.targetX - this.x) * this.speed;
      this.y += (this.targetY - this.y) * this.speed;
      if (Math.abs(this.targetX - this.x) < 1 && Math.abs(this.targetY - this.y) < 1) {
        this.setNewTarget();
      }
      if (this.alpha < 1) this.alpha += 0.008;
    }

    draw() {
      ctx.globalAlpha = this.alpha;
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
      grad.addColorStop(0, this.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawGrid() {
    for (let x = 0; x <= W; x += CELL) {
      for (let y = 0; y <= H; y += CELL) {
        const dx = x - mouseX;
        const dy = y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 250;
        const intensity = mouseActive ? Math.max(0, 1 - dist / maxDist) : 0;
        const baseAlpha = 0.04;
        const alpha = baseAlpha + intensity * 0.35;

        if (intensity > 0.01) {
          const glowIntensity = intensity * 0.5;
          ctx.strokeStyle = 'rgba(59, 130, 246, ' + glowIntensity + ')';
          ctx.lineWidth = 1 + intensity * 1.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + CELL, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + CELL);
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + baseAlpha + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + CELL, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + CELL);
          ctx.stroke();
        }
      }
    }
  }

  function drawMouseGlow() {
    if (!mouseActive) {
      mouseAlpha = Math.max(0, mouseAlpha - 0.05);
    } else {
      mouseAlpha = Math.min(1, mouseAlpha + 0.08);
    }
    if (mouseAlpha <= 0) return;

    ctx.globalAlpha = mouseAlpha;

    const grad1 = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 180);
    grad1.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
    grad1.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 180, 0, Math.PI * 2);
    ctx.fill();

    const grad2 = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 60);
    grad2.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    grad2.addColorStop(1, 'transparent');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawMouseGlow();
    glows.forEach(function (g) { g.update(); g.draw(); });
    requestAnimationFrame(animate);
  }

  resize();
  animate();
  window.addEventListener('resize', resize);
})();
