/* ============================================================
   GRID GLOW BACKGROUND — canvas-rendered 50px grid with
   drifting radial glow blobs (inspired by 21st.dev GridGlowBackground)
   ============================================================ */

(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const CELL = 50;
  const GLOW_COUNT = 8;
  const GLOW_COLORS = ['#3b82f6', '#f97316', '#3b82f6', '#6366f1'];

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

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    glows = Array.from({ length: GLOW_COUNT }, () => new Glow());
  }

  class Glow {
    constructor() {
      this.x = Math.floor(Math.random() * (W / CELL)) * CELL;
      this.y = Math.floor(Math.random() * (H / CELL)) * CELL;
      this.targetX = this.x;
      this.targetY = this.y;
      this.radius = Math.random() * 80 + 40;
      this.speed = Math.random() * 0.015 + 0.01;
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
      if (this.alpha < 1) this.alpha += 0.01;
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += CELL) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += CELL) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    glows.forEach(g => { g.update(); g.draw(); });
    requestAnimationFrame(animate);
  }

  resize();
  animate();
  window.addEventListener('resize', resize);
})();
