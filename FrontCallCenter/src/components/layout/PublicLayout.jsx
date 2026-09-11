import { Outlet } from 'react-router-dom'

export default function PublicLayout() {
  return (
    <div className="min-h-dvh bg-surface dark:bg-surface-dark">
      {/* Simple header */}
      <header className="border-b border-gray-200 bg-surface-card px-4 py-4 dark:border-gray-700 dark:bg-surface-dark-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-white">
            DM
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">
              Portal Ciudadano
            </h1>
            <p className="text-xs text-text-muted">Seguimiento de denuncias</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 lg:p-6">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-sm text-text-muted dark:border-gray-700">
        &copy; {new Date().getFullYear()} Municipalidad — Portal de Seguimiento
      </footer>
    </div>
  )
}
