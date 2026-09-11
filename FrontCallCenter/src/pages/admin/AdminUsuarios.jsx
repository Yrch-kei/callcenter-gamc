import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Search, X, ShieldCheck, HardHat, Headset, User, Loader2,
} from 'lucide-react'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import { Button, Input, Select, Modal } from '@/components/ui'
import { useUsers } from '@/context/UsersContext'
import userService from '@/services/userService'
import unitService from '@/services/unitService'
import { ROLE_CONFIG } from '@/utils/constants'
import { cn } from '@/utils/cn'

// ── Mapeo roles backend → claves frontend ──────────────────────────────────────
const ROLE_FRONT_MAP = {
  'Operador de Call Center': 'operador',
  'Operador Call Center':    'operador',
  'Jefe de Unidad':          'operador',
  'Personal de Campo':       'personal_campo',
  'Tecnico de campo':        'personal_campo',
  'Administrador':           'administrador',
}

const GENDER_OPTIONS = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Femenino',  label: 'Femenino'  },
]

const ROLE_ICON = {
  operador:       Headset,
  personal_campo: HardHat,
  administrador:  ShieldCheck,
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function RoleBadge({ roleRaw }) {
  const key = ROLE_FRONT_MAP[roleRaw] ?? 'operador'
  const cfg = ROLE_CONFIG[key]
  const Icon = ROLE_ICON[key] ?? User
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', cfg?.bg, cfg?.color)}>
      <Icon className="h-3 w-3" />
      {roleRaw ?? cfg?.label ?? key}
    </span>
  )
}

function Avatar({ name, roleRaw }) {
  const key = ROLE_FRONT_MAP[roleRaw] ?? 'operador'
  const cfg = ROLE_CONFIG[key]
  return (
    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold', cfg?.bg, cfg?.color)}>
      {getInitials(name)}
    </div>
  )
}

