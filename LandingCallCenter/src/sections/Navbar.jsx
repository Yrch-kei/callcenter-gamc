import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Menu, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import escudoImg from '../assets/escudo-GAMC-vertical.png';

gsap.registerPlugin(ScrollTrigger);

const links = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Consultar', href: '#consultar' },
  { label: 'Como Funciona', href: '#como-funciona' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Contacto', href: '#contacto' },
];

export function Navbar() {
  const navRef = useRef(null);
  const progressRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const nav = navRef.current;

    gsap.fromTo(
      nav,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1 }
    );

    const showAnim = gsap.to(nav, {
      y: 0,
      duration: 0.3,
      ease: 'power2.out',
      paused: true,
    });
    const hideAnim = gsap.to(nav, {
      y: -100,
      duration: 0.3,
      ease: 'power2.in',
      paused: true,
    });

    ScrollTrigger.create({
      start: 'top top',
      end: 'max',
      onUpdate: (self) => {
        const scroll = self.scroll();
        const direction = self.direction;

        if (direction === -1) {
          hideAnim.pause();
          showAnim.restart();
        } else if (scroll > 100) {
          showAnim.pause();
          hideAnim.restart();
        }

        const opacity = Math.min(scroll / 300, 0.95);
        nav.style.background = `rgba(9,9,11,${opacity})`;
        nav.style.borderColor = scroll > 50
          ? 'rgba(255,255,255,0.06)'
          : 'transparent';
      },
    });

    gsap.to(progressRef.current, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        start: 'top top',
        end: 'max',
        scrub: 0.3,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <header
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 border-b border-transparent backdrop-blur-xl will-change-transform"
      style={{ background: 'rgba(9,9,11,0)' }}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo - Escudo GAMC */}
        <a href="#inicio" className="flex items-center gap-2.5 group">
          <img
            src={escudoImg}
            alt="Escudo Alcaldia de Cochabamba"
            className="h-10 w-auto object-contain"
          />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-base tracking-tight text-white">
              Centro de Denuncias <span className="text-[#7C3AED]">Municipal</span>
            </span>
            <span className="text-[9px] text-[#52525b] tracking-wider uppercase">
              Gobierno Autonomo Municipal de Cochabamba
            </span>
          </div>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-sm text-[#a1a1aa] hover:text-white transition-colors duration-200 font-medium"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="primary"
            className="text-sm py-2"
            onClick={() => document.getElementById('consultar')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Consultar Denuncia
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-[#a1a1aa] hover:text-white transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/[0.06] px-6 py-4 flex flex-col gap-4 bg-[#09090b]/95 backdrop-blur-xl">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-[#a1a1aa] hover:text-white transition-colors font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Button variant="primary" className="w-full mt-2">
            Consultar Denuncia
          </Button>
        </div>
      )}

      {/* Scroll progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent">
        <div
          ref={progressRef}
          className="h-full origin-left"
          style={{
            background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
            transform: 'scaleX(0)',
          }}
        />
      </div>
    </header>
  );
}
