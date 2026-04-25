import { useEffect } from 'react';
import gsap from 'gsap';

export function useScreenEntrance(ref) {
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'transform' }
    );
  }, [ref]);
}
