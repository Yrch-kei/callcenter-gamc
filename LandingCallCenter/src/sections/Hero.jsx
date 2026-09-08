import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, Search, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: '12,400+', label: 'Denuncias atendidas' },
  { value: '<48h', label: 'Tiempo de respuesta' },
  { value: '97%', label: 'Tasa de resolucion' },
  { value: '24/7', label: 'Atencion ciudadana' },
];

export function Hero() {
  const container = useRef(null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ delay: 0.5 });

      tl.fromTo(
        '.hero-badge',
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }
      )
        .fromTo(
          '.hero-word',
          { opacity: 0, y: 80, rotateX: 40 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 1,
            stagger: 0.08,
            ease: 'power4.out',
          },
          '-=0.3'
        )
        .fromTo(
          '.hero-subtitle',
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
          '-=0.5'
        )
        .fromTo(
          '.hero-cta',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
          '-=0.4'
        )
        .fromTo(
          '.hero-scroll-hint',
          { opacity: 0 },
          { opacity: 1, duration: 0.8 },
          '-=0.2'
        )
        .fromTo(
          '.stat-item',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
          '-=0.5'
        );

      // Scroll-driven zoom + dissolve
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: 'top top',
          end: '+=100%',
          scrub: 1,
          pin: true,
          pinSpacing: true,
        },
      });

      scrollTl
        .to(titleRef.current, {
          scale: 1.8,
          opacity: 0,
          y: -60,
          duration: 1,
          ease: 'power2.in',
        })
        .to(
          contentRef.current,
          { opacity: 0, y: -40, duration: 0.6 },
          0
        )
        .to(
          '.hero-stats-bar',
          { y: 80, opacity: 0, duration: 0.6 },
          0
        );

      // Floating orbs
      gsap.to('.hero-orb-1', {
        y: -30, x: 15, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut',
      });
      gsap.to('.hero-orb-2', {
        y: 20, x: -20, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1,
      });

      // Scroll hint bounce
      gsap.to('.scroll-arrow', {
        y: 8, duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut',
      });
    },
    { scope: container }
  );

  const titleLines = [
    { words: 'Tu voz importa.', gradient: false },
    { words: 'Tu denuncia,', gradient: false },
    { words: 'nuestra prioridad.', gradient: true },
  ];

  return (
    <section
      id="inicio"
      ref={container}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Ambient orbs */}
      <div
        className="hero-orb-1 absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="hero-orb-2 absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Center content */}
      <div ref={contentRef} className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center gap-6">
        {/* Badge */}
        <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#7C3AED33] bg-[#7C3AED11] text-[#A78BFA] text-xs font-semibold tracking-wider uppercase">
          <ShieldCheck className="w-3 h-3" />
          Alcaldia de Cochabamba
        </div>

        {/* Title with scroll zoom */}
        <h1
          ref={titleRef}
          className="font-black text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight will-change-transform"
          style={{ perspective: '1000px' }}
        >
          {titleLines.map((line, li) => (
            <span key={li} className="block">
              {line.words.split(' ').map((word, wi) => (
                <span
                  key={wi}
                  className={`hero-word inline-block mr-3 md:mr-5 ${
                    line.gradient ? 'text-gradient' : 'text-white'
                  }`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {word}
                </span>
              ))}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle max-w-2xl text-lg md:text-xl text-[#a1a1aa] leading-relaxed font-light">
          Reporta problemas en tu ciudad y da seguimiento en tiempo real.
          Juntos construimos una Cochabamba mejor para todos.
        </p>

        {/* CTA buttons */}
        <div className="hero-cta flex flex-col sm:flex-row items-center gap-4">
          <Button
            variant="primary"
            className="px-8 py-3.5 text-base gap-2.5"
            onClick={() => document.getElementById('consultar')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Search className="w-4 h-4" />
            Consultar mi Denuncia
          </Button>
          <Button
            variant="ghost"
            className="px-8 py-3.5 text-base gap-2.5 text-[#d4d4d8]"
            onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <ArrowDown className="w-5 h-5 text-[#7C3AED]" />
            Como funciona
          </Button>
        </div>

        {/* Scroll hint */}
        <div className="hero-scroll-hint flex flex-col items-center gap-2 mt-8">
          <span className="text-[10px] text-[#52525b] uppercase tracking-[0.25em] font-semibold">
            Scroll para explorar
          </span>
          <div className="scroll-arrow w-5 h-8 rounded-full border border-[#3f3f46] flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-[#7C3AED]" />
          </div>
        </div>
      </div>

      {/* Stats bar at bottom */}
      <div className="hero-stats-bar absolute bottom-12 left-1/2 -translate-x-1/2 z-10 w-full max-w-3xl px-6">
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/[0.06]"
          style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className="stat-item flex flex-col items-center py-5 px-4 gap-1"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <span className="text-2xl font-black text-white">{s.value}</span>
              <span className="text-[10px] text-[#71717a] font-medium text-center uppercase tracking-wider">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #09090b, transparent)' }}
      />
    </section>
  );
}
