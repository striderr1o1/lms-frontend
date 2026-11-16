import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../utils/motion.js';

export default function Starfield({ className = '' }) {
  const canvasRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const stars = [];
    let frame = 0;
    let running = true;
    let visible = true;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (!stars.length && rect.width > 0 && rect.height > 0) {
        const count = Math.min(150, Math.max(24, Math.round((rect.width * rect.height) / 9000)));
        for (let index = 0; index < count; index += 1) {
          stars.push({
            x: Math.random() * rect.width,
            y: Math.random() * rect.height,
            radius: Math.random() * 1.3 + 0.3,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.01 + 0.003,
          });
        }
      }
    }

    function paint() {
      const rect = canvas.getBoundingClientRect();
      const color = getComputedStyle(canvas).getPropertyValue('--ns-starfield').trim() || '248, 250, 252';
      context.clearRect(0, 0, rect.width, rect.height);
      stars.forEach((star) => {
        if (!reduced && running && visible) star.phase += star.speed;
        const alpha = reduced ? 0.72 : 0.28 + Math.abs(Math.sin(star.phase)) * 0.72;
        context.fillStyle = `rgba(${color}, ${alpha})`;
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fill();
      });
    }

    function loop() {
      paint();
      if (!reduced && running && visible) frame = window.requestAnimationFrame(loop);
    }

    resize();
    loop();

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !reduced) {
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(loop);
      }
    });
    observer.observe(canvas);
    window.addEventListener('resize', resize);

    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className={['starfield', className].filter(Boolean).join(' ')} aria-hidden="true" />;
}
