import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Phone, Clock, MapPin, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';

gsap.registerPlugin(ScrollTrigger);

const contactInfo = [
  {
    icon: Phone,
    label: 'Linea de Atencion',
    value: '800-10-1234',
    sub: 'Llamada gratuita desde cualquier operador',
  },
  {
    icon: Clock,
    label: 'Horario de Atencion',
    value: 'Lunes a Viernes: 8:00 - 20:00',
    sub: 'Sabados: 8:00 - 14:00',
  },
  {
    icon: MapPin,
    label: 'Oficina Central',
    // TODO: Reemplazar con direccion real
    value: 'Plaza Principal s/n, Edificio Municipal',
    sub: 'Planta Baja - Ventanilla de Atencion',
  },
  {
    icon: Mail,
    label: 'Correo Electronico',
    // TODO: Reemplazar con email real
    value: 'denuncias@municipio.gob.bo',
    sub: 'Respuesta en menos de 24 horas',
  },
];

export function CTA() {
  const container = useRef(null);

  useGSAP(
    () => {
      // Scale-up reveal: section starts small and scales to full size as you scroll into it
      gsap.fromTo(
        '.cta-inner',
        { scale: 0.85, borderRadius: '3rem', opacity: 0.5 },
        {
          scale: 1,
          borderRadius: '0rem',
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: container.current,
            start: 'top 80%',
            end: 'top 20%',
            scrub: 1,
          },
        }
      );

      // Header text reveal
      gsap.fromTo(
        '.cta-reveal',
        { opacity: 0, y: 60, clipPath: 'inset(100% 0 0 0)' },
        {
          opacity: 1,
          y: 0,
          clipPath: 'inset(0% 0 0 0)',
          duration: 1,
          stagger: 0.12,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: '.cta-header',
            start: 'top 70%',
            once: true,
          },
        }
      );

      // Contact cards stagger
      gsap.fromTo(
        '.contact-card',
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.contact-grid',
            start: 'top 75%',
            once: true,
          },
        }
      );

      // Parallax on background glow
      gsap.to('.cta-glow', {
        y: -80,
        ease: 'none',
        scrollTrigger: {
          trigger: container.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });

      // Big CTA button entrance
      gsap.fromTo(
        '.cta-big-btn',
        { opacity: 0, y: 30, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: '.cta-big-btn',
            start: 'top 85%',
            once: true,
          },
        }
      );
    },
    { scope: container }
  );

  return (
    <section id="contacto" ref={container} className="relative py-32 px-6 overflow-hidden">
      <div className="cta-inner relative">
        {/* Background glow */}
        <div
          className="cta-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(37,99,235,0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div className="relative max-w-5xl mx-auto z-10">
          {/* Header */}
          <div className="cta-header text-center mb-14 flex flex-col items-center gap-5">
            <div className="cta-reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#7C3AED33] bg-[#7C3AED11] text-[#A78BFA] text-xs font-semibold tracking-wider uppercase">
              <Phone className="w-3 h-3" />
              Contacto
            </div>

            <h2 className="cta-reveal text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight">
              Necesitas reportar
              <br />
              <span className="text-gradient">un problema?</span>
            </h2>

            <p className="cta-reveal max-w-lg text-[#71717a] text-lg leading-relaxed">
              Comunicate con nuestro Call Center. Un operador capacitado
              registrara tu denuncia y te proporcionara un codigo de seguimiento.
            </p>
          </div>

          {/* Contact cards */}
          <div className="contact-grid grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {contactInfo.map((info, i) => {
              const Icon = info.icon;
              return (
                <div
                  key={i}
                  className="contact-card group rounded-3xl border border-white/[0.08] p-6 overflow-hidden transition-colors duration-300 hover:border-white/[0.14]"
                  style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: '#7C3AED15', border: '1px solid #7C3AED30' }}
                    >
                      <Icon className="w-5 h-5 text-[#A78BFA]" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-xs text-[#52525b] uppercase tracking-wider font-semibold mb-1">
                        {info.label}
                      </p>
                      <p className="text-white font-bold text-base">{info.value}</p>
                      <p className="text-xs text-[#52525b] mt-1">{info.sub}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Big CTA button */}
          <div className="cta-big-btn text-center mt-12">
            <Button
              variant="primary"
              className="px-10 py-4 text-lg font-bold gap-3"
              onClick={() => window.open('tel:800101234')}
            >
              <Phone className="w-5 h-5" />
              Llamar ahora: 800-10-1234
            </Button>
            <p className="text-xs text-[#3f3f46] mt-4">
              Llamada gratuita · Sin costo · Atencion inmediata
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
