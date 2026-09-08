import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const BLOCK_SIZE = 50;
const COLORS = ['#7C3AED', '#06B6D4', '#8B5CF6', '#A78BFA', '#22D3EE'];

export function InteractiveGrid() {
  const canvasRef = useRef(null);
  const blocksRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e) => {
      const col = Math.floor(e.clientX / BLOCK_SIZE);
      const row = Math.floor(e.clientY / BLOCK_SIZE);

      // Reduced radius: only the block directly under the cursor (no neighbors)
      const key = `${col}-${row}`;
      const existing = blocksRef.current.find((b) => b.key === key);
      if (!existing) {
        const block = {
          key,
          x: col * BLOCK_SIZE,
          y: row * BLOCK_SIZE,
          alpha: 0,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
        blocksRef.current.push(block);
        gsap.to(block, {
          alpha: 0.12 + Math.random() * 0.1,
          duration: 0.15,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(block, {
              alpha: 0,
              duration: 1.2 + Math.random() * 0.5,
              delay: 0.2,
              ease: 'power2.inOut',
              onComplete: () => {
                blocksRef.current = blocksRef.current.filter((b) => b.key !== key);
              },
            });
          },
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      blocksRef.current.forEach((b) => {
        if (b.alpha > 0.001) {
          ctx.fillStyle = b.color;
          ctx.globalAlpha = b.alpha;
          ctx.fillRect(b.x, b.y, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
        }
      });

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}
