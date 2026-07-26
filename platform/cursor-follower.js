/* ============================================================
   BACKGROUND MOUSE GLOW — soft dark-red light follows the cursor
   Canvas-based, no custom cursor, pure ambient background effect
   ============================================================ */

(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'mouse-glow-canvas';
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

  /* trail points — ring buffer of recent positions */
  const TRAIL_LEN = 28;
  const trail = [];
  let mx = -200, my = -200;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    mx = -200;
    my = -200;
  });

  /* animation loop */
  function tick() {
    // fade canvas slightly each frame (creates the fade-out trail)
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, W, H);

    // add current position to trail
    trail.push({ x: mx, y: my, life: 1 });
    if (trail.length > TRAIL_LEN) trail.shift();

    // draw each trail point as a soft radial gradient
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      // older points fade more
      const progress = i / trail.length;
      const radius = 120 + progress * 140;
      const alpha = progress * 0.06;

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      grad.addColorStop(0, `rgba(180, 30, 30, ${alpha})`);
      grad.addColorStop(0.4, `rgba(140, 20, 20, ${alpha * 0.5})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
