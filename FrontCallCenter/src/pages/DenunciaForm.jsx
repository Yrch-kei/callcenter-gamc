import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  ArrowLeft, Send, MapPin, User, FileText, LocateFixed, X,
  AlertCircle, Paperclip, Search, Loader2,
} from 'lucide-react'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import { Button, Input, Select, Card, CardHeader, CardTitle } from '@/components/ui'
import { useDenuncias } from '@/context/DenunciasContext'
import { PRIORITY } from '@/utils/constants'
import catalogService from '@/services/catalogService'
import complaintService from '@/services/complaintService'
import departmentService from '@/services/departmentService'
import unitService from '@/services/unitService'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icons with bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Centro del mapa: Cochabamba, Bolivia
const MAP_CENTER = [-17.3895, -66.1568]
const COCHABAMBA_BOUNDS = [
  [-17.55, -66.28],
  [-17.30, -66.02],
]

const schema = z.object({
  nombres:    z.string().min(2, 'Mínimo 2 caracteres'),
  apellidos:  z.string().min(2, 'Mínimo 2 caracteres'),
  telefono:   z.string().min(7, 'Teléfono inválido'),
  title:      z.string().min(5, 'Mínimo 5 caracteres').max(150, 'Máximo 150 caracteres'),
  incident:   z.string().min(10, 'Mínimo 10 caracteres').max(1000, 'Máximo 1000 caracteres'),
  categoryId: z.coerce.number().int().positive('Selecciona una categoría'),
  prioridad:  z.string().min(1, 'Selecciona una prioridad'),
  direccion:  z.string().min(5, 'Sé más específico'),
  lat:        z.number({ required_error: 'Marca la ubicación en el mapa' })
               .nullable()
               .refine((v) => v !== null, 'Marca la ubicación en el mapa'),
  lng:        z.number().nullable().optional(),
})

const PRIORITY_OPTIONS = [
  { value: PRIORITY.BAJA,    label: 'Baja' },
  { value: PRIORITY.MEDIA,   label: 'Media' },
  { value: PRIORITY.ALTA,    label: 'Alta' },
  { value: PRIORITY.URGENTE, label: 'Urgente' },
]

// ─── Map sub-components ────────────────────────────────────────────────────────
function ClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

function FlyTo({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat != null && lng != null) map.flyTo([lat, lng], 17, { duration: 1 })
  }, [lat, lng, map])
  return null
}

