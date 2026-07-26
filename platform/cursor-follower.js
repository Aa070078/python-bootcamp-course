/* ============================================================
   GRID MOUSE GLOW TRAIL — canvas-rendered 50px grid with
   dark-red glow that traces the cursor's movement path
   ============================================================ */

(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const CELL = 50;
  const TRAIL_LEN = 35;

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

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* mouse */
  let mx = -300, my = -300;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('mouseleave', () => { mx = -300; my = -300; });

  /* trail buffer */
  const trail = [];

  /* offscreen glow canvas */
  const glowCanvas = document.createElement('canvas');
  const glowCtx = glowCanvas.getContext('2d');

  function tick() {
    /* --- fade layer (creates trailing decay) --- */
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, W, H);

    /* --- draw grid --- */
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.025)';
    ctx.lineWidth = 1;
    ctx.globalCompositeOperation = 'source-over';

    for (let x = 0; x <= W; x += CELL) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += CELL) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
      ctx.stroke();
    }

    /* --- record trail --- */
    trail.push({ x: mx, y: my });
    if (trail.length > TRAIL_LEN) trail.shift();

    /* --- draw trail glows on offscreen canvas --- */
    glowCanvas.width = W;
    glowCanvas.height = H;

    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const t = i / trail.length; // 0 = oldest, 1 = newest

      const radius = 50 + t * 120;        // 50px → 170px
      const alpha  = 0.006 + t * 0.04;    // 0.006 → 0.046

      const grad = glowCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      grad.addColorStop(0, `rgba(180, 25, 25, ${alpha})`);
      grad.addColorStop(0.35, `rgba(130, 18, 18, ${alpha * 0.5})`);
      grad.addColorStop(0.65, `rgba(80, 12, 12, ${alpha * 0.2})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      glowCtx.fillStyle = grad;
      glowCtx.beginPath();
      glowCtx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      glowCtx.fill();
    }

    /* --- composite glow trail onto main canvas --- */
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(glowCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
