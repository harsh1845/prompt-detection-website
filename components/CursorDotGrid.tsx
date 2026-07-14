"use client";

import { useEffect, useRef } from "react";

const DOT_COUNT = 95;

type Radii = {
  outer: number;
  peak: number;
  inner: number;
};

type Dot = {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  rFactor: number;
  phase: number;
  speed: number;
  radius: number;
  aspect: number;
  angle: number;
  fill: string;
  weight: number;
  lag: number;
  ready: boolean;
};

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Donut: fade in at outer → peak band → fade out near cursor */
function ringProfile(dist: number, r: Radii) {
  if (dist >= r.outer || dist <= 0) return 0;

  if (dist < r.inner) {
    const t = dist / r.inner;
    return t * t * 0.28;
  }

  if (dist <= r.peak) {
    const t = (dist - r.inner) / Math.max(1, r.peak - r.inner);
    const s = t * t * (3 - 2 * t);
    return 0.28 + s * 0.72;
  }

  const t = 1 - (dist - r.peak) / Math.max(1, r.outer - r.peak);
  return Math.max(0, t * t * (3 - 2 * t));
}

export default function CursorDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const radiiRef = useRef<Radii>({ outer: 400, peak: 200, inner: 80 });
  const mouseRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    active: false,
    visible: 0,
  });
  const rafRef = useRef(0);
  const isTouchRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isTouchRef.current =
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window;

    const parent = canvas.parentElement;
    if (!parent) return;

    const seedDots = () => {
      const dots: Dot[] = [];
      for (let i = 0; i < DOT_COUNT; i++) {
        const a = hash(i * 3.1) * Math.PI * 2;
        const u = hash(i * 7.7);
        // Prefer the bright mid-band of the donut
        const rFactor = 0.22 + Math.pow(u, 0.7) * 0.7;
        dots.push({
          x: 0,
          y: 0,
          dirX: Math.cos(a),
          dirY: Math.sin(a) * 0.82,
          rFactor,
          phase: hash(i + 3) * Math.PI * 2,
          speed: 0.12 + hash(i + 9) * 0.22,
          radius: 2,
          aspect: 1,
          angle: a,
          weight: 0.55 + hash(i + 5) * 0.4,
          lag: 0.5 + hash(i + 19) * 0.9,
          fill: `${Math.round(200 + hash(i + 31) * 40)},${Math.round(205 + hash(i + 33) * 30)},${Math.round(200 + hash(i + 35) * 25)}`,
          ready: false,
        });
      }
      dotsRef.current = dots;
    };

    const updateRadii = (w: number, h: number) => {
      const base = Math.min(w, h);
      // Wide outer fade-in, tighter inner fade-out
      radiiRef.current = {
        outer: base * 0.72,
        peak: base * 0.26,
        inner: base * 0.14,
      };
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      updateRadii(rect.width, rect.height);
    };

    const onMove = (e: MouseEvent) => {
      if (isTouchRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const m = mouseRef.current;
      m.vx = x - m.x;
      m.vy = y - m.y;
      m.x = x;
      m.y = y;
      m.active = true;
    };

    const draw = (now: number) => {
      const t = now * 0.001;
      const rect = parent.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const m = mouseRef.current;
      const r = radiiRef.current;
      // Stay visible once the cursor has moved — don't clear when leaving the hero
      const targetVis = !isTouchRef.current && m.active ? 1 : 0;
      m.visible += (targetVis - m.visible) * 0.1;

      if (m.visible < 0.01) {
        if (!m.active) {
          for (const d of dotsRef.current) d.ready = false;
        }
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // Soft velocity decay — slow, lingering chase
      m.vx *= 0.96;
      m.vy *= 0.96;
      const spd = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
      const moving = spd > 0.15;
      const dirX = moving ? m.vx / spd : 0;
      const dirY = moving ? m.vy / spd : 0;

      const wobbleScale = r.outer * 0.028;

      for (const dot of dotsRef.current) {
        const leash = r.outer * dot.rFactor;
        let ox = dot.dirX * leash;
        let oy = dot.dirY * leash;

        // Gentle wake stretch — keeps the donut, moves slowly
        if (moving) {
          const along = ox * dirX + oy * dirY;
          const stretch =
            along < 0
              ? 1 + Math.min(0.28, spd * 0.015)
              : 1 - Math.min(0.1, spd * 0.008);
          ox *= stretch;
          oy *= stretch;
          ox -= dirX * spd * dot.lag * 0.7;
          oy -= dirY * spd * dot.lag * 0.7;
        }

        const wobbleX =
          Math.sin(t * dot.speed + dot.phase) * wobbleScale +
          Math.sin(t * dot.speed * 0.35 + dot.phase * 1.7) * wobbleScale * 0.45;
        const wobbleY =
          Math.cos(t * dot.speed * 0.88 + dot.phase) * wobbleScale +
          Math.cos(t * dot.speed * 0.47 + dot.phase * 1.3) * wobbleScale * 0.45;

        const targetX = m.x + ox + wobbleX;
        const targetY = m.y + oy + wobbleY;

        if (!dot.ready) {
          dot.x = targetX;
          dot.y = targetY;
          dot.ready = true;
        } else {
          let behind = 0;
          if (moving) {
            behind = Math.max(
              0,
              ((m.x - dot.x) * dirX + (m.y - dot.y) * dirY) / r.outer
            );
          }
          // Very slow drift toward targets; slightly faster only when far behind
          const follow = 0.018 + behind * 0.035;
          dot.x += (targetX - dot.x) * Math.min(0.06, follow);
          dot.y += (targetY - dot.y) * Math.min(0.06, follow);
        }

        const dx = dot.x - m.x;
        const dy = dot.y - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let alpha = ringProfile(dist, r) * dot.weight * m.visible * 0.9;

        if (moving && alpha > 0) {
          const behindAmt = Math.max(0, -((dx * dirX + dy * dirY) / r.outer));
          alpha *= 1 - Math.min(0.28, behindAmt * 0.4);
        }

        if (alpha < 0.02) continue;

        const profile = ringProfile(dist, r);

        ctx.save();
        ctx.translate(dot.x, dot.y);
        ctx.beginPath();
        ctx.arc(0, 0, dot.radius, 0, Math.PI * 2);

        if (profile > 0.5) {
          ctx.fillStyle = `rgba(255, 199, 138,${alpha})`;
        } else {
          ctx.fillStyle = `rgba(${dot.fill},${alpha})`;
        }
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    seedDots();
    resize();
    const rect0 = parent.getBoundingClientRect();
    mouseRef.current.x = rect0.width / 2;
    mouseRef.current.y = rect0.height / 2;
    rafRef.current = requestAnimationFrame(draw);

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    // Track cursor anywhere on the page so the field doesn't vanish off-hero
    window.addEventListener("mousemove", onMove);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      aria-hidden
    />
  );
}
