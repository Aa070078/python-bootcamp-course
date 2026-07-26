/* ============================================================
   GRID GLOW BACKGROUND — canvas-rendered 50px grid with
   mouse-interactive glow + drifting ambient blobs
   Theme-reactive: adapts colors to dark/light mode
   ============================================================ */

(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const CELL = 50;
  const GLOW_COUNT = 8;
  const GLOW_COLORS = ['#3b82f6', '#f97316', '#6366f1', '#f97316', '#22d3ee', '#fb923c', '#3b82f6', '#f97316'];

  function getThemeColors() {
    const isLight = document.documentElement.dataset.theme === 'light';
    return {
      gridBase: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)',
      gridActive: isLight ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.5)',
      mouseGlowInner: isLight ? 'rgba(249, 115, 22, 0.12)' : 'rgba(249, 115, 22, 0.25)',
      mouseGlowMid: isLight ? 'rgba(251, 146, 60, 0.04)' : 'rgba(251, 146, 60, 0.08)',
      mouseWhiteGlow: isLight ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.12)',
      blobAlpha: isLight ? 0.3 : 0.7,
    };
  }

  let colors = getThemeColors();

  const observer = new MutationObserver(function() {
    colors = getThemeColors();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

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
      this.vx = 0;
      this.vy = 0;
      this.radius = Math.random() * 80 + 40;
      this.baseRadius = this.radius;
      this.speed = Math.random() * 0.012 + 0.008;
      this.color = GLOW_COLORS[Math.floor(Math.random() * GLOW_COLORS.length)];
      this.alpha = 0;
      this.fleeing = false;
      this.setNewTarget();
    }

    setNewTarget() {
      this.targetX = Math.floor(Math.random() * (W / CELL)) * CELL;
      this.targetY = Math.floor(Math.random() * (H / CELL)) * CELL;
    }

    update() {
      var dx = this.x - mouseX;
      var dy = this.y - mouseY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var fleeRadius = 220;

      if (mouseActive && dist < fleeRadius && dist > 0) {
        this.fleeing = true;
        var force = (1 - dist / fleeRadius) * 8;
        this.vx += (dx / dist) * force;
        this.vy += (dy / dist) * force;
        this.radius = this.baseRadius + (1 - dist / fleeRadius) * 40;
      } else {
        this.fleeing = false;
        this.radius += (this.baseRadius - this.radius) * 0.03;
      }

      if (!this.fleeing) {
        this.vx += (this.targetX - this.x) * this.speed * 0.1;
        this.vy += (this.targetY - this.y) * this.speed * 0.1;
        if (Math.abs(this.targetX - this.x) < 1 && Math.abs(this.targetY - this.y) < 1) {
          this.setNewTarget();
        }
      }

      this.vx *= 0.92;
      this.vy *= 0.92;
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < -200) this.x = W + 100;
      if (this.x > W + 200) this.x = -100;
      if (this.y < -200) this.y = H + 100;
      if (this.y > H + 200) this.y = -100;

      if (this.alpha < 1) this.alpha += 0.008;
    }

    draw() {
      ctx.globalAlpha = this.alpha * colors.blobAlpha;
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

        if (intensity > 0.01) {
          const glowIntensity = intensity * 0.5;
          ctx.strokeStyle = colors.gridActive.replace(/[\d.]+\)$/, glowIntensity + ')');
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
          ctx.strokeStyle = colors.gridBase;
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
    grad1.addColorStop(0, colors.mouseGlowInner);
    grad1.addColorStop(0.5, colors.mouseGlowMid);
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 180, 0, Math.PI * 2);
    ctx.fill();

    const grad2 = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 60);
    grad2.addColorStop(0, colors.mouseWhiteGlow);
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
