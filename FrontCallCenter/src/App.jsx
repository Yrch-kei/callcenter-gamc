import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { DenunciasProvider } from '@/context/DenunciasContext'
import { UsersProvider } from '@/context/UsersContext'
import AppRouter from '@/router/AppRouter'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UsersProvider>
        <DenunciasProvider>
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '0.75rem', fontSize: '0.875rem' },
            }}
          />
        </DenunciasProvider>
        </UsersProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
