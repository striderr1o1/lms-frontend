import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../utils/motion.js';

export default function Reveal({ children, className = '', as: Tag = 'div', ...rest }) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setShown(true);
      return undefined;
    }
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) {
      setShown(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShown(true);
        observer.disconnect();
      }
    }, { threshold: 0.16 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <Tag ref={ref} className={['reveal', shown ? 'is-shown' : '', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>
  );
}
