import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Phone, User, Calendar, Tag, UserCheck, Clock,
  FileText, MessageSquare, Image, CircleDot, CheckCircle2, AlertCircle,
  PlusCircle, Edit, ArrowRightLeft, Pencil, Send, Download, XCircle, RotateCcw, Star,
} from 'lucide-react'
import gsap from 'gsap'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, Button, Badge, Modal, Select } from '@/components/ui'
import StatusBadge from '@/components/shared/StatusBadge'
import PriorityIndicator from '@/components/shared/PriorityIndicator'
import { useDenuncias } from '@/context/DenunciasContext'
import {
  DENUNCIA_STATUS, TRANSICIONES_VALIDAS, ESTADO_TRANSICION_CONFIG, AREAS_OPERATIVAS,
} from '@/utils/constants'
import { downloadReport } from '@/utils/reportPDF'
import complaintService from '@/services/complaintService'
import { cn } from '@/utils/cn'

// â”€â”€â”€ Iconos y colores del timeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TIMELINE_ICONS = {
  creacion:     PlusCircle,
  asignacion:   UserCheck,
  cambio_estado: CircleDot,
  nota:         MessageSquare,
  derivacion:   ArrowRightLeft,
  edicion:      Edit,
}

const TIMELINE_COLORS = {
  creacion:      'text-primary bg-primary-50 dark:bg-primary-700/20 dark:text-primary',
  asignacion:    'text-blue-600 bg-blue-50 dark:bg-blue-700/20 dark:text-blue-400',
  cambio_estado: 'text-amber-600 bg-amber-50 dark:bg-amber-700/20 dark:text-amber-400',
  nota:          'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400',
  derivacion:    'text-accent bg-accent-50 dark:bg-accent/10 dark:text-accent',
  edicion:       'text-text-secondary bg-gray-50 dark:bg-gray-700/50 dark:text-text-dark-secondary',
}

