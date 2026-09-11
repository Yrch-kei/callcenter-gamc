import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import PublicLayout from '@/components/layout/PublicLayout'
import RoleBasedRoute from './RoleBasedRoute'
import { ROLES } from '@/utils/constants'
import { useAuth } from '@/context/AuthContext'

import Login from '@/pages/Login'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Dashboard from '@/pages/Dashboard'
import DenunciaList from '@/pages/DenunciaList'
import DenunciaForm from '@/pages/DenunciaForm'
import DenunciaDetail from '@/pages/DenunciaDetail'
import MapView from '@/pages/MapView'
import CitizenPortal from '@/pages/CitizenPortal'
import CampoHome         from '@/pages/campo/CampoHome'
import CampoDenuncia     from '@/pages/campo/CampoDenuncia'
import CampoIntervencion from '@/pages/campo/CampoIntervencion'
import AdminHome      from '@/pages/admin/AdminHome'
import AdminUsuarios  from '@/pages/admin/AdminUsuarios'
import AdminAreas     from '@/pages/admin/AdminAreas'
import AdminReportes  from '@/pages/admin/AdminReportes'
import DenunciaEdit from '@/pages/DenunciaEdit'
import Profile from '@/pages/Profile'
import TechnicianFieldView from '@/pages/TechnicianFieldView'

// Redirige a la home del rol autenticado, o a /login si no lo está
function RootRedirect() {
  const { isAuthenticated, homeRoute } = useAuth()
  return <Navigate to={isAuthenticated ? homeRoute : '/login'} replace />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Auth ─────────────────────────────────────────────────────── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* ── Operador + Administrador ──────────────────────────────────── */}
        <Route
          element={
            <RoleBasedRoute roles={[ROLES.OPERADOR, ROLES.ADMINISTRADOR]}>
              <MainLayout />
            </RoleBasedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/denuncias" element={<DenunciaList />} />
          <Route path="/denuncias/:id" element={<DenunciaDetail />} />
          <Route path="/mapa" element={<MapView />} />

          {/* Edición de denuncia — solo cuando está pendiente */}
          <Route
            path="/denuncias/:id/editar"
            element={
              <RoleBasedRoute roles={[ROLES.OPERADOR, ROLES.ADMINISTRADOR]}>
                <DenunciaEdit />
              </RoleBasedRoute>
            }
          />

          {/* Operador y administrador pueden crear denuncias */}
          <Route
            path="/denuncias/nueva"
            element={
              <RoleBasedRoute roles={[ROLES.OPERADOR, ROLES.ADMINISTRADOR]}>
                <DenunciaForm />
              </RoleBasedRoute>
            }
          />
        </Route>

        {/* ── Personal de Campo ─────────────────────────────────────────── */}
        <Route
          element={
            <RoleBasedRoute roles={[ROLES.PERSONAL_CAMPO, ROLES.ADMINISTRADOR]}>
              <MainLayout />
            </RoleBasedRoute>
          }
        >
          <Route path="/tecnico"                       element={<TechnicianFieldView />} />
          <Route path="/campo"                         element={<CampoHome />}         />
          <Route path="/campo/:id"                     element={<CampoDenuncia />}     />
          <Route path="/campo/:id/intervencion"        element={<CampoIntervencion />} />
          <Route path="/perfil"                        element={<Profile />}           />
        </Route>


        {/* ── Administrador ─────────────────────────────────────────────── */}
        <Route
          element={
            <RoleBasedRoute roles={[ROLES.ADMINISTRADOR]}>
              <MainLayout />
            </RoleBasedRoute>
          }
        >
          <Route path="/admin"             element={<AdminHome />}      />
          <Route path="/admin/usuarios"  element={<AdminUsuarios />}  />
          <Route path="/admin/areas"     element={<AdminAreas />}     />
          <Route path="/admin/reportes"  element={<AdminReportes />}  />
          <Route path="/perfil"          element={<Profile />}        />
        </Route>

        {/* ── Portal ciudadano (público) ────────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/seguimiento" element={<CitizenPortal />} />
        </Route>

        {/* ── Fallbacks ─────────────────────────────────────────────────── */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />

      </Routes>
    </BrowserRouter>
  )
}