function MapPicker({ lat, lng, onPick, onClear }) {
  const center = lat != null && lng != null ? [lat, lng] : MAP_CENTER
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef(null)

  const handleSearch = (value) => {
    setQuery(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (value.length < 3) { setResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value + ', Cochabamba, Bolivia')}&limit=5&viewbox=-66.28,-17.55,-66.02,-17.30&bounded=1`
        )
        const data = await res.json()
        setResults(data)
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 400)
  }

  const selectResult = (r) => {
    const rLat = parseFloat(r.lat)
    const rLng = parseFloat(r.lon)
    onPick(rLat, rLng)
    setQuery(r.display_name.split(',')[0])
    setResults([])
  }

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {searching ? <Loader2 className="h-4 w-4 animate-spin text-text-muted" /> : <Search className="h-4 w-4 text-text-muted" />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar calle o dirección..."
          className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary"
        />
        {results.length > 0 && (
          <div className="absolute z-[500] mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-surface-dark-card">
            {results.map((r) => (
              <button
                key={r.place_id}
                type="button"
                onClick={() => selectResult(r)}
                className="flex w-full cursor-pointer items-start gap-2 border-b border-gray-100 px-3 py-2 text-left text-sm hover:bg-gray-50 last:border-0 dark:border-gray-700 dark:hover:bg-surface-dark-elevated"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="line-clamp-2 text-text-primary dark:text-text-dark-primary">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600" style={{ height: 360 }}>
        <MapContainer
          center={center}
          zoom={13}
          minZoom={12}
          maxZoom={18}
          maxBounds={COCHABAMBA_BOUNDS}
          maxBoundsViscosity={1}
          className="h-full w-full"
          zoomControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onPick} />
          <FlyTo lat={lat} lng={lng} />
          {lat != null && lng != null && <Marker position={[lat, lng]} />}
        </MapContainer>

        {lat == null && (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-3">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-text-secondary shadow dark:bg-surface-dark-card/90">
              Haz clic en el mapa para marcar la ubicación exacta
            </span>
          </div>
        )}

        {lat != null && lng != null && (
          <div className="absolute bottom-2 left-2 z-[400] flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-mono text-text-secondary shadow dark:bg-surface-dark-card/95">
            <LocateFixed className="h-3 w-3 text-primary" />
            {lat.toFixed(5)}, {lng.toFixed(5)}
            <button
              type="button"
              onClick={onClear}
              className="ml-1 cursor-pointer rounded-full p-0.5 text-text-muted hover:text-danger"
              aria-label="Quitar ubicación"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function DenunciaForm() {
  const navigate = useNavigate()
  const { crearDenuncia } = useDenuncias()
  const formRef = useRef(null)

  // ── Catalog state ────────────────────────────────────────────────────────────
  const [departments,   setDepartments]   = useState([])
  const [units,         setUnits]         = useState([])
  const [categories,    setCategories]    = useState([])
  const [catalogError,  setCatalogError]  = useState(null)
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedUnit,  setSelectedUnit]  = useState('')
  const [evidenceFile,    setEvidenceFile]    = useState(null)
  const [evidencePreview, setEvidencePreview] = useState(null)
  const evidenceRef = useRef(null)

  useEffect(() => {
    Promise.all([
      departmentService.getAll(),
      unitService.getAll(),
      catalogService.getCategories(),
    ])
      .then(([deps, fetchedUnits, cats]) => {
        setDepartments(deps)
        setUnits(fetchedUnits)
        setCategories(cats.filter((category) => !category.parentCategoryId))
        setCatalogError(null)
      })
      .catch(() => setCatalogError('No se pudieron cargar los catálogos de clasificación.'))
  }, [])

  const departmentOptions = departments.map((department) => ({
    value: department.id,
    label: department.name,
  }))

  const filteredUnits = selectedDepartment
    ? units.filter((unit) => String(unit.department?.id) === String(selectedDepartment))
    : []

  const unitOptions = filteredUnits.map((unit) => ({
    value: unit.id,
    label: unit.name,
  }))

  const filteredCategories = selectedUnit
    ? categories.filter((category) => {
        const catUnitId = category.unitId ?? category.unit?.id
        return String(catUnitId) === String(selectedUnit)
      })
    : []

  const catOptions = filteredCategories.map((category) => ({
    value: category.id,
    label: category.name,
  }))

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nombres:    '',
      apellidos:  '',
      telefono:   '',
      title:      '',
      incident:   '',
      categoryId: '',
      prioridad:  '',
      direccion:  '',
      lat:        null,
      lng:        null,
    },
  })

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!formRef.current) return
    gsap.fromTo(formRef.current.children,
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' }
    )
  }, [])

  const watchLat = useWatch({ control, name: 'lat' })
  const watchLng = useWatch({ control, name: 'lng' })

  const handleMapPick = (lat, lng) => {
    setValue('lat', lat, { shouldValidate: true })
    setValue('lng', lng, { shouldValidate: false })
  }

  const handleMapClear = () => {
    setValue('lat', null, { shouldValidate: true })
    setValue('lng', null, { shouldValidate: false })
  }

  const handleEvidenceChange = (e) => {
    const file = e.target.files?.[0] ?? null
    setEvidenceFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setEvidencePreview(url)
    } else {
      setEvidencePreview(null)
    }
    e.target.value = ''
  }

  const clearEvidence = () => {
    if (evidencePreview) URL.revokeObjectURL(evidencePreview)
    setEvidenceFile(null)
    setEvidencePreview(null)
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    const fd = new FormData()
    fd.append('names',     data.nombres)
    fd.append('lastname',  data.apellidos)
    fd.append('phone',     data.telefono)
    fd.append('title',     data.title)
    fd.append('incident',  data.incident)
    fd.append('address',   data.direccion)
    fd.append('latitude',  String(data.lat))
    fd.append('longitude', String(data.lng ?? ''))
    fd.append('categoryId', String(data.categoryId))
    fd.append('risk', String(complaintService.PRIORITY_TO_RISK[data.prioridad] ?? 1))
    if (evidenceFile) fd.append('evidence', evidenceFile)

    try {
      const created = await crearDenuncia(fd)
      toast.success(
        <div>
          <p className="font-semibold">Denuncia registrada</p>
          <p className="text-sm text-gray-500">Código: {created.id}</p>
        </div>,
        { duration: 5000 }
      )
      navigate('/denuncias')
    } catch (err) {
      const msg = err?.response?.data?.error ?? 'Error al registrar la denuncia'
      toast.error(msg)
    }
  }

  return (
    <div ref={formRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/denuncias')}
          className="cursor-pointer rounded-lg p-2 text-text-secondary transition-colors hover:bg-gray-100 hover:text-text-primary dark:hover:bg-surface-dark-elevated"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary dark:text-text-dark-primary">
            Nueva Denuncia
          </h1>
          <p className="mt-0.5 text-sm text-text-secondary dark:text-text-dark-secondary">
            Completa los datos para registrar una denuncia ciudadana
          </p>
        </div>
      </div>

      {/* Error de catálogo */}
      {catalogError && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {catalogError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Columna principal ──────────────────────────────────────────── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Descripción */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Descripción de la denuncia
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <Input
                  label="Título"
                  placeholder="Ej: Bache peligroso en Av. Libertad"
                  error={errors.title?.message}
                  required
                  {...register('title')}
                />

                <div>
                  <label htmlFor="incident" className="mb-1.5 block text-sm font-medium text-text-primary dark:text-text-dark-primary">
                    Descripción detallada <span className="text-accent">*</span>
                  </label>
                  <textarea
                    id="incident"
                    rows={4}
                    placeholder="Describe el problema con el mayor detalle posible: qué observaste, desde cuándo, qué impacto tiene..."
                    className="block w-full resize-y rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary"
                    aria-invalid={errors.incident ? 'true' : undefined}
                    {...register('incident')}
                  />
                  {errors.incident && (
                    <p className="mt-1.5 text-sm text-danger" role="alert">{errors.incident.message}</p>
                  )}
                </div>

                <Select
                  label="Prioridad"
                  placeholder="Seleccionar prioridad"
                  options={PRIORITY_OPTIONS}
                  error={errors.prioridad?.message}
                  required
                  {...register('prioridad')}
                />
              </div>
            </Card>

            {/* Clasificación */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Clasificación
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <Select
                  label="Departamento"
                  placeholder={departments.length === 0 ? 'Cargando…' : 'Seleccionar departamento'}
                  options={departmentOptions}
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value)
                    setSelectedUnit('')
                    setValue('categoryId', '', { shouldValidate: false })
                  }}
                  disabled={departments.length === 0}
                />

                <Select
                  label="Sub-área"
                  placeholder={!selectedDepartment ? 'Selecciona primero un departamento' : 'Seleccionar sub-área'}
                  options={unitOptions}
                  value={selectedUnit}
                  onChange={(e) => {
                    setSelectedUnit(e.target.value)
                    setValue('categoryId', '', { shouldValidate: false })
                  }}
                  disabled={!selectedDepartment || filteredUnits.length === 0}
                />

                <Select
                  label="Categoría"
                  placeholder={!selectedUnit ? 'Selecciona primero una sub-área' : 'Seleccionar categoría'}
                  options={catOptions}
                  error={errors.categoryId?.message}
                  required
                  disabled={!selectedUnit || filteredCategories.length === 0}
                  {...register('categoryId')}
                />
              </div>
            </Card>

            {/* Ubicación */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Ubicación <span className="text-accent text-xs font-normal">(obligatoria)</span>
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="space-y-3">
                <Input
                  label="Dirección o referencia"
                  placeholder="Ej: Av. Libertad #450, esquina con calle Juárez"
                  error={errors.direccion?.message}
                  required
                  {...register('direccion')}
                />
                <MapPicker
                  lat={watchLat}
                  lng={watchLng}
                  onPick={handleMapPick}
                  onClear={handleMapClear}
                />
                {errors.lat && (
                  <p className="text-sm text-danger">{errors.lat.message}</p>
                )}
              </div>
            </Card>
          </div>

          {/* ── Sidebar ────────────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Denunciante */}
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
                  placeholder="Nombres del ciudadano"
                  error={errors.nombres?.message}
                  required
                  {...register('nombres')}
                />
                <Input
                  label="Apellidos"
                  placeholder="Apellidos del ciudadano"
                  error={errors.apellidos?.message}
                  required
                  {...register('apellidos')}
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  placeholder="70000000"
                  error={errors.telefono?.message}
                  required
                  {...register('telefono')}
                />
              </div>
            </Card>

            {/* Evidencia */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-primary" />
                    Evidencia fotográfica
                  </span>
                </CardTitle>
              </CardHeader>
              <p className="mb-3 text-xs text-text-muted">Adjunta una foto del problema (opcional). Formatos: JPG, PNG, WEBP.</p>
              <input
                ref={evidenceRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleEvidenceChange}
              />
              {evidenceFile ? (
                <div className="space-y-2">
                  {/* Image preview */}
                  {evidencePreview && (
                    <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <img
                        src={evidencePreview}
                        alt="Previsualización de evidencia"
                        className="h-48 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={clearEvidence}
                        className="absolute right-2 top-2 cursor-pointer rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-danger"
                        aria-label="Quitar foto"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-surface-dark-elevated">
                    <Paperclip className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-xs text-text-muted">
                      {evidenceFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => evidenceRef.current?.click()}
                      className="cursor-pointer text-xs text-primary hover:text-primary-dark"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => evidenceRef.current?.click()}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-text-muted transition-colors hover:border-primary hover:text-primary dark:border-gray-600"
                >
                  <Paperclip className="h-4 w-4" />
                  Adjuntar foto
                </button>
              )}
            </Card>

            {/* Submit */}
            <Card className="border-primary/30 bg-primary-50 dark:border-primary-700/30 dark:bg-primary-700/10">
              <p className="mb-4 text-sm text-text-secondary dark:text-text-dark-secondary">
                Verifica que la información sea correcta antes de enviar. Se generará un código único de seguimiento.
              </p>
              <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
                <Send className="h-4 w-4" />
                Registrar Denuncia
              </Button>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
