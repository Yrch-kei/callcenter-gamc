import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import escudoImg from '../assets/escudo-GAMC-vertical.png';

gsap.registerPlugin(ScrollTrigger);

const footerLinks = {
  'Servicios': ['Consultar Denuncia', 'Registrar Denuncia', 'Mapa de Calor', 'Preguntas Frecuentes'],
  'Municipalidad': ['Sobre Nosotros', 'Transparencia', 'Noticias', 'Contacto'],
  'Legal': ['Aviso de Privacidad', 'Terminos de Uso', 'Proteccion de Datos'],
};

export function Footer() {
  const container = useRef(null);

  useGSAP(
    () => {
      gsap.fromTo(
        container.current,
        { clipPath: 'inset(100% 0 0 0)' },
        {
          clipPath: 'inset(0% 0 0 0)',
          duration: 1.2,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: container.current,
            start: 'top 90%',
            once: true,
          },
        }
      );

      gsap.fromTo(
        '.footer-col',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container.current,
            start: 'top 80%',
            once: true,
          },
        }
      );
    },
    { scope: container }
  );

  return (
    <footer ref={container} className="border-t border-white/[0.06] bg-[#09090b] px-6 pt-16 pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="footer-col lg:col-span-2 flex flex-col gap-4">
            <a href="#inicio" className="flex items-center gap-2.5 w-fit">
              <img
                src={escudoImg}
                alt="Escudo Alcaldia de Cochabamba"
                className="h-12 w-auto object-contain"
              />
              <div className="flex flex-col leading-none">
                <span className="font-bold text-base tracking-tight text-white">
                  Denuncias<span className="text-[#7C3AED]">Municipal</span>
                </span>
                <span className="text-[9px] text-[#52525b] tracking-wider uppercase">
                  Gobierno Autonomo Municipal de Cochabamba
                </span>
              </div>
            </a>
            <p className="text-sm text-[#52525b] leading-relaxed max-w-xs">
              Sistema integrado de atencion ciudadana, seguimiento y control de
              denuncias con geolocalizacion. Tu voz importa, tu denuncia es
              nuestra prioridad.
            </p>
            {/* TODO: Agregar redes sociales reales de la municipalidad */}
            <div className="flex items-center gap-3 mt-2">
              <SocialPlaceholder label="Facebook" />
              <SocialPlaceholder label="Twitter" />
              <SocialPlaceholder label="Instagram" />
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="footer-col flex flex-col gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-[#a1a1aa]">
                {category}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-[#52525b] hover:text-[#a1a1aa] transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#3f3f46]">
            &copy; {new Date().getFullYear()} Gobierno Autonomo Municipal de Cochabamba. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-xs text-[#3f3f46]">Sistema operativo 24/7</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialPlaceholder({ label }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="w-9 h-9 rounded-lg border border-white/[0.08] flex items-center justify-center text-[#52525b] hover:text-white hover:border-white/[0.2] transition-colors duration-200"
    >
      <span className="text-[10px] font-bold">{label[0]}</span>
    </a>
  );
}
