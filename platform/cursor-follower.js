/* ============================================================
   CURSOR FOLLOWER — Modern interactive mouse effects
   - Smooth glowing outer ring
   - Precise inner dot
   - Magnetic pull on interactive elements
   - Click ripple burst
   - Particle trail on movement
   ============================================================ */

(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return; // skip on touch

  /* ---------- elements ---------- */
  const outer = document.createElement('div');
  const dot   = document.createElement('div');
  outer.className = 'cursor-outer';
  dot.className   = 'cursor-dot';
  document.body.appendChild(outer);
  document.body.appendChild(dot);

  /* ---------- styles ---------- */
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after { cursor: none !important; }

    .cursor-outer {
      position: fixed; top: 0; left: 0;
      width: 36px; height: 36px;
      border: 1.5px solid rgba(59, 130, 246, 0.45);
      border-radius: 50%;
      pointer-events: none;
      z-index: 99999;
      transform: translate(-50%, -50%);
      transition: width 0.35s cubic-bezier(.22,1,.36,1),
                  height 0.35s cubic-bezier(.22,1,.36,1),
                  border-color 0.35s ease,
                  background 0.35s ease,
                  box-shadow 0.35s ease;
      mix-blend-mode: normal;
      will-change: transform;
    }

    .cursor-dot {
      position: fixed; top: 0; left: 0;
      width: 5px; height: 5px;
      background: #3b82f6;
      border-radius: 50%;
      pointer-events: none;
      z-index: 100000;
      transform: translate(-50%, -50%);
      transition: transform 0.12s ease, background 0.3s ease;
      will-change: transform;
    }

    /* --- expand on links & buttons --- */
    .cursor-outer.cursor-hover {
      width: 52px; height: 52px;
      border-color: rgba(59, 130, 246, 0.7);
      background: rgba(59, 130, 246, 0.06);
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
    }
    .cursor-dot.cursor-hover {
      transform: translate(-50%, -50%) scale(1.8);
      background: #60a5fa;
    }

    /* --- magnetic pull state --- */
    .cursor-outer.cursor-magnetic {
      width: 60px; height: 60px;
      border-color: rgba(249, 115, 22, 0.6);
      background: rgba(249, 115, 22, 0.05);
      box-shadow: 0 0 24px rgba(249, 115, 22, 0.12);
    }
    .cursor-dot.cursor-magnetic {
      transform: translate(-50%, -50%) scale(2.2);
      background: #f97316;
    }

    /* --- click ripple --- */
    .cursor-ripple {
      position: fixed;
      width: 10px; height: 10px;
      border-radius: 50%;
      border: 2px solid rgba(59, 130, 246, 0.6);
      pointer-events: none;
      z-index: 99998;
      transform: translate(-50%, -50%) scale(1);
      animation: rippleOut 0.6s cubic-bezier(.22,1,.36,1) forwards;
    }
    .cursor-ripple.click-orange {
      border-color: rgba(249, 115, 22, 0.7);
    }

    @keyframes rippleOut {
      0%   { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(14);  opacity: 0; }
    }

    /* --- particle trail --- */
    .cursor-particle {
      position: fixed;
      width: 4px; height: 4px;
      border-radius: 50%;
      pointer-events: none;
      z-index: 99997;
      transform: translate(-50%, -50%);
      animation: particleFade 0.7s ease-out forwards;
    }
    @keyframes particleFade {
      0%   { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
      100% { opacity: 0;   transform: translate(-50%, -50%) scale(0.2); }
    }

    /* hide on mobile / touch */
    @media (pointer: coarse) {
      .cursor-outer, .cursor-dot { display: none !important; }
    }
  `;
  document.head.appendChild(style);

  /* ---------- state ---------- */
  let mx = -100, my = -100;   // raw mouse
  let ox = -100, oy = -100;   // outer position (lerped)
  let lastParticle = 0;
  let lastPx = -100, lastPy = -100;

  /* ---------- lerp helpers ---------- */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------- magnetic targets ---------- */
  const MAGNETIC_SELECTOR = 'a, button, .card-hover, .exercise-card, input, [data-magnetic]';
  let magneticEl = null;
  let magnetDx = 0, magnetDy = 0;

  /* ---------- events ---------- */
  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;

    // particle trail
    const now = performance.now();
    const dist = Math.hypot(mx - lastPx, my - lastPy);
    if (dist > 12 && now - lastParticle > 40) {
      spawnParticle(mx, my);
      lastParticle = now;
      lastPx = mx;
      lastPy = my;
    }
  });

  document.addEventListener('mousedown', () => {
    spawnRipple(mx, my);
    outer.style.transform = `translate(-50%,-50%) scale(0.85)`;
    setTimeout(() => outer.style.transform = `translate(-50%,-50%) scale(1)`, 120);
  });

  document.addEventListener('mouseover', e => {
    const el = e.target.closest(MAGNETIC_SELECTOR);
    if (el) {
      outer.classList.add('cursor-hover');
      dot.classList.add('cursor-hover');
      magneticEl = el;
    }
  });

  document.addEventListener('mouseout', e => {
    const el = e.target.closest(MAGNETIC_SELECTOR);
    if (el) {
      outer.classList.remove('cursor-hover', 'cursor-magnetic');
      dot.classList.remove('cursor-hover', 'cursor-magnetic');
      magneticEl = null;
      magnetDx = 0;
      magnetDy = 0;
    }
  });

  /* ---------- magnetic pull ---------- */
  document.addEventListener('mousemove', e => {
    if (!magneticEl) { magnetDx = 0; magnetDy = 0; return; }
    const rect = magneticEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    const radius = Math.max(rect.width, rect.height) * 0.6;

    if (dist < radius) {
      const strength = 1 - dist / radius;
      magnetDx = dx * strength * 0.35;
      magnetDy = dy * strength * 0.35;
      magneticEl.classList.add('cursor-magnetic-active');
      outer.classList.add('cursor-magnetic');
      dot.classList.add('cursor-magnetic');
    } else {
      magnetDx = 0;
      magnetDy = 0;
      magneticEl.classList.remove('cursor-magnetic-active');
      outer.classList.remove('cursor-magnetic');
      dot.classList.remove('cursor-magnetic');
    }
  });

  /* ---------- animation loop ---------- */
  let raf;
  function tick() {
    const targetX = mx + magnetDx;
    const targetY = my + magnetDy;

    // smooth lerp for outer ring
    ox = lerp(ox, targetX, 0.12);
    oy = lerp(oy, targetY, 0.12);

    outer.style.left = ox + 'px';
    outer.style.top  = oy + 'px';

    // dot follows more tightly
    dot.style.left = lerp(parseFloat(dot.style.left) || mx, targetX, 0.25) + 'px';
    dot.style.top  = lerp(parseFloat(dot.style.top)  || my, targetY, 0.25) + 'px';

    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  /* ---------- particle spawner ---------- */
  function spawnParticle(x, y) {
    const p = document.createElement('div');
    p.className = 'cursor-particle';
    p.style.left = x + 'px';
    p.style.top  = y + 'px';
    // randomize color between blue/cyan/orange
    const colors = ['#3b82f6', '#22d3ee', '#f97316', '#34d399'];
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.width = (2 + Math.random() * 3) + 'px';
    p.style.height = p.style.width;
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }

  /* ---------- click ripple ---------- */
  function spawnRipple(x, y) {
    const r = document.createElement('div');
    r.className = 'cursor-ripple';
    r.style.left = x + 'px';
    r.style.top  = y + 'px';
    document.body.appendChild(r);
    r.addEventListener('animationend', () => r.remove());

    // second smaller delayed ring
    setTimeout(() => {
      const r2 = document.createElement('div');
      r2.className = 'cursor-ripple';
      r2.style.left = x + 'px';
      r2.style.top  = y + 'px';
      r2.style.animationDuration = '0.5s';
      document.body.appendChild(r2);
      r2.addEventListener('animationend', () => r2.remove());
    }, 80);
  }
})();
