import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../utils/motion.js';

export default function CountUp({ value }) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (reduced) {
      setShown(value);
      return undefined;
    }
    const node = ref.current;
    if (!node) return undefined;

    function run() {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const duration = 800;
      function tick(now) {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - progress) ** 3;
        setShown(Math.round(value * eased));
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    if (!('IntersectionObserver' in window)) {
      run();
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        run();
        observer.disconnect();
      }
    }, { threshold: 0.4 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced, value]);

  return <span ref={ref}>{shown}</span>;
}
