"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Particle = {
  hx: number; // home position
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [18, 183, 106];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Futuristic particle constellation for the hero.
 * Particles drift around their home spot; the mouse pushes them away (distortion) and they spring back.
 * Colour comes from a theme variable (brand-500 by default), so it follows any brand change.
 */
export function ParticleField({ className, colorVar = "--color-brand-500" }: { className?: string; colorVar?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const brandHex = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim() || "#12b76a";
    const [r, g, b] = hexToRgb(brandHex);

    const LINK = finePointer ? 115 : 90; // max distance for a connecting line
    const RADIUS = 160; // mouse influence radius
    const LINK2 = LINK * LINK;
    const RADIUS2 = RADIUS * RADIUS;

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let running = false;
    let inView = true;
    let t = 0;
    const mouse = { x: -9999, y: -9999, active: false };

    function build() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = finePointer ? 6500 : 9000;
      const count = Math.min(finePointer ? 220 : 70, Math.round((w * h) / density));
      particles = Array.from({ length: count }, () => {
        const x = Math.random() * w;
        const y = Math.random() * h;
        return { hx: x, hy: y, x, y, vx: 0, vy: 0, r: Math.random() * 1.3 + 0.7, phase: Math.random() * Math.PI * 2 };
      });
    }

    function step() {
      t += 0.008;
      for (const p of particles) {
        // Home spot slowly wanders so the field breathes.
        const tx = p.hx + Math.sin(t + p.phase) * 7;
        const ty = p.hy + Math.cos(t * 0.8 + p.phase) * 7;
        let ax = (tx - p.x) * 0.022;
        let ay = (ty - p.y) * 0.022;

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < RADIUS2) {
            const d = Math.sqrt(d2) || 1;
            const force = (1 - d / RADIUS) * 2.4;
            ax += (dx / d) * force;
            ay += (dy / d) * force;
          }
        }

        p.vx = (p.vx + ax) * 0.86;
        p.vy = (p.vy + ay) * 0.86;
        p.x += p.vx;
        p.y += p.vy;
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      ctx!.lineWidth = 1;

      // Connecting lines (brighter near the mouse)
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p = particles[j];
          const dx = a.x - p.x;
          const dy = a.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK2) continue;

          let alpha = (1 - Math.sqrt(d2) / LINK) * 0.16;
          if (mouse.active) {
            const mx = (a.x + p.x) / 2 - mouse.x;
            const my = (a.y + p.y) / 2 - mouse.y;
            const md2 = mx * mx + my * my;
            if (md2 < RADIUS2) alpha += (1 - Math.sqrt(md2) / RADIUS) * 0.35;
          }

          ctx!.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(p.x, p.y);
          ctx!.stroke();
        }
      }

      // Particles
      for (const p of particles) {
        let alpha = 0.45;
        let size = p.r;
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < RADIUS2) {
            const k = 1 - Math.sqrt(d2) / RADIUS;
            alpha += k * 0.5;
            size += k * 1.4;
          }
        }
        ctx!.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function loop() {
      step();
      draw();
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduceMotion || !inView || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    build();
    draw();
    start();

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouse.active = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      mouse.x = x;
      mouse.y = y;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    if (finePointer) {
      window.addEventListener("mousemove", onMove, { passive: true });
      document.addEventListener("mouseleave", onLeave);
    }

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start();
      else stop();
    });
    io.observe(canvas);

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        build();
        draw();
      }, 150);
    });
    ro.observe(canvas);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [colorVar]);

  return <canvas ref={canvasRef} className={cn("block h-full w-full", className)} aria-hidden />;
}
