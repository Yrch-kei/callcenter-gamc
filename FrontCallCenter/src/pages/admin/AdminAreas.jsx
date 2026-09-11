import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Loader2, ChevronRight, Pencil, Trash2, ArrowUpDown, Building2, Layers3, Tags } from 'lucide-react'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import { Button, Modal, Tabs } from '@/components/ui'
import unitService from '@/services/unitService'
import departmentService from '@/services/departmentService'
import catalogService from '@/services/catalogService'
import api from '@/services/api'
import { cn } from '@/utils/cn'

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Nombre A-Z' },
  { value: 'name-desc', label: 'Nombre Z-A' },
  { value: 'date-desc', label: 'Mas recientes' },
  { value: 'date-asc', label: 'Mas antiguos' },
]

const inputClassName =
  'rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary'

function compareItems(a, b, sortBy) {
  switch (sortBy) {
    case 'name-desc':
      return (b.name ?? '').localeCompare(a.name ?? '', 'es', { sensitivity: 'base' })
    case 'date-desc':
      return new Date(b.registerDate ?? 0) - new Date(a.registerDate ?? 0)
    case 'date-asc':
      return new Date(a.registerDate ?? 0) - new Date(b.registerDate ?? 0)
    default:
      return (a.name ?? '').localeCompare(b.name ?? '', 'es', { sensitivity: 'base' })
  }
}

function sortItems(items, sortBy) {
  return [...items].sort((a, b) => compareItems(a, b, sortBy))
}

function SortControl({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-surface-dark-elevated">
      <ArrowUpDown className="h-4 w-4 text-text-muted" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md bg-white pr-7 text-sm text-text-primary outline-none dark:bg-surface-dark-elevated dark:text-text-dark-primary dark:[color-scheme:dark]"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <p className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-text-muted dark:border-gray-700">
      {message}
    </p>
  )
}

function ConfirmDeleteModal({ open, title, message, deleting, onClose, onConfirm }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-text-secondary dark:text-text-dark-secondary">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={deleting}>Cancelar</Button>
          <Button variant="danger" loading={deleting} onClick={onConfirm}>Eliminar</Button>
        </div>
      </div>
    </Modal>
  )
}

function ItemShell({ tone = 'primary', icon: Icon, title, subtitle, chips = [], onEdit, onDelete, children }) {
  const toneClasses = {
    primary: 'border-primary/20 bg-primary-50 dark:bg-primary-700/15',
    accent: 'border-accent/20 bg-accent-50 dark:bg-accent/10',
    neutral: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-surface-dark-elevated',
  }

  const titleClasses = {
    primary: 'text-primary-700 dark:text-primary',
    accent: 'text-accent',
    neutral: 'text-text-primary dark:text-text-dark-primary',
  }

  return (
    <div className={cn('rounded-xl border px-4 py-3.5 transition-colors', toneClasses[tone])}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {Icon && <Icon className="h-4 w-4 shrink-0 text-text-muted" />}
            <p className={cn('text-sm font-semibold', titleClasses[tone])}>{title}</p>
            {chips.map((chip) => (
              <span key={chip} className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-text-muted dark:bg-black/20">
                {chip}
              </span>
            ))}
          </div>
          {subtitle && <p className="mt-1 text-xs leading-relaxed text-text-muted">{subtitle}</p>}
          {children}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="cursor-pointer rounded-lg p-2 text-text-muted transition-colors hover:bg-white/60 hover:text-primary dark:hover:bg-black/10">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="cursor-pointer rounded-lg p-2 text-text-muted transition-colors hover:bg-white/60 hover:text-danger dark:hover:bg-black/10">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, description, count, sortBy, onSortChange }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-primary shadow-sm dark:bg-black/10">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary dark:text-text-dark-primary">{title}</h2>
              <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">{description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-text-muted">{count} registro{count !== 1 && 's'}</p>
          <SortControl value={sortBy} onChange={onSortChange} />
        </div>
      </div>
    </div>
  )
}

