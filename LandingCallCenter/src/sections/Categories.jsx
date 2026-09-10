import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Construction,
  Lightbulb,
  TreePine,
  Droplets,
  TrafficCone,
  ShieldAlert,
  Trash2,
  Landmark,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const categories = [
  { icon: Construction, title: 'Infraestructura Urbana', examples: 'Huecos en calzada, aceras danadas, baches', accent: '#f59e0b' },
  { icon: Lightbulb, title: 'Alumbrado Publico', examples: 'Lamparas fundidas, postes danados, zonas oscuras', accent: '#eab308' },
  { icon: TreePine, title: 'Medio Ambiente', examples: 'Arboles caidos, poda, areas verdes descuidadas', accent: '#22c55e' },
  { icon: Droplets, title: 'Agua y Alcantarillado', examples: 'Fugas de agua, alcantarillas tapadas, inundaciones', accent: '#3b82f6' },
  { icon: TrafficCone, title: 'Vias y Transito', examples: 'Senalizacion danada, semaforos, obstrucciones', accent: '#ef4444' },
  { icon: ShieldAlert, title: 'Seguridad Ciudadana', examples: 'Zonas inseguras, iluminacion deficiente, vandalismo', accent: '#8b5cf6' },
  { icon: Trash2, title: 'Limpieza Urbana', examples: 'Basurales, contenedores llenos, escombros', accent: '#06B6D4' },
  { icon: Landmark, title: 'Servicios Municipales', examples: 'Mobiliario urbano, parques, espacios publicos', accent: '#ec4899' },
];

export function Categories() {
  const container = useRef(null);

  useGSAP(
    () => {
      // Header text reveal
      gsap.fromTo(
        '.cat-reveal',
        { opacity: 0, y: 80, clipPath: 'inset(100% 0 0 0)' },
        {
          opacity: 1,
          y: 0,
          clipPath: 'inset(0% 0 0 0)',
          duration: 1,
          stagger: 0.12,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: '.cat-header',
            start: 'top 75%',
            once: true,
          },
        }
      );

      // Cards with alternating parallax (odd/even offset)
      const cards = container.current.querySelectorAll('.cat-card');

      cards.forEach((card, i) => {
        // Stagger entrance
        gsap.fromTo(
          card,
          { opacity: 0, y: 80 + (i % 2) * 40, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              once: true,
            },
          }
        );

        // Continuous parallax - odd cards move slower
        gsap.to(card, {
          y: i % 2 === 0 ? -20 : -40,
          ease: 'none',
          scrollTrigger: {
            trigger: container.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      });
    },
    { scope: container }
  );

  return (
    <section id="servicios" ref={container} className="relative py-32 px-6 bg-[#09090b] overflow-hidden">
      {/* Parallax background glow */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #06B6D444, transparent)' }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="cat-header text-center mb-20 flex flex-col items-center gap-4">
          <span className="cat-reveal inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-[#06B6D4] border border-[#06B6D433] bg-[#06B6D40a]">
            Areas de Atencion
          </span>
          <h2 className="cat-reveal text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[0.95]">
            Tipos de denuncias
            <br />
            <span className="text-gradient">que puedes reportar.</span>
          </h2>
          <p className="cat-reveal max-w-xl text-[#71717a] text-lg leading-relaxed">
            Nuestro sistema cubre las principales areas de servicio municipal.
            Cada denuncia es derivada automaticamente al area responsable.
          </p>
        </div>

        {/* Grid with parallax offset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <div
                key={i}
                className="cat-card group relative rounded-3xl p-6 border border-white/[0.06] overflow-hidden cursor-default transition-colors duration-300 hover:border-white/[0.14] will-change-transform"
                style={{ background: 'rgba(255,255,255,0.025)' }}
              >
                {/* Glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${cat.accent}11, transparent 70%)`,
                  }}
                />

                {/* Icon */}
                <div
                  className="mb-4 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: `${cat.accent}15`,
                    border: `1px solid ${cat.accent}30`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: cat.accent }} strokeWidth={1.8} />
                </div>

                <h3 className="text-white font-bold text-base mb-1.5 tracking-tight">
                  {cat.title}
                </h3>
                <p className="text-[#52525b] text-xs leading-relaxed">
                  {cat.examples}
                </p>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `linear-gradient(90deg, transparent, ${cat.accent}, transparent)` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