// ── User Form Modal ────────────────────────────────────────────────────────────
function UserModal({ open, onClose, editUser, onSave, roles, units }) {
  const isEditing = !!editUser

  const [names,          setNames]          = useState('')
  const [lastname,       setLastname]       = useState('')
  const [secondLastname, setSecondLastname] = useState('')
  const [ci,             setCi]             = useState('')
  const [phone,          setPhone]          = useState('')
  const [birthdate,      setBirthdate]      = useState('')
  const [gender,         setGender]         = useState('')
  const [email,          setEmail]          = useState('')
  const [roleId,         setRoleId]         = useState('')
  const [unitId,         setUnitId]         = useState('')
  const [errors,         setErrors]         = useState({})
  const [loading,        setLoading]        = useState(false)

  // Sync form when modal opens
  useEffect(() => {
    if (!open) return
    setNames(editUser?.names          ?? '')
    setLastname(editUser?.lastname    ?? '')
    setSecondLastname(editUser?.secondLastname ?? '')
    setCi(editUser?.ci                ?? '')
    setPhone(editUser?.phone          ?? '')
    setBirthdate(editUser?.birthdate  ?? '')
    setGender(editUser?.gender        ?? '')
    setEmail(editUser?.email          ?? '')
    setRoleId(editUser?.roleId        ?? '')
    setUnitId(editUser?.unitId        ?? '')
    setErrors({})
  }, [open, editUser])

  const validate = () => {
    const e = {}
    if (!names.trim()) e.names = 'Nombres requeridos'
    else if (/\d/.test(names)) e.names = 'Los nombres no deben contener números'

    if (!lastname.trim()) e.lastname = 'Apellido paterno requerido'
    else if (/\d/.test(lastname)) e.lastname = 'El apellido no debe contener números'

    if (!ci.trim()) e.ci = 'El CI es obligatorio'
    else if (!/^(E-)?\d{7,8}(-[0-9A-Za-z]{2})?$/i.test(ci.trim())) e.ci = 'Ingrese un número de CI válido (7-8 dígitos)'

    if (!phone.trim()) e.phone = 'Teléfono requerido'
    else if (phone.trim().replace(/\D/g, '').length < 7) e.phone = 'Debe tener al menos 7 dígitos'

    if (!birthdate) e.birthdate = 'Fecha de nacimiento requerida'
    if (!gender) e.gender = 'Selección de género requerida'

    if (!email.trim()) e.email = 'El correo electrónico es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Formato de correo electrónico inválido'

    if (!roleId) e.roleId = 'La selección de rol es obligatoria'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      const payload = {
        names:          names.trim(),
        lastname:       lastname.trim(),
        secondLastname: secondLastname.trim() || undefined,
        ci:             ci.trim(),
        phone:          phone.trim(),
        birthdate,
        gender,
        email:          email.trim().toLowerCase(),
        roleId:         Number(roleId),
        unitId:         unitId ? Number(unitId) : undefined,
      }
      await onSave(payload)
    } catch (err) {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? 'Error al guardar el usuario'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }))
  const unitOptions = units.map((u) => ({ value: u.id, label: u.name }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar usuario' : 'Nuevo usuario'}
      size="sm"
    >
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nombres"
            value={names}
            onChange={(e) => setNames(e.target.value)}
            error={errors.names}
            placeholder="María"
            required
          />
          <Input
            label="Apellido paterno"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            error={errors.lastname}
            placeholder="García"
            required
          />
        </div>
        <Input
          label="Apellido materno"
          value={secondLastname}
          onChange={(e) => setSecondLastname(e.target.value)}
          placeholder="López (opcional)"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="CI"
            value={ci}
            onChange={(e) => setCi(e.target.value)}
            error={errors.ci}
            placeholder="1234567"
            required
          />
          <Input
            label="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            placeholder="71234567"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Fecha de nacimiento"
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            error={errors.birthdate}
            required
          />
          <Select
            label="Género"
            placeholder="Seleccionar"
            options={GENDER_OPTIONS}
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            error={errors.gender}
            required
          />
        </div>
        <Input
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="usuario@municipio.gob"
          required
        />
        {!isEditing && (
          <p className="rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-700 dark:bg-primary-700/15 dark:text-primary">
            La contraseña se generará automáticamente y se enviará al correo del usuario.
          </p>
        )}
        <Select
          label="Rol"
          placeholder={roles.length === 0 ? 'Cargando roles…' : 'Seleccionar rol'}
          options={roleOptions}
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          error={errors.roleId}
          disabled={roles.length === 0}
          required
        />
        <Select
          label="Unidad / Área"
          placeholder={units.length === 0 ? 'Sin unidades' : 'Seleccionar (opcional)'}
          options={unitOptions}
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
        />
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" loading={loading} onClick={handleSave}>
            {isEditing ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────
function ConfirmModal({ open, onClose, onConfirm, userName }) {
  const [loading, setLoading] = useState(false)
  const handleConfirm = async () => {
    setLoading(true)
    try { await onConfirm() } finally { setLoading(false) }
  }
  return (
    <Modal open={open} onClose={onClose} title="Desactivar usuario" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
          ¿Desactivar al usuario <span className="font-semibold text-text-primary dark:text-text-dark-primary">{userName}</span>?
          {' '}El usuario no podrá iniciar sesión. Puedes reactivarlo después.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1 bg-danger hover:bg-danger/90 focus:ring-danger/30"
            loading={loading}
            onClick={handleConfirm}
          >
            Desactivar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminUsuarios() {
  const navigate = useNavigate()
  const { users, loading, error, addUser, updateUser, toggleUser } = useUsers()

  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [modal,      setModal]      = useState(null)
  const [selected,   setSelected]   = useState(null)

  // Catálogos para el modal
  const [roles, setRoles] = useState([])
  const [units, setUnits] = useState([])

  const tableRef = useRef(null)

  // Cargar roles y unidades una vez
  useEffect(() => {
    userService.getRoles().then(setRoles).catch(() => {})
    unitService.getAll().then(setUnits).catch(() => {})
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!tableRef.current) return
    const rows = tableRef.current.querySelectorAll('[data-row]')
    if (rows.length) {
      gsap.fromTo(rows,
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' }
      )
    }
  }, [roleFilter, search, users])

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchRole   = !roleFilter || u.roleRaw === roleFilter
    return matchSearch && matchRole
  })

  // Roles únicos para el filtro
  const uniqueRoles = [...new Set(users.map((u) => u.roleRaw).filter(Boolean))]
  const roleOptions = [
    { value: '', label: 'Todos los roles' },
    ...uniqueRoles.map((r) => ({ value: r, label: r })),
  ]

  // ── Handlers ────────────────────────────────────────────────────────────────
  const openCreate = () => { setSelected(null); setModal('create') }
  const openEdit   = (u) => { setSelected(u);   setModal('edit')   }
  const openDelete = (u) => { setSelected(u);   setModal('delete') }

  const handleSave = async (data) => {
    if (selected) {
      await updateUser(selected.id, data)
      toast.success('Usuario actualizado')
    } else {
      await addUser(data)
      toast.success('Usuario creado. La contraseña fue enviada por email.')
    }
    setModal(null)
  }

  const handleDelete = async () => {
    await toggleUser(selected.id, true)
    toast.success('Usuario desactivado')
    setModal(null)
  }

  const handleToggle = async (u) => {
    try {
      await toggleUser(u.id, u.active)
      toast.success(u.active ? 'Usuario desactivado' : 'Usuario activado')
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Error al cambiar el estado')
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-sm text-text-muted">
        <button onClick={() => navigate('/admin')} className="cursor-pointer transition-colors hover:text-primary">
          Administración
        </button>
        <span>/</span>
        <span className="font-medium text-text-primary dark:text-text-dark-primary">Usuarios</span>
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary dark:text-text-dark-primary">
            Gestión de Usuarios
          </h1>
          <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">
            {loading ? 'Cargando…' : `${users.length} usuario${users.length !== 1 ? 's' : ''} registrados`}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-9 pl-10 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="w-full sm:w-56">
          <Select
            options={roleOptions}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          />
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div
        ref={tableRef}
        className="overflow-hidden rounded-xl border border-gray-200 bg-surface-card dark:border-gray-700 dark:bg-surface-dark-card"
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Cargando usuarios…</span>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-surface-dark-elevated">
                    {['Usuario', 'Rol', 'Área / Unidad', 'Estado', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-text-muted">
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr
                        key={u.id}
                        data-row
                        className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-surface-dark-elevated/60"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} roleRaw={u.roleRaw} />
                            <div>
                              <p className="font-medium text-text-primary dark:text-text-dark-primary">{u.name}</p>
                              <p className="text-xs text-text-muted">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <RoleBadge roleRaw={u.roleRaw} />
                        </td>
                        <td className="px-4 py-3.5 text-sm text-text-secondary dark:text-text-dark-secondary">
                          {u.area ?? <span className="text-text-muted">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            u.active
                              ? 'bg-success-light text-success'
                              : 'bg-gray-100 text-text-muted dark:bg-surface-dark-elevated'
                          )}>
                            {u.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggle(u)}
                              title={u.active ? 'Desactivar' : 'Activar'}
                              className={cn(
                                'cursor-pointer rounded-lg p-1.5 transition-colors',
                                u.active
                                  ? 'text-success hover:bg-success-light'
                                  : 'text-text-muted hover:bg-gray-100 dark:hover:bg-surface-dark-elevated'
                              )}
                            >
                              {u.active
                                ? <ToggleRight className="h-4 w-4" />
                                : <ToggleLeft  className="h-4 w-4" />
                              }
                            </button>
                            <button
                              onClick={() => openEdit(u)}
                              title="Editar"
                              className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-700/15"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {u.active && (
                              <button
                                onClick={() => openDelete(u)}
                                title="Desactivar"
                                className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-danger-light hover:text-danger"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-gray-100 md:hidden dark:divide-gray-800">
              {filtered.length === 0 ? (
                <p className="py-12 text-center text-sm text-text-muted">No se encontraron usuarios.</p>
              ) : (
                filtered.map((u) => (
                  <div key={u.id} data-row className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} roleRaw={u.roleRaw} />
                        <div>
                          <p className="font-medium text-text-primary dark:text-text-dark-primary">{u.name}</p>
                          <p className="mt-0.5 text-xs text-text-muted">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-primary-50 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {u.active && (
                          <button
                            onClick={() => openDelete(u)}
                            className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-danger-light hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <RoleBadge roleRaw={u.roleRaw} />
                      {u.area && <span className="text-xs text-text-secondary dark:text-text-dark-secondary">{u.area}</span>}
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-semibold',
                        u.active ? 'bg-success-light text-success' : 'bg-gray-100 text-text-muted'
                      )}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <UserModal
        open={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        editUser={modal === 'edit' ? selected : null}
        onSave={handleSave}
        roles={roles}
        units={units}
      />
      <ConfirmModal
        open={modal === 'delete'}
        onClose={() => setModal(null)}
        onConfirm={handleDelete}
        userName={selected?.name}
      />
    </div>
  )
}