// ── DepartmentsTab ────────────────────────────────────────────────────────────
function DepartmentsTab({ onRefresh }) {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await departmentService.getAll()
      setDepartments(data)
    } catch {
      toast.error('No se pudieron cargar los departamentos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!name.trim()) { toast.error('El nombre es requerido'); return }
    setSaving(true)
    try {
      const created = await departmentService.create({ name: name.trim(), description: description.trim() })
      setDepartments((prev) => [...prev, created])
      setName('')
      setDescription('')
      onRefresh?.()
      toast.success('Departamento creado')
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, deptName) => {
    try {
      await departmentService.delete(id)
      setDepartments((prev) => prev.filter((d) => d.id !== id))
      onRefresh?.()
      toast.success(`"${deptName}" eliminado`)
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'No se pudo eliminar')
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-text-primary dark:text-text-dark-primary">Departamentos / Áreas Principales</h2>
        <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">
          Nivel 1 de la jerarquía. Ejemplo: Infraestructura Urbana, Medio Ambiente, Alumbrado Público.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Nombre del departamento" className="flex-1 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary" />
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Descripción (opcional)" className="flex-1 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary" />
        <button onClick={handleAdd} disabled={saving || !name.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Agregar
        </button>
      </div>

      <p className="text-xs text-text-muted">{departments.length} departamento{departments.length !== 1 && 's'}</p>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-text-muted" /></div>
      ) : departments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-text-muted dark:border-gray-700">No hay departamentos. Agrega el primero.</p>
      ) : (
        <div className="space-y-2">
          {departments.map((d) => (
            <div key={d.id} className="flex items-start justify-between gap-3 rounded-lg border border-primary/20 bg-primary-50 px-4 py-3 dark:bg-primary-700/15">
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary-700 dark:text-primary">{d.name}</p>
                {d.description && <p className="mt-0.5 text-xs text-text-muted">{d.description}</p>}
                {d.units?.length > 0 && (
                  <p className="mt-1 text-[11px] text-text-muted">
                    Sub-áreas: {d.units.filter(u => u.status === 1).map(u => u.name).join(', ')}
                  </p>
                )}
              </div>
              <button onClick={() => handleDelete(d.id, d.name)}
                className="mt-0.5 shrink-0 cursor-pointer rounded p-0.5 opacity-60 transition-opacity hover:opacity-100 hover:text-danger" aria-label={`Eliminar ${d.name}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── UnitsTab (Sub-áreas) ──────────────────────────────────────────────────────
function UnitsTab({ departments, onRefresh }) {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await unitService.getAll()
      setUnits(data)
    } catch {
      toast.error('No se pudieron cargar las sub-áreas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!name.trim() || !description.trim()) { toast.error('Nombre y descripción son requeridos'); return }
    setSaving(true)
    try {
      const payload = { name: name.trim(), description: description.trim() }
      if (departmentId) payload.departmentId = Number(departmentId)
      const created = await unitService.create(payload)
      setUnits((prev) => [...prev, created])
      setName('')
      setDescription('')
      setDepartmentId('')
      onRefresh?.()
      catalogService.clearCache()
      toast.success('Sub-área creada')
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, unitName) => {
    try {
      await unitService.delete(id)
      setUnits((prev) => prev.filter((u) => u.id !== id))
      onRefresh?.()
      catalogService.clearCache()
      toast.success(`"${unitName}" eliminada`)
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'No se pudo eliminar')
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-text-primary dark:text-text-dark-primary">Sub-áreas Operativas</h2>
        <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">
          Nivel 2. Pertenecen a un departamento. Ejemplo: Vías y Pavimento (dentro de Infraestructura).
        </p>
      </div>

      {departments.length === 0 && (
        <p className="rounded-lg border border-dashed border-warning/40 bg-warning-light px-4 py-2.5 text-xs text-warning">
          Primero crea al menos un departamento antes de agregar sub-áreas.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}
          className={cn('rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary sm:w-52', !departmentId && 'text-text-muted')}>
          <option value="">Departamento (opcional)</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Nombre de la sub-área" className="flex-1 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary" />
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Descripción" className="flex-1 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary" />
        <button onClick={handleAdd} disabled={saving || !name.trim() || !description.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Agregar
        </button>
      </div>

      <p className="text-xs text-text-muted">{units.length} sub-área{units.length !== 1 && 's'}</p>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-text-muted" /></div>
      ) : units.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-text-muted dark:border-gray-700">No hay sub-áreas.</p>
      ) : (
        <div className="space-y-2">
          {units.map((u) => (
            <div key={u.id} className="flex items-start justify-between gap-3 rounded-lg border border-primary/20 bg-primary-50 px-4 py-3 dark:bg-primary-700/15">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {u.department?.name && (
                    <>
                      <span className="text-xs text-text-muted">{u.department.name}</span>
                      <ChevronRight className="h-3 w-3 text-text-muted" />
                    </>
                  )}
                  <span className="text-sm font-medium text-primary-700 dark:text-primary">{u.name}</span>
                </div>
                {u.description && <p className="mt-0.5 text-xs text-text-muted">{u.description}</p>}
              </div>
              <button onClick={() => handleDelete(u.id, u.name)}
                className="mt-0.5 shrink-0 cursor-pointer rounded p-0.5 opacity-60 transition-opacity hover:opacity-100 hover:text-danger" aria-label={`Eliminar ${u.name}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── CategoriesTab ─────────────────────────────────────────────────────────────
function CategoriesTab({ units }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [unitId, setUnitId] = useState('')
  const [parentId, setParentId] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      catalogService.clearCache()
      const data = await catalogService.getCategories()
      setCategories(data)
    } catch {
      toast.error('No se pudieron cargar las categorías')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Filter parent categories by selected unit
  const parentOptions = unitId
    ? categories.filter((c) => c.unit?.id === Number(unitId))
    : []

  const handleAdd = async () => {
    if (!name.trim() || !unitId) { toast.error('Nombre y sub-área son requeridos'); return }
    setSaving(true)
    try {
      const payload = { name: name.trim(), unitId: Number(unitId) }
      if (parentId) payload.parentCategoryId = Number(parentId)
      await api.post('/categories', payload)
      setName('')
      setParentId('')
      catalogService.clearCache()
      load() // reload to get proper nesting
      toast.success(parentId ? 'Subcategoría creada' : 'Categoría creada')
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, catName) => {
    try {
      await api.delete(`/categories/${id}`)
      catalogService.clearCache()
      load()
      toast.success(`"${catName}" eliminada`)
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'No se pudo eliminar')
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-text-primary dark:text-text-dark-primary">Categorías y Subcategorías</h2>
        <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">
          Nivel 3 y 4. Cada categoría pertenece a una sub-área. Puedes crear subcategorías dentro de una categoría.
        </p>
      </div>

      {units.length === 0 && (
        <p className="rounded-lg border border-dashed border-warning/40 bg-warning-light px-4 py-2.5 text-xs text-warning">
          Primero crea al menos una sub-área antes de agregar categorías.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <select value={unitId} onChange={(e) => { setUnitId(e.target.value); setParentId('') }}
          className={cn('rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary sm:w-48', !unitId && 'text-text-muted')}>
          <option value="">Sub-área...</option>
          {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={parentId} onChange={(e) => setParentId(e.target.value)}
          disabled={!unitId || parentOptions.length === 0}
          className={cn('rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary sm:w-48', !parentId && 'text-text-muted', (!unitId || parentOptions.length === 0) && 'opacity-50')}>
          <option value="">Sin padre (categoría)</option>
          {parentOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={parentId ? 'Nombre de subcategoría' : 'Nombre de categoría'}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary" />
        <button onClick={handleAdd} disabled={saving || !name.trim() || !unitId}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Agregar
        </button>
      </div>

      <p className="text-xs text-text-muted">{categories.length} categoría{categories.length !== 1 && 's'}</p>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-text-muted" /></div>
      ) : categories.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-text-muted dark:border-gray-700">No hay categorías.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id}>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/20 bg-accent-50 px-4 py-2.5 dark:bg-accent/10">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-sm font-medium text-accent">{c.name}</span>
                  {c.unit?.name && (
                    <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-medium text-text-muted dark:bg-black/20">{c.unit.name}</span>
                  )}
                </div>
                <button onClick={() => handleDelete(c.id, c.name)}
                  className="shrink-0 cursor-pointer rounded p-0.5 opacity-60 transition-opacity hover:opacity-100 hover:text-danger" aria-label={`Eliminar ${c.name}`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Subcategories */}
              {c.subcategories?.filter(s => s.status === 1).length > 0 && (
                <div className="ml-6 mt-1 space-y-1">
                  {c.subcategories.filter(s => s.status === 1).map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-surface-dark-elevated">
                      <div className="flex items-center gap-1.5 text-xs">
                        <ChevronRight className="h-3 w-3 text-text-muted" />
                        <span className="font-medium text-text-primary dark:text-text-dark-primary">{sub.name}</span>
                      </div>
                      <button onClick={() => handleDelete(sub.id, sub.name)}
                        className="shrink-0 cursor-pointer rounded p-0.5 opacity-60 transition-opacity hover:opacity-100 hover:text-danger">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DepartmentsTabEnhanced({ onRefresh }) {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [sortBy, setSortBy] = useState('name-asc')
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setDepartments(await departmentService.getAll())
    } catch {
      toast.error('No se pudieron cargar los departamentos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  const sortedDepartments = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    const filtered = normalized
      ? departments.filter((d) =>
          [d.name, d.description, ...(d.units ?? []).map((u) => u.name)]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalized))
        )
      : departments
    return sortItems(filtered, sortBy)
  }, [departments, search, sortBy])

  const createDepartment = async () => {
    if (!name.trim()) return toast.error('El nombre es requerido')
    setSaving(true)
    try {
      const created = await departmentService.create({ name: name.trim(), description: description.trim() })
      setDepartments((prev) => sortItems([...prev, created], sortBy))
      setName('')
      setDescription('')
      onRefresh?.()
      toast.success('Departamento creado')
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  const updateDepartment = async () => {
    if (!editingDepartment?.name?.trim()) return toast.error('El nombre es requerido')
    setSaving(true)
    try {
      const updated = await departmentService.update(editingDepartment.id, {
        name: editingDepartment.name.trim(),
        description: editingDepartment.description?.trim() ?? '',
      })
      setDepartments((prev) => prev.map((d) => (d.id === editingDepartment.id ? updated : d)))
      setEditingDepartment(null)
      onRefresh?.()
      toast.success('Departamento actualizado')
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const deleteDepartment = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await departmentService.delete(deleteTarget.id)
      setDepartments((prev) => prev.filter((d) => d.id !== deleteTarget.id))
      setDeleteTarget(null)
      onRefresh?.()
      toast.success(`"${deleteTarget.name}" eliminado`)
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'No se pudo eliminar')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Building2}
        title="Departamentos / Areas Principales"
        description="Nivel 1 de la jerarquia. Ejemplo: Infraestructura Urbana, Medio Ambiente, Alumbrado Publico."
        count={departments.length}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createDepartment()} placeholder="Nombre del departamento" className={inputClassName} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createDepartment()} placeholder="Descripcion (opcional)" className={inputClassName} />
        <Button className="lg:self-start" loading={saving} onClick={createDepartment}>
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, descripcion o sub-area..."
        className={cn('w-full', inputClassName)}
      />

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-text-muted" /></div>
      ) : sortedDepartments.length === 0 ? (
        <EmptyState message="No hay departamentos. Agrega el primero." />
      ) : (
        <div className="space-y-3">
          {sortedDepartments.map((d) => (
            <ItemShell key={d.id} tone="primary" icon={Building2} title={d.name} subtitle={d.description} onEdit={() => setEditingDepartment({ ...d })} onDelete={() => setDeleteTarget(d)}>
              {!!d.units?.filter((u) => u.status === 1).length && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-text-muted">Sub-areas:</span>
                  {d.units.filter((u) => u.status === 1).map((u) => (
                    <span key={u.id} className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-text-muted dark:bg-black/20">{u.name}</span>
                  ))}
                </div>
              )}
            </ItemShell>
          ))}
        </div>
      )}

      <Modal open={!!editingDepartment} onClose={() => setEditingDepartment(null)} title="Editar departamento">
        <div className="space-y-4">
          <input value={editingDepartment?.name ?? ''} onChange={(e) => setEditingDepartment((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nombre del departamento" className={cn('w-full', inputClassName)} />
          <textarea value={editingDepartment?.description ?? ''} onChange={(e) => setEditingDepartment((prev) => ({ ...prev, description: e.target.value }))} rows={3} placeholder="Descripcion" className={cn('w-full resize-none', inputClassName)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingDepartment(null)} disabled={saving}>Cancelar</Button>
            <Button loading={saving} onClick={updateDepartment}>Guardar cambios</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal open={!!deleteTarget} title="Eliminar departamento" message={`Se eliminara "${deleteTarget?.name}" y sus sub-areas asociadas quedaran desactivadas. ¿Estas seguro?`} deleting={deleting} onClose={() => setDeleteTarget(null)} onConfirm={deleteDepartment} />
    </div>
  )
}

function UnitsTabEnhanced({ departments, onRefresh }) {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [sortBy, setSortBy] = useState('name-asc')
  const [editingUnit, setEditingUnit] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setUnits(await unitService.getAll())
    } catch {
      toast.error('No se pudieron cargar las sub-areas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  const sortedUnits = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    const filtered = normalized
      ? units.filter((u) =>
          [u.name, u.description, u.department?.name]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalized))
        )
      : units
    return sortItems(filtered, sortBy)
  }, [search, sortBy, units])

  const createUnit = async () => {
    if (!name.trim() || !description.trim()) return toast.error('Nombre y descripcion son requeridos')
    setSaving(true)
    try {
      const payload = { name: name.trim(), description: description.trim() }
      if (departmentId) payload.departmentId = Number(departmentId)
      const created = await unitService.create(payload)
      setUnits((prev) => sortItems([...prev, created], sortBy))
      setName('')
      setDescription('')
      setDepartmentId('')
      onRefresh?.()
      catalogService.clearCache()
      toast.success('Sub-area creada')
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  const updateUnit = async () => {
    if (!editingUnit?.name?.trim() || !editingUnit?.description?.trim()) return toast.error('Nombre y descripcion son requeridos')
    setSaving(true)
    try {
      const payload = {
        name: editingUnit.name.trim(),
        description: editingUnit.description.trim(),
      }
      if (editingUnit.departmentId) payload.departmentId = Number(editingUnit.departmentId)
      const updated = await unitService.update(editingUnit.id, payload)
      setUnits((prev) => prev.map((u) => (u.id === editingUnit.id ? updated : u)))
      setEditingUnit(null)
      onRefresh?.()
      catalogService.clearCache()
      toast.success('Sub-area actualizada')
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const deleteUnit = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await unitService.delete(deleteTarget.id)
      setUnits((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      setDeleteTarget(null)
      onRefresh?.()
      catalogService.clearCache()
      toast.success(`"${deleteTarget.name}" eliminada`)
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'No se pudo eliminar')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader icon={Layers3} title="Sub-areas Operativas" description="Nivel 2. Pertenecen a un departamento. Ejemplo: Vias y Pavimento dentro de Infraestructura." count={units.length} sortBy={sortBy} onSortChange={setSortBy} />

      {departments.length === 0 && (
        <p className="rounded-xl border border-dashed border-warning/40 bg-warning-light px-4 py-3 text-xs text-warning">
          Primero crea al menos un departamento antes de agregar sub-areas.
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-[220px_1fr_1fr_auto]">
        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={inputClassName}>
          <option value="">Departamento (opcional)</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createUnit()} placeholder="Nombre de la sub-area" className={inputClassName} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createUnit()} placeholder="Descripcion" className={inputClassName} />
        <Button className="lg:self-start" loading={saving} onClick={createUnit}>
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por sub-area, descripcion o departamento..."
        className={cn('w-full', inputClassName)}
      />

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-text-muted" /></div>
      ) : sortedUnits.length === 0 ? (
        <EmptyState message="No hay sub-areas registradas." />
      ) : (
        <div className="space-y-3">
          {sortedUnits.map((u) => (
            <ItemShell key={u.id} tone="primary" icon={Layers3} title={u.name} subtitle={u.description} onEdit={() => setEditingUnit({ ...u, departmentId: u.department?.id ? String(u.department.id) : '' })} onDelete={() => setDeleteTarget(u)}>
              {u.department?.name && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                  <span>{u.department.name}</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-medium text-primary">{u.name}</span>
                </div>
              )}
            </ItemShell>
          ))}
        </div>
      )}

      <Modal open={!!editingUnit} onClose={() => setEditingUnit(null)} title="Editar sub-area">
        <div className="space-y-4">
          <select value={editingUnit?.departmentId ?? ''} onChange={(e) => setEditingUnit((prev) => ({ ...prev, departmentId: e.target.value }))} className={cn('w-full', inputClassName)}>
            <option value="">Departamento (opcional)</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input value={editingUnit?.name ?? ''} onChange={(e) => setEditingUnit((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nombre de la sub-area" className={cn('w-full', inputClassName)} />
          <textarea value={editingUnit?.description ?? ''} onChange={(e) => setEditingUnit((prev) => ({ ...prev, description: e.target.value }))} rows={3} placeholder="Descripcion" className={cn('w-full resize-none', inputClassName)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingUnit(null)} disabled={saving}>Cancelar</Button>
            <Button loading={saving} onClick={updateUnit}>Guardar cambios</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal open={!!deleteTarget} title="Eliminar sub-area" message={`Se eliminara "${deleteTarget?.name}" y sus categorias asociadas quedaran desactivadas. ¿Deseas continuar?`} deleting={deleting} onClose={() => setDeleteTarget(null)} onConfirm={deleteUnit} />
    </div>
  )
}

function CategoriesTabEnhanced({ units }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [unitId, setUnitId] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [sortBy, setSortBy] = useState('name-asc')
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      catalogService.clearCache()
      setCategories(await catalogService.getCategories())
    } catch {
      toast.error('No se pudieron cargar las categorias')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const sortedCategories = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    const filtered = normalized
      ? categories.filter((c) =>
          [c.name, c.unit?.name]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalized))
        )
      : categories
    return sortItems(filtered, sortBy)
  }, [categories, search, sortBy])

  const createCategory = async () => {
    if (!name.trim() || !unitId) return toast.error('Nombre y sub-area son requeridos')
    setSaving(true)
    try {
      await api.post('/categories', { name: name.trim(), unitId: Number(unitId) })
      setName('')
      setUnitId('')
      await load()
      toast.success('Categoria creada')
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  const updateCategory = async () => {
    if (!editingCategory?.name?.trim() || !editingCategory?.unitId) return toast.error('Nombre y sub-area son requeridos')
    setSaving(true)
    try {
      await api.put(`/categories/${editingCategory.id}`, {
        name: editingCategory.name.trim(),
        unitId: Number(editingCategory.unitId),
        parentCategoryId: null,
      })
      setEditingCategory(null)
      await load()
      toast.success('Categoria actualizada')
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/categories/${deleteTarget.id}`)
      setDeleteTarget(null)
      await load()
      toast.success(`"${deleteTarget.name}" eliminada`)
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'No se pudo eliminar')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader icon={Tags} title="Categorias" description="Cada categoria pertenece a una sub-area operativa." count={categories.length} sortBy={sortBy} onSortChange={setSortBy} />

      {units.length === 0 && (
        <p className="rounded-xl border border-dashed border-warning/40 bg-warning-light px-4 py-3 text-xs text-warning">
          Primero crea al menos una sub-area antes de agregar categorias.
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto]">
        <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={inputClassName}>
          <option value="">Sub-area...</option>
          {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createCategory()} placeholder="Nombre de categoria" className={inputClassName} />
        <Button variant="accent" className="lg:self-start" loading={saving} onClick={createCategory}>
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por categoria o sub-area..."
        className={cn('w-full', inputClassName)}
      />

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-text-muted" /></div>
      ) : sortedCategories.length === 0 ? (
        <EmptyState message="No hay categorias registradas." />
      ) : (
        <div className="space-y-3">
          {sortedCategories.map((c) => (
            <ItemShell key={c.id} tone="accent" icon={Tags} title={c.name} chips={c.unit?.name ? [c.unit.name] : []} onEdit={() => setEditingCategory({ ...c, unitId: c.unit?.id ? String(c.unit.id) : '' })} onDelete={() => setDeleteTarget(c)} />
          ))}
        </div>
      )}

      <Modal open={!!editingCategory} onClose={() => setEditingCategory(null)} title="Editar categoria">
        <div className="space-y-4">
          <select value={editingCategory?.unitId ?? ''} onChange={(e) => setEditingCategory((prev) => ({ ...prev, unitId: e.target.value }))} className={cn('w-full', inputClassName)}>
            <option value="">Sub-area...</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <input value={editingCategory?.name ?? ''} onChange={(e) => setEditingCategory((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nombre de categoria" className={cn('w-full', inputClassName)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingCategory(null)} disabled={saving}>Cancelar</Button>
            <Button variant="accent" loading={saving} onClick={updateCategory}>Guardar cambios</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal open={!!deleteTarget} title="Eliminar categoria" message={`Se eliminara "${deleteTarget?.name}". ¿Deseas continuar?`} deleting={deleting} onClose={() => setDeleteTarget(null)} onConfirm={deleteCategory} />
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminAreas() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('departments')
  const [departments, setDepartments] = useState([])
  const [units, setUnits] = useState([])

  const loadDeps = useCallback(async () => {
    try { setDepartments(await departmentService.getAll()) } catch { setDepartments([]) }
  }, [])

  const loadUnits = useCallback(async () => {
    try { setUnits(await unitService.getAll()) } catch { setUnits([]) }
  }, [])

  const refreshAll = useCallback(() => {
    loadDeps()
    loadUnits()
  }, [loadDeps, loadUnits])

  useEffect(() => {
    Promise.all([departmentService.getAll(), unitService.getAll()])
      .then(([nextDepartments, nextUnits]) => {
        setDepartments(nextDepartments)
        setUnits(nextUnits)
      })
      .catch(() => {
        setDepartments([])
        setUnits([])
      })
  }, [])

  const containerRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(containerRef.current, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' })
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!contentRef.current) return
    gsap.fromTo(contentRef.current, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: 'power2.out' })
  }, [activeTab])

  const tabs = [
    { value: 'departments', label: 'Departamentos' },
    { value: 'areas',       label: 'Sub-áreas'     },
    { value: 'categories',  label: 'Categorías'    },
  ]

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex items-center gap-1.5 text-sm text-text-muted">
        <button onClick={() => navigate('/admin')} className="cursor-pointer transition-colors hover:text-primary">Administración</button>
        <span>/</span>
        <span className="font-medium text-text-primary dark:text-text-dark-primary">Áreas y Categorías</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary dark:text-text-dark-primary">Áreas y Categorías</h1>
        <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">
          Gestión jerárquica: Departamento → Sub-área → Categoría → Subcategoría
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div ref={contentRef} className="rounded-xl border border-gray-200 bg-surface-card p-6 dark:border-gray-700 dark:bg-surface-dark-card">
        {activeTab === 'departments' && <DepartmentsTabEnhanced onRefresh={refreshAll} />}
        {activeTab === 'areas' && <UnitsTabEnhanced departments={departments} onRefresh={refreshAll} />}
        {activeTab === 'categories' && <CategoriesTabEnhanced units={units} />}
      </div>
    </div>
  )
}
