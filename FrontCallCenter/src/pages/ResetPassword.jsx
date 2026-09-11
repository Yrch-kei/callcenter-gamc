import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { authService } from '@/services/authService'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Requisitos de contraseña
  const hasMinLength = newPassword.length >= 8
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasLower = /[a-z]/.test(newPassword)
  const hasNumber = /\d/.test(newPassword)
  const isMatching = newPassword && newPassword === confirmPassword
  const isValid = hasMinLength && hasUpper && hasLower && hasNumber && isMatching

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      setError('Token de recuperación no válido o ausente.')
      return
    }

    if (!isValid) {
      setError('Asegúrate de cumplir todos los requisitos de contraseña y que coincidan.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await authService.resetPassword(token, newPassword)
      setSuccess(true)
      setTimeout(() => {
        navigate('/login', { state: { message: 'Contraseña restablecida exitosamente. Inicia sesión con tu nueva contraseña.' } })
      }, 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error al restablecer la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-center">
        <div className="sm:mx-auto sm:w-full sm:max-w-md bg-slate-800 border border-slate-700 p-8 rounded-2xl">
          <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Token ausente o no válido</h2>
          <p className="text-sm text-slate-400 mb-6">
            El enlace de recuperación es incompleto. Solicita uno nuevo en la sección de inicio de sesión.
          </p>
          <Link
            to="/forgot-password"
            className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 transition-colors"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-sky-600/20 border border-sky-500/30 rounded-2xl flex items-center justify-center mb-4">
          <KeyRound className="w-8 h-8 text-sky-400" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Restablecer Contraseña
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Crea una nueva contraseña segura para tu cuenta
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 border border-slate-700 py-8 px-6 shadow-xl rounded-2xl sm:px-10">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">¡Contraseña Actualizada!</h3>
              <p className="text-sm text-slate-300">
                Tu contraseña se ha restablecido correctamente. Redirigiendo al inicio de sesión...
              </p>
              <div className="pt-2">
                <Loader2 className="w-6 h-6 animate-spin text-sky-400 mx-auto" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-3 text-rose-400 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Nueva Contraseña
                </label>
                <div className="mt-2 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Confirmar Nueva Contraseña
                </label>
                <div className="mt-2 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Checklist de requisitos */}
              <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/60 space-y-2 text-xs">
                <p className="font-semibold text-slate-400 mb-1">La contraseña debe incluir:</p>
                <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mínimo 8 caracteres
                </div>
                <div className={`flex items-center gap-2 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Al menos una letra mayúscula
                </div>
                <div className={`flex items-center gap-2 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Al menos una letra minúscula
                </div>
                <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Al menos un número
                </div>
                <div className={`flex items-center gap-2 ${isMatching ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Las contraseñas coinciden
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isValid}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-40 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Actualizando contraseña...
                  </>
                ) : (
                  'Restablecer Contraseña'
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
