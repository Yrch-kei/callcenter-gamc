import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { cn } from '../../utils/cn';

export function Button({ children, className, variant = 'primary', onClick, ...props }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onEnter = () => {
      gsap.to(el, { scale: 1.04, duration: 0.25, ease: 'power2.out' });
    };
    const onLeave = () => {
      gsap.to(el, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' });
    };
    const onDown = () => {
      gsap.to(el, { scale: 0.97, duration: 0.1, ease: 'power2.out' });
    };
    const onUp = () => {
      gsap.to(el, { scale: 1.04, duration: 0.15, ease: 'power2.out' });
    };

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('mousedown', onDown);
    el.addEventListener('mouseup', onUp);

    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mouseup', onUp);
    };
  }, []);

  const base =
    'relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-colors duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 px-6 py-3';

  const variants = {
    primary:
      'bg-[#7C3AED] text-white hover:bg-[#8B5CF6] focus-visible:ring-[#7C3AED] shadow-lg shadow-[#7C3AED22]',
    outline:
      'border border-[#3f3f46] text-[#d4d4d8] hover:border-[#7C3AED] hover:text-white focus-visible:ring-[#7C3AED] bg-transparent',
    ghost:
      'text-[#a1a1aa] hover:text-white hover:bg-[#27272a] focus-visible:ring-[#7C3AED] bg-transparent',
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
