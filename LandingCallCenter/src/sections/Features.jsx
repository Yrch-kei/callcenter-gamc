import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PhoneCall, MapPinned, HardHat, Search } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: '01',
    icon: PhoneCall,
    title: 'Llama al Call Center',
    description:
      'Comunicate al numero de atencion ciudadana. Un operador te atendera y registrara tu denuncia con todos los detalles del problema.',
    accent: '#7C3AED',
  },
  {
    number: '02',
    icon: MapPinned,
    title: 'Geolocalizamos tu denuncia',
    description:
      'El operador ubica el problema en el mapa interactivo. El sistema identifica automaticamente el distrito, subdistrito y OTB correspondiente.',
    accent: '#8b5cf6',
  },
  {
    number: '03',
    icon: HardHat,
    title: 'Personal de campo atiende',
    description:
      'Tu denuncia es asignada al area responsable. El equipo de campo se dirige al lugar, documenta y resuelve el problema con evidencia fotografica.',
    accent: '#06B6D4',
  },
  {
    number: '04',
    icon: Search,
    title: 'Consulta tu estado',
    description:
      'Con el codigo unico que te proporcionamos (DEN-AAAA-NNNNN), puedes consultar el estado de tu denuncia en cualquier momento desde esta pagina.',
    accent: '#22c55e',
  },
];

export function Features() {
  const container = useRef(null);
  const trackRef = useRef(null);

  useGSAP(
    () => {
      // Header text reveal on scroll
      gsap.fromTo(
        '.features-header-line',
        { opacity: 0, y: 60, clipPath: 'inset(100% 0 0 0)' },
        {
          opacity: 1,
          y: 0,
          clipPath: 'inset(0% 0 0 0)',
          duration: 1,
          stagger: 0.15,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: '.features-header',
            start: 'top 80%',
            once: true,
          },
        }
      );

      // Horizontal scroll pinned section
      const track = trackRef.current;
      const cards = track.querySelectorAll('.step-card');
      const totalScroll = track.scrollWidth - window.innerWidth + 200;

      gsap.to(track, {
        x: () => -totalScroll,
        ease: 'none',
        scrollTrigger: {
          trigger: container.current,
          start: 'top top',
          end: () => `+=${totalScroll}`,
          scrub: 1,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Each card fades in as it enters viewport during horizontal scroll
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0.3, scale: 0.92, rotateY: 5 },
          {
            opacity: 1,
            scale: 1,
            rotateY: 0,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              containerAnimation: gsap.getById?.('hscroll') || undefined,
              start: 'left 80%',
              end: 'left 30%',
              scrub: 1,
            },
          }
        );
      });

      // Progress line that fills as you scroll horizontally
      gsap.fromTo(
        '.progress-fill',
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: container.current,
            start: 'top top',
            end: () => `+=${totalScroll}`,
            scrub: 1,
          },
        }
      );
    },
    { scope: container }
  );

  return (
    <section id="como-funciona" ref={container} className="relative bg-[#09090b] overflow-hidden">
      {/* Separator line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #7C3AED44, transparent)' }}
      />

      {/* Header area - visible on pin */}
      <div className="features-header pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-start gap-4">
          <span className="features-header-line inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-[#7C3AED] border border-[#7C3AED33] bg-[#7C3AED0a]">
            Proceso
          </span>
          <h2 className="features-header-line text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[0.95]">
            Como funciona
            <br />
            <span className="text-gradient">en 4 simples pasos.</span>
          </h2>
          <p className="features-header-line max-w-lg text-[#71717a] text-lg leading-relaxed">
            Desde tu llamada hasta la resolucion del problema.
            Un proceso transparente con trazabilidad completa.
          </p>
        </div>

        {/* Progress bar */}
        <div className="max-w-7xl mx-auto mt-10">
          <div className="h-px bg-[#27272a] relative overflow-hidden">
            <div
              className="progress-fill absolute inset-0 origin-left"
              style={{ background: 'linear-gradient(90deg, #7C3AED, #06B6D4)' }}
            />
          </div>
        </div>
      </div>

      {/* Horizontal scroll track */}
      <div ref={trackRef} className="flex gap-8 px-6 pb-32 pt-8 will-change-transform">
        {/* Left spacer */}
        <div className="shrink-0 w-[calc((100vw-1280px)/2)]" style={{ minWidth: '2rem' }} />

        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={i}
              className="step-card shrink-0 w-[85vw] sm:w-[60vw] md:w-[45vw] lg:w-[35vw] group relative rounded-3xl p-8 md:p-10 border border-white/[0.06] overflow-hidden cursor-default transition-colors duration-300 hover:border-white/[0.14]"
              style={{
                background: 'rgba(255,255,255,0.025)',
                perspective: '1000px',
              }}
            >
              {/* Glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${step.accent}15, transparent 70%)`,
                }}
              />

              {/* Big step number watermark */}
              <span
                className="absolute -top-4 -right-4 text-[12rem] font-black leading-none pointer-events-none select-none"
                style={{ color: step.accent, opacity: 0.04 }}
              >
                {step.number}
              </span>

              {/* Step indicator */}
              <div className="flex items-center gap-3 mb-8">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: `${step.accent}20`, color: step.accent, border: `1px solid ${step.accent}40` }}
                >
                  {step.number}
                </div>
                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${step.accent}40, transparent)` }} />
              </div>

              {/* Icon */}
              <div
                className="mb-6 w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: `${step.accent}12`,
                  border: `1px solid ${step.accent}25`,
                }}
              >
                <Icon className="w-6 h-6" style={{ color: step.accent }} strokeWidth={1.8} />
              </div>

              <h3 className="text-white font-bold text-2xl mb-3 tracking-tight">
                {step.title}
              </h3>
              <p className="text-[#71717a] text-base leading-relaxed">
                {step.description}
              </p>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `linear-gradient(90deg, transparent, ${step.accent}, transparent)` }}
              />
            </div>
          );
        })}

        {/* Right spacer */}
        <div className="shrink-0 w-[20vw]" />
      </div>
    </section>
  );
}
