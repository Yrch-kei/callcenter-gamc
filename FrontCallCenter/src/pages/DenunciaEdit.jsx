import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, MapPin, User, FileText, Lock } from 'lucide-react'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import { Button, Input, Select, Card, CardHeader, CardTitle } from '@/components/ui'
import { useDenuncias } from '@/context/DenunciasContext'
import { PRIORITY, DENUNCIA_STATUS } from '@/utils/constants'
import catalogService from '@/services/catalogService'
import complaintService from '@/services/complaintService'

const schema = z.object({
  nombres:    z.string().min(2, 'Mínimo 2 caracteres'),
  apellidos:  z.string().min(2, 'Mínimo 2 caracteres'),
  telefono:   z.string().min(7, 'Teléfono inválido'),
  incident:   z.string().min(5, 'Mínimo 5 caracteres').max(300, 'Máximo 300 caracteres'),
  categoryId: z.coerce.number().int().positive('Selecciona una categoría'),
  prioridad:  z.string().min(1, 'Selecciona una prioridad'),
  direccion:  z.string().min(5, 'Sé más específico'),
})

const priorityOptions = [
  { value: PRIORITY.BAJA,    label: 'Baja' },
  { value: PRIORITY.MEDIA,   label: 'Media' },
  { value: PRIORITY.ALTA,    label: 'Alta' },
  { value: PRIORITY.URGENTE, label: 'Urgente' },
]