// â”€â”€â”€ Modal: Cambiar Estado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalCambiarEstado({ open, onClose, estadoActual, onConfirm }) {
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(false)

  const transiciones = TRANSICIONES_VALIDAS[estadoActual] ?? []
  const requiereNota = nuevoEstado === DENUNCIA_STATUS.RECHAZADA

  const handleClose = () => {
    setNuevoEstado('')
    setNota('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!nuevoEstado) return toast.error('Selecciona el nuevo estado')
    if (requiereNota && !nota.trim()) return toast.error('Justifica el rechazo')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    onConfirm(nuevoEstado, nota.trim())
    setNuevoEstado('')
    setNota('')
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={handleClose} title="Cambiar estado" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
          Selecciona el nuevo estado para esta denuncia.
        </p>

        <div className="space-y-2">
          {transiciones.map((estado) => {
            const cfg = ESTADO_TRANSICION_CONFIG[estado]
            return (
              <button
                key={estado}
                type="button"
                onClick={() => setNuevoEstado(estado)}
                className={cn(
                  'w-full rounded-xl border p-3 text-left transition-all',
                  nuevoEstado === estado
                    ? `${cfg.color} border-2 font-semibold`
                    : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-surface-dark-elevated'
                )}
              >
                <p className="text-sm font-medium">{cfg.label}</p>
                <p className="mt-0.5 text-xs opacity-75">{cfg.desc}</p>
              </button>
            )
          })}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-text-dark-primary">
            {requiereNota ? (
              <>Justificación <span className="text-accent">*</span></>
            ) : (
              'Nota adicional (opcional)'
            )}
          </label>
          <textarea
            rows={3}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder={requiereNota ? 'Explica por qué se rechaza la denuncia...' : 'Agrega contexto sobre el cambio...'}
            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            loading={loading}
            disabled={!nuevoEstado}
            onClick={handleSubmit}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// â”€â”€â”€ Modal: Agregar Observaci?n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalObservacion({ open, onClose, onConfirm }) {
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)

  const handleClose = () => { setTexto(''); onClose() }

  const handleSubmit = async () => {
    if (!texto.trim()) return toast.error('Escribe una observación')
    if (texto.trim().length < 10) return toast.error('Mínimo 10 caracteres')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    onConfirm(texto.trim())
    setTexto('')
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={handleClose} title="Agregar observación" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
          La observación quedará registrada en el historial de la denuncia.
        </p>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-text-dark-primary">
            Observación <span className="text-accent">*</span>
          </label>
          <textarea
            rows={4}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Describe la novedad, gestión realizada o información relevante..."
            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary"
          />
          <p className="mt-1 text-right text-xs text-text-muted">{texto.length} caracteres</p>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={handleClose}>Cancelar</Button>
          <Button className="flex-1" loading={loading} onClick={handleSubmit}>
            <Send className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ————————————————— Modal: Derivar a otra área —————————————————————————————————————
function ModalDerivar({ open, onClose, onConfirm, areaActual }) {
  const [area, setArea] = useState('')
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(false)

  const opciones = AREAS_OPERATIVAS
    .filter((a) => a !== areaActual)
    .map((a) => ({ value: a, label: a }))

  const handleClose = () => { setArea(''); setNota(''); onClose() }

  const handleSubmit = async () => {
    if (!area) return toast.error('Selecciona el área destino')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    onConfirm(area, nota.trim())
    setArea('')
    setNota('')
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={handleClose} title="Derivar a otra área" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
          La denuncia será reasignada al área seleccionada y quedará registrado en el historial.
        </p>
        <Select
          label="Área destino"
          placeholder="Seleccionar área"
          options={opciones}
          value={area}
          onChange={(e) => setArea(e.target.value)}
          required
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-text-dark-primary">
            Motivo de derivación (opcional)
          </label>
          <textarea
            rows={3}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Explica por qué se deriva a esta área..."
            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={handleClose}>Cancelar</Button>
          <Button className="flex-1" loading={loading} disabled={!area} onClick={handleSubmit}>
            <ArrowRightLeft className="h-4 w-4" />
            Derivar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ————————————————— Modal: Evaluar Reapertura —————————————————————————————————————
function ModalEvaluarReapertura({ open, onClose, action, onConfirm }) {
  const [nota, setNota] = useState('')
  const [loading, setLoading] = useState(false)

  const isApprove = action === 'APPROVE'
  const title = isApprove ? 'Aprobar Reapertura de Denuncia' : 'Rechazar Reapertura (Nota Técnica)'

  const handleClose = () => {
    setNota('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!isApprove && !nota.trim()) {
      return toast.error('Debes ingresar una nota técnica justificando el rechazo')
    }
    setLoading(true)
    await onConfirm(action, nota.trim())
    setNota('')
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={handleClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
          {isApprove
            ? 'Al aprobar la reapertura, la denuncia pasará nuevamente a estado "En proceso" para que la cuadrilla técnica reintervenga en el lugar.'
            : 'Explica las razones técnicas por las cuales se desestima la solicitud de reapertura del ciudadano:'}
        </p>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-text-dark-primary">
            {isApprove ? 'Instrucciones para la cuadrilla (opcional)' : <>Nota técnica de rechazo <span className="text-accent">*</span></>}
          </label>
          <textarea
            rows={3}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder={isApprove ? 'Agrega instrucciones adicionales...' : 'Explica la resolución técnica...'}
            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            className={cn('flex-1 font-bold', isApprove ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white')}
            loading={loading}
            onClick={handleSubmit}
          >
            {isApprove ? 'Confirmar Aprobar' : 'Confirmar Rechazo'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ————————————————— Modal: Asignar Técnico —————————————————————————————————————
function ModalAsignarTecnico({ open, onClose, onConfirm }) {
  const [tecnicos, setTecnicos] = useState([])
  const [selectedTech, setSelectedTech] = useState('')
  const [observacion, setObservacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (open) {
      setFetching(true)
      complaintService.getTechnicians()
        .then((res) => setTecnicos(res || []))
        .catch(() => toast.error('No se pudo cargar la lista de técnicos'))
        .finally(() => setFetching(false))
    }
  }, [open])

  const handleClose = () => {
    setSelectedTech('')
    setObservacion('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!selectedTech) return toast.error('Selecciona un técnico de campo')
    setLoading(true)
    try {
      await onConfirm(Number(selectedTech), observacion.trim())
      handleClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Asignar Técnico de Campo" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
          Selecciona el técnico responsable que atenderá esta denuncia en terreno.
        </p>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-text-dark-primary">
            Técnico Disponible <span className="text-accent">*</span>
          </label>
          {fetching ? (
            <p className="py-2 text-xs text-text-muted">Cargando técnicos de campo...</p>
          ) : (
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm font-medium text-text-primary focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary"
            >
              <option value="">-- Selecciona un técnico --</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {[t.names, t.lastname].filter(Boolean).join(' ')} {t.unit?.name ? `(${t.unit.name})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary dark:text-text-dark-primary">
            Instrucciones u observaciones iniciales (Opcional)
          </label>
          <textarea
            rows={3}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Ej: Inspeccionar poste roto frente a la plaza principal..."
            className="w-full resize-none rounded-xl border border-gray-300 bg-white p-3 text-sm text-text-primary placeholder-text-muted focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            loading={loading}
            disabled={!selectedTech}
            onClick={handleSubmit}
          >
            Confirmar Asignación
          </Button>
        </div>
      </div>
    </Modal>
  )
}

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const backendUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
    : `http://${window.location.hostname}:3000`;

  return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ————————————————— Evidencia con fallback ——————————————————————————————————————
function EvidenceCard({ url }) {
  const [broken, setBroken] = useState(false)
  if (broken) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Image className="h-4 w-4 text-primary" />
            Evidencia fotográfica
          </span>
        </CardTitle>
      </CardHeader>
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <img
          src={getImageUrl(url)}
          alt="Evidencia de la denuncia"
          className="w-full max-h-96 object-contain bg-gray-50 dark:bg-surface-dark-elevated"
          loading="lazy"
          onError={(e) => {
            console.error('Error cargando evidencia principal:', e.currentTarget.src);
            setBroken(true);
          }}
        />
      </div>
    </Card>
  )
}

// ————————————————— Componente principal ——————————————————————————————————————————
export default function DenunciaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getById, getHistorial, loadHistorial, getEvidencias, cambiarEstado, agregarObservacion, derivar, evaluateReopen, refetch } = useDenuncias()
  const contentRef = useRef(null)

  const [modal, setModal]             = useState(null) // 'estado' | 'nota' | 'derivar' | 'evaluar_reapertura'
  const [evaluarAction, setEvaluarAction] = useState('APPROVE') // 'APPROVE' | 'REJECT'
  const [historialLoading, setHistorialLoading] = useState(false)
  const [pdfLoading, setPdfLoading]   = useState(false)
  const [pdfDone, setPdfDone]         = useState(false)
  const pdfBtnRef = useRef(null)

  const historial  = getHistorial(id)
  const evidencias = getEvidencias(id)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setHistorialLoading(true)
    loadHistorial(id).finally(() => { if (!cancelled) setHistorialLoading(false) })
    return () => { cancelled = true }
  }, [id, loadHistorial])

  const denuncia = getById(id)

  const handleDownloadPDF = useCallback(async () => {
    setPdfLoading(true)
    try {
      if (denuncia?.estado === DENUNCIA_STATUS.RESUELTA && denuncia?._id) {
        await complaintService.downloadPdf(denuncia._id, denuncia.id)
      } else {
        const ok = downloadReport(denuncia, historial)
        if (!ok) { toast.error('El navegador bloqueó la ventana emergente. Permite popups e intenta de nuevo.'); return }
      }
      setPdfDone(true)
      if (pdfBtnRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.fromTo(pdfBtnRef.current, { scale: 0.94 }, { scale: 1, duration: 0.35, ease: 'back.out(1.7)' })
      }
      setTimeout(() => setPdfDone(false), 3000)
    } catch {
      toast.error('No se pudo generar el PDF')
    } finally {
      setPdfLoading(false)
    }
  }, [denuncia, historial])

  const esPendiente   = denuncia?.estado === DENUNCIA_STATUS.PENDIENTE
  const esTerminal    = [DENUNCIA_STATUS.RESUELTA, DENUNCIA_STATUS.RECHAZADA].includes(denuncia?.estado)
  const transiciones  = TRANSICIONES_VALIDAS[denuncia?.estado] ?? []
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!contentRef.current) return
    gsap.fromTo(contentRef.current.children,
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.07, ease: 'power3.out' }
    )
  }, [id])

  const handleCambiarEstado = useCallback(async (nuevoEstado, nota) => {
    try {
      await cambiarEstado(id, nuevoEstado, nota)
      setModal(null)
      toast.success('Estado actualizado correctamente')
      loadHistorial(id)
    } catch (err) {
      console.error('Error al cambiar el estado:', err)
      toast.error('Error al cambiar el estado')
    }
  }, [cambiarEstado, loadHistorial, id])

  const handleEvaluateReopen = useCallback(async (action, note) => {
    try {
      await evaluateReopen(id, action, note)
      setModal(null)
      toast.success(action === 'APPROVE' ? 'Reapertura aprobada correctamente' : 'Solicitud de reapertura desestimada')
      loadHistorial(id)
    } catch (err) {
      console.error('Error al evaluar reapertura:', err)
      toast.error('Error al evaluar la reapertura de la denuncia')
    }
  }, [evaluateReopen, loadHistorial, id])

  const handleObservacion = useCallback(async (texto) => {
    try {
      await agregarObservacion(id, texto)
      setModal(null)
      toast.success('Observación registrada')
      loadHistorial(id)
    } catch {
      toast.error('Error al registrar la observación')
    }
  }, [agregarObservacion, loadHistorial, id])

  const handleDerivar = useCallback(async (area, nota) => {
    try {
      await derivar(id, area, nota)
      setModal(null)
      toast.success(`Denuncia derivada al área ${area}`)
      loadHistorial(id)
    } catch {
      toast.error('Error al derivar la denuncia')
    }
  }, [derivar, loadHistorial, id])

  const handleAsignarTecnico = useCallback(async (technicianId, observacion) => {
    try {
      const targetId = denuncia?._id || id
      await complaintService.assign(targetId, technicianId, observacion)
      setModal(null)
      toast.success('Técnico de campo asignado exitosamente')
      if (typeof refetch === 'function') refetch()
      loadHistorial(id)
    } catch (err) {
      console.error('Error al asignar técnico:', err)
      toast.error(err?.response?.data?.error || 'Error al asignar técnico')
    }
  }, [denuncia, id, loadHistorial, refetch])

  const handleVerEnMapa = useCallback(() => {
    const rawLat = denuncia?.latitude ?? denuncia?.lat
    const rawLng = denuncia?.longitude ?? denuncia?.lng
    const lat = parseFloat(rawLat)
    const lng = parseFloat(rawLng)
    navigate('/mapa', {
      state: {
        selectedId: denuncia?.id || denuncia?.code || denuncia?._id || id,
        lat: !isNaN(lat) ? lat : -17.3895,
        lng: !isNaN(lng) ? lng : -66.1568
      }
    })
  }, [denuncia, navigate, id])

  // ————————————————— Not found ——————————————————————————————————————————————————
  if (!denuncia) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-text-muted" />
        <p className="mt-4 text-lg font-medium text-text-primary dark:text-text-dark-primary">
          Denuncia no encontrada
        </p>
        <p className="mt-1 text-sm text-text-muted">El código {id} no existe en el sistema.</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/denuncias')}>
          <ArrowLeft className="h-4 w-4" />
          Volver a denuncias
        </Button>
      </div>
    )
  }

  return (
    <>
      <div ref={contentRef} className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-text-muted">
          <button onClick={() => navigate('/denuncias')} className="cursor-pointer transition-colors hover:text-primary">
            Denuncias
          </button>
          <span>/</span>
          <span className="font-medium text-text-primary dark:text-text-dark-primary">{denuncia.id}</span>
        </div>

        {/* Alerta Destacada: Solicitud de Reapertura Solicidada por Ciudadano */}
        {denuncia.reopenStatus === 'REQUESTED' && (
          <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-bold text-base">
                <AlertCircle className="h-6 w-6 shrink-0" />
                <span>SOLICITUD DE REAPERTURA DE DENUNCIA PENDIENTE</span>
              </div>
              <Badge color="amber">Requiere Evaluación</Badge>
            </div>
            <div className="space-y-2 text-sm text-text-primary dark:text-text-dark-primary">
              <p className="font-medium">El ciudadano ha expresado disconformidad y solicita reabrir el caso:</p>
              <div className="rounded-xl bg-white p-4 border border-amber-200 dark:bg-surface-dark-card dark:border-amber-500/30 font-mono text-sm italic">
                "{denuncia.reopenReason}"
              </div>
              {denuncia.citizenEmail && (
                <p className="text-xs text-text-muted">
                  Correo de contacto del ciudadano: <strong className="text-text-primary dark:text-text-dark-primary">{denuncia.citizenEmail}</strong>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                onClick={() => { setEvaluarAction('APPROVE'); setModal('evaluar_reapertura') }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Aprobar Reapertura (Reabrir Ticket)
              </Button>
              <Button
                variant="outline"
                className="border-rose-500 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                onClick={() => { setEvaluarAction('REJECT'); setModal('evaluar_reapertura') }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar Reapertura (Nota Técnica)
              </Button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-text-primary dark:text-text-dark-primary">
                {denuncia.titulo}
              </h1>
              <StatusBadge status={denuncia.estado} />
              <PriorityIndicator priority={denuncia.prioridad} />
            </div>
            <p className="mt-1 font-mono text-xs text-text-muted">
              {denuncia.id} - registrado {dayjs(denuncia.fecha).format('DD/MM/YYYY [a las] HH:mm')}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleVerEnMapa}>
              <MapPin className="h-4 w-4 text-primary" />
              Ver en mapa
            </Button>
            {!esTerminal && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                  onClick={() => setModal('asignar_tecnico')}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Asignar Técnico
                </Button>
                <Button variant="outline" size="sm" onClick={() => setModal('estado')}>
                  <CircleDot className="h-4 w-4" />
                  Cambiar Estado
                </Button>
                <Button size="sm" onClick={() => setModal('nota')}>
                  <MessageSquare className="h-4 w-4" />
                  Agregar Nota
                </Button>
              </>
            )}
            {esTerminal && (
              <Button variant="outline" size="sm" onClick={() => setModal('nota')}>
                <MessageSquare className="h-4 w-4" />
                Agregar Nota
              </Button>
            )}
            <Button
              ref={pdfBtnRef}
              variant="outline"
              size="sm"
              loading={pdfLoading}
              onClick={handleDownloadPDF}
              className={cn(pdfDone && 'border-success text-success dark:border-success dark:text-success')}
            >
              {pdfDone
                ? <><CheckCircle2 className="h-4 w-4" />Descargado</>
                : <><Download className="h-4 w-4" />Descargar reporte</>
              }
            </Button>
          </div>
        </div>

        {/* Alerta estado terminal */}
        {esTerminal && (
          <div className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium',
            denuncia.estado === DENUNCIA_STATUS.RESUELTA
              ? 'border-success/30 bg-success-light text-success'
              : 'border-danger/30 bg-danger-light text-danger'
          )}>
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {denuncia.estado === DENUNCIA_STATUS.RESUELTA
              ? 'Esta denuncia fue resuelta. No se pueden realizar más cambios de estado.'
              : 'Esta denuncia fue rechazada. No se pueden realizar más cambios de estado.'}
          </div>
        )}

        {/* Content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Columna principal */}
          <div className="space-y-6 lg:col-span-2">
            {/* Descripción */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Descripción
                  </span>
                </CardTitle>
              </CardHeader>
              <p className="leading-relaxed text-text-secondary dark:text-text-dark-secondary">
                {denuncia.descripcion}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge color="gray" size="sm">
                  <Tag className="mr-1 h-3 w-3" />
                  {denuncia.categoria}
                </Badge>
                <Badge color="gray" size="sm">
                  <MapPin className="mr-1 h-3 w-3" />
                  {denuncia.direccion}
                </Badge>
                {denuncia.area && (
                  <Badge color="gray" size="sm">
                    <ArrowRightLeft className="mr-1 h-3 w-3" />
                    Área: {denuncia.area}
                  </Badge>
                )}
              </div>
            </Card>

            {/* Evidencia principal */}
            {denuncia.evidence && (
              <EvidenceCard url={denuncia.evidence} />
            )}

            {/* Fotos de intervención */}
            {evidencias.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <span className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-primary" />
                      Fotos de intervención ({evidencias.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {evidencias.map((ev) => (
                    <div
                      key={ev.id}
                      className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <img
                        src={getImageUrl(ev.url)}
                        alt={ev.alt || "Foto después de intervención"}
                        className="aspect-4/3 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          console.error('Error cargando imagen:', e.currentTarget.src);
                        }}
                      />
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {ev.alt && ev.alt.includes('antes') ? 'ANTES' : 'DESPUÉS'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Informe de Cierre de Campo */}
            {(denuncia.technicalNotes || denuncia.materialsUsed || denuncia.resolutionResult || denuncia.arrivalTime || denuncia.finishTime) && (
              <Card className="border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10">
                <CardHeader>
                  <CardTitle>
                    <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      Informe de Cierre de Campo
                    </span>
                  </CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  {denuncia.resolutionResult && (
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Resultado de Intervención:</span>
                      <div className="mt-1 font-semibold text-emerald-800 dark:text-emerald-300">
                        {denuncia.resolutionResult}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-surface-dark-card p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                    <div>
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Hora de Llegada:
                      </span>
                      <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary mt-0.5">
                        {denuncia.arrivalTime ? dayjs(denuncia.arrivalTime).format('DD/MM/YYYY HH:mm:ss') : 'No registrada'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Hora de Finalización:
                      </span>
                      <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary mt-0.5">
                        {denuncia.finishTime ? dayjs(denuncia.finishTime).format('DD/MM/YYYY HH:mm:ss') : 'No registrada'}
                      </p>
                    </div>
                    {denuncia.arrivalTime && denuncia.finishTime && (
                      <div className="col-span-1 sm:col-span-2 pt-1 border-t border-gray-100 dark:border-gray-800 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        ⏱️ Tiempo en terreno: {Math.max(1, dayjs(denuncia.finishTime).diff(dayjs(denuncia.arrivalTime), 'minute'))} minutos
                      </div>
                    )}
                  </div>

                  {denuncia.technicalNotes && (
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Notas Técnicas del Trabajo:</span>
                      <p className="mt-1 text-sm bg-white dark:bg-surface-dark-card p-3 rounded-xl border border-gray-200 dark:border-gray-800 text-text-primary dark:text-text-dark-primary whitespace-pre-line">
                        {denuncia.technicalNotes}
                      </p>
                    </div>
                  )}

                  {denuncia.materialsUsed && (
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Materiales / Insumos Utilizados:</span>
                      <p className="mt-1 text-sm bg-white dark:bg-surface-dark-card p-3 rounded-xl border border-gray-200 dark:border-gray-800 text-text-primary dark:text-text-dark-primary">
                        {denuncia.materialsUsed}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Historial */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Historial
                    {!historialLoading && (
                      <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-text-muted dark:bg-surface-dark-elevated">
                        {historial.length} eventos
                      </span>
                    )}
                  </span>
                </CardTitle>
              </CardHeader>
              {historialLoading ? (
                <p className="py-4 text-center text-sm text-text-muted">Cargando historial...</p>
              ) : (
                <div className="relative space-y-0">
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
                  {historial.length === 0 && (
                    <p className="py-2 text-sm text-text-muted">Sin eventos registrados.</p>
                  )}
                  {historial.map((evento) => {
                    const IconComp = TIMELINE_ICONS[evento.tipo] ?? CircleDot
                    const colorClass = TIMELINE_COLORS[evento.tipo] ?? TIMELINE_COLORS.nota

                    let parsedData = null
                    if (evento.descripcion && typeof evento.descripcion === 'string' && evento.descripcion.trim().startsWith('{')) {
                      try {
                        parsedData = JSON.parse(evento.descripcion)
                      } catch {
                        parsedData = null
                      }
                    }

                    return (
                      <div key={evento.id} className="relative flex gap-4 pb-6 last:pb-0">
                        <div className={cn('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', colorClass)}>
                          <IconComp className="h-4 w-4" />
                        </div>
                        <div className="flex-1 pt-0.5">
                          {parsedData ? (
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3.5 space-y-2 dark:border-emerald-500/30 dark:bg-emerald-950/20">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">
                                  Intervención Resuelta
                                </span>
                                {parsedData.resultado && (
                                  <Badge color="emerald" size="sm">
                                    {parsedData.resultado}
                                  </Badge>
                                )}
                              </div>

                              {parsedData.llegada && parsedData.finalizacion && (
                                <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                  ⏱️ Tiempo en sitio: {Math.max(1, dayjs(parsedData.finalizacion).diff(dayjs(parsedData.llegada), 'minute'))} min
                                </div>
                              )}

                              {parsedData.notas && (
                                <div className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                  <strong>Notas técnicas:</strong> {parsedData.notas}
                                </div>
                              )}

                              {parsedData.materiales && (
                                <div className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                  <strong>Materiales:</strong> {parsedData.materiales}
                                </div>
                              )}

                              {parsedData.coordenadasLlegada && (
                                <div className="pt-1">
                                  <button
                                    onClick={handleVerEnMapa}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
                                  >
                                    <MapPin className="h-3 w-3" /> Ver posición GPS de llegada
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary">
                              {evento.descripcion}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                            <span>{dayjs(evento.fecha).format('DD/MM/YYYY HH:mm')}</span>
                            <span>por {evento.usuario}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Columna derecha */}
          <div className="space-y-6">
            {/* Denunciante */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Denunciante
                  </span>
                </CardTitle>
              </CardHeader>
              <dl className="space-y-3">
                <InfoRow icon={User}   label="Nombre"    value={denuncia.ciudadano} />
                <InfoRow icon={Phone}  label="Teléfono"  value={denuncia.telefono} />
                <InfoRow icon={MapPin} label="Dirección" value={denuncia.direccion} />
              </dl>
            </Card>

            {/* Atención de campo */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    Atención de campo
                  </span>
                </CardTitle>
              </CardHeader>
              <dl className="space-y-3">
                <InfoRow icon={UserCheck} label="Operador"       value={denuncia.operador ?? 'Sin asignar'} muted={!denuncia.operador} />
                <InfoRow icon={UserCheck} label="Técnico responsable" value={denuncia.tecnicoResponsable ?? 'Aún no asumida'} muted={!denuncia.tecnicoResponsable} />
                <InfoRow icon={Calendar}  label="Fecha registro" value={dayjs(denuncia.fecha).format('DD/MM/YYYY HH:mm')} />
                <InfoRow icon={Tag}       label="Categoría"      value={denuncia.categoria} />
                {denuncia.area && (
                  <InfoRow icon={ArrowRightLeft} label="Área derivada" value={denuncia.area} />
                )}
              </dl>
              {denuncia.operatorSignature && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Firma digital</p>
                  <img
                    src={denuncia.operatorSignature}
                    alt={`Firma de ${denuncia.tecnicoResponsable ?? 'tecnico responsable'}`}
                    className="mt-2 h-20 w-full rounded-lg bg-white object-contain p-2"
                  />
                </div>
              )}
              <p className="mt-4 rounded-lg border border-primary/20 bg-primary-50 px-3 py-2 text-sm text-primary-700 dark:border-primary/30 dark:bg-primary-700/10 dark:text-primary">
                La denuncia queda visible para todos los técnicos de campo que pertenezcan al área derivada. Ellos deciden si toman o no la atención del caso.
              </p>
            </Card>

            {/* Acciones */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {/* Ver en mapa */}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                  onClick={handleVerEnMapa}
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  Ver en mapa
                </Button>

                {/* Cambiar estado */}
                {transiciones.map((estado) => {
                  const cfg = ESTADO_TRANSICION_CONFIG[estado]
                  return (
                    <Button
                      key={estado}
                      variant="outline"
                      className="w-full justify-start"
                      size="sm"
                      onClick={() => setModal('estado')}
                    >
                      <CircleDot className="h-4 w-4" />
                      {cfg.label}
                    </Button>
                  )
                })}

                {/* Editar - solo si pendiente */}
                {esPendiente && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => navigate(`/denuncias/${id}/editar`)}
                  >
                    <Pencil className="h-4 w-4 text-primary" />
                    Editar denuncia
                  </Button>
                )}

                {/* Derivar - si no es terminal */}
                {!esTerminal && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setModal('derivar')}
                  >
                    <ArrowRightLeft className="h-4 w-4 text-accent" />
                    Derivar a otra área
                  </Button>
                )}

                {/* Asignar Técnico de Campo */}
                {!esTerminal && (
                  <Button
                    variant="outline"
                    className="w-full justify-start border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 font-medium"
                    size="sm"
                    onClick={() => setModal('asignar_tecnico')}
                  >
                    <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Asignar Técnico de Campo
                  </Button>
                )}

                {/* Agregar nota */}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => setModal('nota')}
                >
                  <MessageSquare className="h-4 w-4 text-text-muted" />
                  Agregar observación
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modales */}
      <ModalAsignarTecnico
        open={modal === 'asignar_tecnico'}
        onClose={() => setModal(null)}
        onConfirm={handleAsignarTecnico}
      />
      <ModalCambiarEstado
        open={modal === 'estado'}
        onClose={() => setModal(null)}
        estadoActual={denuncia.estado}
        onConfirm={handleCambiarEstado}
      />
      <ModalObservacion
        open={modal === 'nota'}
        onClose={() => setModal(null)}
        onConfirm={handleObservacion}
      />
      <ModalDerivar
        open={modal === 'derivar'}
        onClose={() => setModal(null)}
        onConfirm={handleDerivar}
        areaActual={denuncia.area}
      />
      <ModalEvaluarReapertura
        open={modal === 'evaluar_reapertura'}
        onClose={() => setModal(null)}
        action={evaluarAction}
        onConfirm={handleEvaluateReopen}
      />
    </>
  )
}

function InfoRow({ icon: Icon, label, value, muted = false }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
      <div>
        <dt className="text-xs font-medium uppercase tracking-wider text-text-muted">{label}</dt>
        <dd className={cn('mt-0.5 text-sm', muted ? 'italic text-text-muted' : 'text-text-primary dark:text-text-dark-primary')}>
          {value}
        </dd>
      </div>
    </div>
  )
}
