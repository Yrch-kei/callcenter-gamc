import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/**
 * Protege una ruta por rol.
 * - Si no está autenticado → redirige a /login
 * - Si no tiene el rol requerido → redirige a su homeRoute
 *
 * Uso:
 *   <RoleBasedRoute roles={[ROLES.OPERADOR, ROLES.ADMINISTRADOR]}>
 *     <MiPagina />
 *   </RoleBasedRoute>
 */
export default function RoleBasedRoute({ children, roles }) {
  const { isAuthenticated, hasAnyRole, homeRoute } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!hasAnyRole(roles)) return <Navigate to={homeRoute} replace />

  return children
}