export default function DenunciaEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getById, editarDenuncia } = useDenuncias()
  const formRef = useRef(null)

  const denuncia = getById(id)

  // ── Catalog ───────────────────────────────────────────────────────────────────
  const [categories,   setCategories]   = useState([])
  const [selectedArea, setSelectedArea] = useState('')

  useEffect(() => {
    catalogService.getCategories().then(setCategories).catch(() => {})
  }, [])

  const areas = [...new Set(categories.map((c) => c.unit?.name).filter(Boolean))]
  const filteredCategories = selectedArea
    ? categories.filter((c) => c.unit?.name === selectedArea)
    : categories
  const areaOptions = areas.map((a) => ({ value: a, label: a }))
  const catOptions  = filteredCategories.map((c) => ({ value: c.id, label: c.name }))

  // ── Form ───────────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nombres:    '',
      apellidos:  '',
      telefono:   '',
      incident:   '',
      categoryId: '',
      prioridad:  '',
      direccion:  '',
    },
  })

  // Pre-cargar datos de la denuncia en el formulario
  useEffect(() => {
    if (!denuncia) return
    // ciudadano = "nombres apellidos" — separar en primer espacio
    const parts = (denuncia.ciudadano ?? '').split(' ')
    const nombres   = parts[0] ?? ''
    const apellidos = parts.slice(1).join(' ')

    // Pre-seleccionar área para filtrar categorías correctamente
    if (denuncia.area) setSelectedArea(denuncia.area)

    // Encontrar categoryId por nombre
    const matchedCat = categories.find((c) => c.name === denuncia.categoria)

    reset({
      nombres,
      apellidos,
      telefono:   denuncia.telefono   ?? '',
      incident:   denuncia.titulo     ?? '',
      categoryId: matchedCat?.id      ?? '',
      prioridad:  denuncia.prioridad  ?? '',
      direccion:  denuncia.direccion  ?? '',
    })
  }, [denuncia, categories, reset])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!formRef.current) return
    gsap.fromTo(formRef.current.children,
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' }
    )
  }, [])

  // Guardia: denuncia inexistente
  if (!denuncia) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-text-primary dark:text-text-dark-primary">
          Denuncia no encontrada
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/denuncias')}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
      </div>
    )
  }

  // Guardia: solo editable si está pendiente
  if (denuncia.estado !== DENUNCIA_STATUS.PENDIENTE) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Lock className="mb-3 h-10 w-10 text-text-muted" />
        <p className="text-lg font-medium text-text-primary dark:text-text-dark-primary">
          Edición bloqueada
        </p>
        <p className="mt-1 text-sm text-text-secondary dark:text-text-dark-secondary">
          Solo se pueden editar denuncias en estado <strong>Pendiente</strong>.
          Esta denuncia está en estado <strong>{denuncia.estado}</strong>.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(`/denuncias/${id}`)}>
          <ArrowLeft className="h-4 w-4" /> Volver al detalle
        </Button>
      </div>
    )
  }

  const onSubmit = async (data) => {
    const fd = new FormData()
    fd.append('names',      data.nombres)
    fd.append('lastname',   data.apellidos)
    fd.append('phone',      data.telefono)
    fd.append('incident',   data.incident)
    fd.append('address',    data.direccion)
    fd.append('categoryId', String(data.categoryId))
    fd.append('risk',       String(complaintService.PRIORITY_TO_RISK[data.prioridad] ?? 1))

    try {
      await editarDenuncia(id, fd)
      toast.success('Denuncia actualizada correctamente')
      navigate(`/denuncias/${id}`)
    } catch (err) {
      const msg = err?.response?.data?.error ?? 'Error al actualizar la denuncia'
      toast.error(msg)
    }
  }

  return (
    <div ref={formRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/denuncias/${id}`)}
          className="cursor-pointer rounded-lg p-2 text-text-secondary transition-colors hover:bg-gray-100 hover:text-text-primary dark:hover:bg-surface-dark-elevated"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary dark:text-text-dark-primary">
            Editar Denuncia
          </h1>
          <p className="mt-0.5 font-mono text-xs text-text-muted">{id}</p>
        </div>
      </div>

      {/* Aviso */}
      <div className="flex items-center gap-2.5 rounded-xl border border-warning/30 bg-warning-light px-4 py-3 text-sm font-medium text-warning">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning/20 text-xs">!</span>
        Cada cambio quedará registrado en el historial de auditoría.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Columna principal */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Información de la denuncia
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <div>
                  <label htmlFor="incident" className="mb-1.5 block text-sm font-medium text-text-primary dark:text-text-dark-primary">
                    Descripción <span className="text-accent">*</span>
                  </label>
                  <textarea
                    id="incident"
                    rows={4}
                    className="block w-full resize-y rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary"
                    aria-invalid={errors.incident ? 'true' : undefined}
                    {...register('incident')}
                  />
                  {errors.incident && (
                    <p className="mt-1.5 text-sm text-danger" role="alert">{errors.incident.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Área (filtro UI) */}
                  <Select
                    label="Filtrar por área"
                    placeholder="Todas las áreas"
                    options={areaOptions}
                    value={selectedArea}
                    onChange={(e) => {
                      setSelectedArea(e.target.value)
                      setValue('categoryId', '', { shouldValidate: false })
                    }}
                  />
                  <Select
                    label="Categoría"
                    placeholder={categories.length === 0 ? 'Cargando…' : 'Seleccionar categoría'}
                    options={catOptions}
                    error={errors.categoryId?.message}
                    required
                    disabled={categories.length === 0}
                    {...register('categoryId')}
                  />
                </div>
                <Select
                  label="Prioridad"
                  placeholder="Seleccionar prioridad"
                  options={priorityOptions}
                  error={errors.prioridad?.message}
                  required
                  {...register('prioridad')}
                />
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Ubicación
                  </span>
                </CardTitle>
              </CardHeader>
              <Input
                label="Dirección o referencia"
                error={errors.direccion?.message}
                required
                {...register('direccion')}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Datos del denunciante
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <Input
                  label="Nombres"
                  error={errors.nombres?.message}
                  required
                  {...register('nombres')}
                />
                <Input
                  label="Apellidos"
                  error={errors.apellidos?.message}
                  required
                  {...register('apellidos')}
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  error={errors.telefono?.message}
                  required
                  {...register('telefono')}
                />
              </div>
            </Card>

            <Card className="border-primary/30 bg-primary-50 dark:border-primary-700/30 dark:bg-primary-700/10">
              <p className="mb-4 text-sm text-text-secondary dark:text-text-dark-secondary">
                Solo los campos modificados quedarán en el historial de auditoría.
              </p>
              <div className="space-y-2">
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={!isDirty}
                  className="w-full"
                  size="lg"
                >
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate(`/denuncias/${id}`)}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
