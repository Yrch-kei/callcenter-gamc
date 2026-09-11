import { Outlet } from 'react-router-dom'
import escudo from '@/assets/escudo-GAMC-vertical.png'

export default function AuthLayout() {
  return (
    <div className="flex min-h-dvh">
      {/* Left panel - branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] p-12 lg:flex">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-sky-400/5 blur-2xl" />

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-4">
            <img src={escudo} alt="Escudo GAMC" className="h-14 w-auto drop-shadow-lg" />
            <div>
              <span className="block text-xl font-bold text-white tracking-wide">Denuncias Municipales</span>
              <span className="block text-xs text-white/50 tracking-wider uppercase">Gobierno Autónomo Municipal</span>
            </div>
          </div>
        </div>

        {/* Central content */}
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-white/70 tracking-wide">Sistema activo 24/7</span>
          </div>
          <h2 className="text-5xl leading-[1.1] font-extrabold text-white">
            Gestión eficiente de
            <span className="block bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
              denuncias ciudadanas
            </span>
          </h2>
          <p className="max-w-md text-base leading-relaxed text-white/60">
            Plataforma integral para el registro, seguimiento y resolución de denuncias municipales de Cochabamba.
          </p>
          <div className="flex gap-8 pt-2">
            <div>
              <p className="text-2xl font-bold text-white">15</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Distritos</p>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div>
              <p className="text-2xl font-bold text-white">6</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Comunas</p>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div>
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Atención</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-sm text-white/30">
          &copy; {new Date().getFullYear()} Gobierno Autónomo Municipal de Cochabamba
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full items-center justify-center bg-surface-card px-6 py-12 lg:w-1/2 dark:bg-surface-dark">
        <div className="w-full max-w-[420px]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
