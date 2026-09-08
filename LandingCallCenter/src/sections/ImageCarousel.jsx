import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import imgTree from '../assets/Gemini_Generated_Image_61urc461urc461ur.png';
import imgCleanup from '../assets/Gemini_Generated_Image_6ww3ob6ww3ob6ww3.png';
import imgRoad from '../assets/Gemini_Generated_Image_7rddet7rddet7rdd.png';
import imgCallCenter from '../assets/Gemini_Generated_Image_9t47k39t47k39t47.png';
import imgLight from '../assets/Gemini_Generated_Image_gm5rkpgm5rkpgm5r.png';
import imgWater from '../assets/Gemini_Generated_Image_r4wx6lr4wx6lr4wx.png';

gsap.registerPlugin(ScrollTrigger);

const cards = [
  {
    img: imgRoad,
    title: 'Reparacion de calzadas',
    description: 'Personal municipal reparando baches y huecos en las vias de Cochabamba.',
    rotation: -6,
  },
  {
    img: imgCallCenter,
    title: 'Call Center 24/7',
    description: 'Operadores capacitados registrando denuncias y geolocalizando problemas.',
    rotation: 3,
  },
  {
    img: imgLight,
    title: 'Alumbrado publico',
    description: 'Equipos especializados reparando luminarias para una ciudad mas segura.',
    rotation: -4,
  },
  {
    img: imgTree,
    title: 'Retiro de arboles',
    description: 'Respuesta rapida ante arboles caidos que obstruyen las vias.',
    rotation: 5,
  },
  {
    img: imgWater,
    title: 'Agua y alcantarillado',
    description: 'Reparacion de tuberias y alcantarillas para garantizar el servicio.',
    rotation: -3,
  },
  {
    img: imgCleanup,
    title: 'Limpieza urbana',
    description: 'Limpieza integral de puntos criticos de acumulacion de residuos.',
    rotation: 4,
  },
];

export function ImageCarousel() {
  const container = useRef(null);
  const trackRef = useRef(null);

  useGSAP(
    () => {
      // Header reveal
      gsap.fromTo(
        '.carousel-reveal',
        { opacity: 0, y: 60, clipPath: 'inset(100% 0 0 0)' },
        {
          opacity: 1,
          y: 0,
          clipPath: 'inset(0% 0 0 0)',
          duration: 1,
          stagger: 0.12,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: '.carousel-header',
            start: 'top 75%',
            once: true,
          },
        }
      );

      // Horizontal scroll for the cards
      const track = trackRef.current;
      const totalScroll = track.scrollWidth - window.innerWidth + 100;

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

      // Each card entrance
      const polaroids = track.querySelectorAll('.polaroid-card');
      polaroids.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 60 + (i % 2 === 0 ? 20 : -20), scale: 0.85 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'left 90%',
              end: 'left 50%',
              scrub: 1,
              containerAnimation: gsap.utils.toArray(
                ScrollTrigger.getAll()
              ).find((st) => st.vars?.trigger === container.current)
                ? undefined
                : undefined,
            },
          }
        );
      });
    },
    { scope: container }
  );

  return (
    <section ref={container} className="relative bg-[#09090b] overflow-hidden">
      {/* Separator */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 z-10"
        style={{ background: 'linear-gradient(to bottom, transparent, #7C3AED44, transparent)' }}
      />

      {/* Header */}
      <div className="carousel-header pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-start gap-4">
          <span className="carousel-reveal inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-[#06B6D4] border border-[#06B6D433] bg-[#06B6D40a]">
            Nuestro Trabajo
          </span>
          <h2 className="carousel-reveal text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[0.95]">
            Cochabamba en
            <br />
            <span className="text-gradient">accion.</span>
          </h2>
          <p className="carousel-reveal max-w-lg text-[#71717a] text-lg leading-relaxed">
            Nuestros equipos trabajan diariamente para resolver los problemas
            que los ciudadanos reportan. Estas son las denuncias que atendemos.
          </p>
        </div>
      </div>

      {/* Horizontal scroll track with polaroid cards */}
      <div ref={trackRef} className="flex items-center gap-10 px-6 pb-32 pt-8 will-change-transform" style={{ minHeight: '70vh' }}>
        {/* Left spacer */}
        <div className="shrink-0 w-[calc((100vw-1280px)/2)]" style={{ minWidth: '2rem' }} />

        {cards.map((card, i) => (
          <div
            key={i}
            className="polaroid-card shrink-0 group cursor-default will-change-transform"
            style={{
              transform: `rotate(${card.rotation}deg)`,
              transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'rotate(0deg) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = `rotate(${card.rotation}deg) scale(1)`;
            }}
          >
            <div
              className="w-[300px] sm:w-[340px] rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl shadow-black/40"
              style={{ background: 'rgba(255,255,255,0.95)' }}
            >
              {/* Image */}
              <div className="relative overflow-hidden">
                <img
                  src={card.img}
                  alt={card.title}
                  className="w-full h-[220px] object-cover"
                  loading="lazy"
                />
                {/* Subtle overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Caption area (polaroid style - white) */}
              <div className="p-5">
                <h3 className="text-[#18181b] font-bold text-lg mb-1 tracking-tight">
                  {card.title}
                </h3>
                <p className="text-[#52525b] text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Right spacer */}
        <div className="shrink-0 w-[20vw]" />
      </div>
    </section>
  );
}
