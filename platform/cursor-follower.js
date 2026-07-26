/* ============================================================
   GRID MOUSE GLOW — canvas-rendered 50px grid with soft
   dark-red radial glow that follows the cursor
   ============================================================ */

(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const CELL = 50;
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

  /* mouse tracking */
  let mx = -300, my = -300;
  let smoothX = -300, smoothY = -300;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('mouseleave', () => { mx = -300; my = -300; });

  /* glow layer — rendered once per frame */
  const glowCanvas = document.createElement('canvas');
  const glowCtx = glowCanvas.getContext('2d');

  function tick() {
    // smooth follow for the glow
    smoothX += (mx - smoothX) * 0.06;
    smoothY += (my - smoothY) * 0.06;

    /* --- draw grid --- */
    ctx.clearRect(0, 0, W, H);

    // grid line color (matches original CSS: rgba(59,130,246,0.03))
    const gridColor = 'rgba(59, 130, 246, 0.035)';
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // vertical lines
    for (let x = 0; x <= W; x += CELL) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
      ctx.stroke();
    }
    // horizontal lines
    for (let y = 0; y <= H; y += CELL) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
      ctx.stroke();
    }

    /* --- draw mouse glow on separate canvas --- */
    glowCanvas.width = W;
    glowCanvas.height = H;

    if (smoothX > -100) {
      const R = 220; // glow radius — big
      const grad = glowCtx.createRadialGradient(smoothX, smoothY, 0, smoothX, smoothY, R);
      grad.addColorStop(0, 'rgba(200, 30, 30, 0.10)');
      grad.addColorStop(0.25, 'rgba(160, 25, 25, 0.07)');
      grad.addColorStop(0.5, 'rgba(120, 20, 20, 0.035)');
      grad.addColorStop(0.75, 'rgba(80, 12, 12, 0.015)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      glowCtx.fillStyle = grad;
      glowCtx.beginPath();
      glowCtx.arc(smoothX, smoothY, R, 0, Math.PI * 2);
      glowCtx.fill();

      // inner brighter core
      const coreR = 80;
      const core = glowCtx.createRadialGradient(smoothX, smoothY, 0, smoothX, smoothY, coreR);
      core.addColorStop(0, 'rgba(220, 40, 40, 0.08)');
      core.addColorStop(0.5, 'rgba(180, 30, 30, 0.03)');
      core.addColorStop(1, 'rgba(0, 0, 0, 0)');
      glowCtx.fillStyle = core;
      glowCtx.beginPath();
      glowCtx.arc(smoothX, smoothY, coreR, 0, Math.PI * 2);
      glowCtx.fill();

      // composite glow onto grid (lighter = additive)
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(glowCanvas, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
