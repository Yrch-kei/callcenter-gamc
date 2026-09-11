import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Camera, X, CheckCircle, AlertTriangle,
  Wrench, ClipboardList, PenLine,
} from 'lucide-react'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import { useDenuncias } from '@/context/DenunciasContext'
import { DENUNCIA_STATUS } from '@/utils/constants'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui'
import complaintService from '@/services/complaintService'

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const RESULTADO_OPTIONS = [
  {
    value:    'Resuelto',
    label:    'Resuelto',
    desc:     'El problema fue atendido y solucionado completamente.',
    icon:     CheckCircle,
    color:    'border-success bg-success-light text-success',
    selected: 'border-success bg-success text-white',
  },
  {
    value:    'Parcial',
    label:    'Parcialmente Resuelto',
    desc:     'Se realizó intervención pero el problema persiste parcialmente.',
    icon:     ClipboardList,
    color:    'border-primary/30 bg-primary-50 text-primary-700 dark:bg-primary-700/10 dark:text-primary',
    selected: 'border-primary bg-primary text-white',
  },
  {
    value:    'No Resuelto',
    label:    'No Resuelto',
    desc:     'No fue posible resolver el problema. Justificación obligatoria.',
    icon:     AlertTriangle,
    color:    'border-warning/40 bg-warning-light text-warning',
    selected: 'border-warning bg-warning text-white',
  },
]

/* const MATERIALES_PRESET = [
  'Cemento',
  'Arena',
  'Asfalto en frío',
  'Grava',
  'Tubería PVC',
  'Cable eléctrico',
  'Luminaria LED',
  'Conos de señalización',
  'Pintura de tráfico',
  'Herramientas manuales',
  'Maquinaria pesada',
] */

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function CampoIntervencion() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { getById, refetch } = useDenuncias()

  const denuncia = getById(id)

  // â”€â”€ Form state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [resultado,    setResultado]    = useState('')
  const [observacion,  setObservacion]  = useState('')
  const [fotosAntes,   setFotosAntes]   = useState([])   // [{ url, name, file }]
  const [fotosDespues, setFotosDespues] = useState([])   // [{ url, name, file }]
  const [firma,        setFirma]        = useState(null)
  const [submitting,   setSubmitting]   = useState(false)
  const [submitted,    setSubmitted]    = useState(false)

  const pageRef    = useRef(null)
  const successRef = useRef(null)

  // Page entry animation
  useEffect(() => {
    if (!pageRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(
      pageRef.current,
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }
    )
  }, [])

  // Success animation
  useEffect(() => {
    if (!submitted || !successRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const tl = gsap.timeline()
    tl.fromTo(
      successRef.current.querySelector('[data-checkmark]'),
      { scale: 0, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.7)' }
    ).fromTo(
      successRef.current.querySelectorAll('[data-text]'),
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.08, ease: 'power2.out' },
      '-=0.1'
    )
  }, [submitted])

  if (!denuncia) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center py-20 text-center">
        <AlertTriangle className="mb-3 h-12 w-12 text-warning" />
        <p className="font-semibold text-text-primary dark:text-text-dark-primary">Denuncia no encontrada</p>
        <button onClick={() => navigate('/campo')} className="mt-4 cursor-pointer text-sm text-primary hover:underline">
          Volver
        </button>
      </div>
    )
  }

  // â”€â”€ Success screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (submitted) {
    return (
      <div
        ref={successRef}
        className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-16 text-center"
      >
        <div
          data-checkmark
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-success-light"
        >
          <CheckCircle className="h-12 w-12 text-success" />
        </div>
        <h2 data-text className="text-2xl font-bold text-text-primary dark:text-text-dark-primary">
          ¡Intervención registrada!
        </h2>
        <p data-text className="mt-2 font-mono text-sm font-semibold text-primary">
          {denuncia.id}
        </p>
        <p data-text className="mt-3 text-sm text-text-secondary dark:text-text-dark-secondary">
          {denuncia.titulo}
        </p>
        <p data-text className="mt-1.5 text-sm text-text-muted">
          El estado de la denuncia ha sido actualizado correctamente.
        </p>
        <Button
          data-text
          className="mt-8"
          size="lg"
          onClick={() => navigate('/campo')}
        >
          Volver a mis denuncias
        </Button>
        <button
          data-text
          onClick={() => navigate(`/campo/${id}`)}
          className="mt-3 cursor-pointer text-sm text-text-muted hover:text-primary hover:underline"
        >
          Ver detalle de la denuncia
        </button>
      </div>
    )
  }

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSubmit = async () => {
    if (!resultado) {
      toast.error('Selecciona el resultado de la intervención')
      return
    }
    if (!observacion.trim() || observacion.trim().length < 5) {
      toast.error('Agrega observaciones técnicas (mínimo 5 caracteres)')
      return
    }
    if (resultado === 'No Resuelto' && observacion.trim().length < 20) {
      toast.error('Para "No Resuelto" la justificación debe ser más detallada (mínimo 20 caracteres)')
      return
    }
    if (!firma) {
      toast.error('Agrega la firma digital para validar la intervención')
      return
    }

    setSubmitting(true)

    const numericId = denuncia._id
    const obs = observacion.trim()

    try {
      // 1. Iniciar intervención (fotos ANTES, marca En proceso)
      const startFd = new FormData()
      if (denuncia.lat) startFd.append('latitude',  String(denuncia.lat))
      if (denuncia.lng) startFd.append('longitude', String(denuncia.lng))
      fotosAntes.forEach((p) => { if (p.file) startFd.append('photos', p.file) })
      await complaintService.startIntervention(numericId, startFd)

      // 2. Finalizar intervención (fotos DESPUÉS, resultado)
      const finishFd = new FormData()
      finishFd.append('technicalNotes',   obs)
      finishFd.append('materialsUsed',    '')
      finishFd.append('resolutionResult', resultado)
      finishFd.append('operatorSignature', firma)
      fotosDespues.forEach((p) => { if (p.file) finishFd.append('photos', p.file) })
      await complaintService.finishIntervention(numericId, finishFd)

      await refetch()
      setSubmitting(false)
      setSubmitted(true)
    } catch (err) {
      setSubmitting(false)
      const msg = err?.response?.data?.error ?? 'Error al registrar la intervención'
      toast.error(msg)
    }
  }

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div ref={pageRef} className="mx-auto max-w-2xl pb-32">

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="mb-5 flex items-start gap-3">
        <button
          onClick={() => navigate(`/campo/${id}`)}
          className="mt-0.5 cursor-pointer rounded-xl p-2.5 text-text-secondary transition-colors hover:bg-gray-100 hover:text-text-primary dark:hover:bg-surface-dark-elevated"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="font-mono text-xs font-medium text-text-muted">{denuncia.id}</p>
          <h1 className="mt-0.5 text-xl font-bold text-text-primary dark:text-text-dark-primary">
            Registrar Intervención
          </h1>
          <p className="mt-0.5 text-sm text-text-secondary dark:text-text-dark-secondary line-clamp-1">
            {denuncia.titulo}
          </p>
        </div>
      </div>

      {/* Aviso si la denuncia ya está en proceso */}
      {denuncia.estado === DENUNCIA_STATUS.EN_PROCESO && (
        <div className="mb-4 rounded-2xl border border-primary/30 bg-primary-50 px-4 py-3 text-sm text-primary-700 dark:bg-primary-700/10 dark:text-primary">
          Esta denuncia ya está en proceso. Puedes completar la intervención enviando el informe final.
        </div>
      )}

      <div className="space-y-3">

        {/* â”€â”€ 1. Resultado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <FormSection icon={Wrench} title="Resultado de la intervención" required>
          <div className="space-y-2.5">
            {RESULTADO_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const isSelected = resultado === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setResultado(opt.value)}
                  className={cn(
                    'w-full cursor-pointer rounded-2xl border-2 p-4 text-left transition-all duration-150 active:scale-[0.98]',
                    isSelected ? opt.selected : opt.color
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      isSelected ? 'bg-white/20' : 'bg-white/60 dark:bg-black/10'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{opt.label}</p>
                      <p className={cn('mt-0.5 text-xs leading-snug', isSelected ? 'opacity-80' : 'opacity-70')}>
                        {opt.desc}
                      </p>
                    </div>
                    <div className={cn(
                      'ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                      isSelected ? 'border-white bg-white/30' : 'border-current opacity-40'
                    )}>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </FormSection>

        {/* â”€â”€ 2. Fotos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <FormSection icon={Camera} title="Fotografías">
          <div className="space-y-4">
            <PhotoSlot
              label="Antes de la intervención"
              photos={fotosAntes}
              onAdd={(f) => setFotosAntes((p) => [...p, f])}
              onRemove={(i) => setFotosAntes((p) => p.filter((_, idx) => idx !== i))}
            />
            <PhotoSlot
              label="Después de la intervención"
              photos={fotosDespues}
              onAdd={(f) => setFotosDespues((p) => [...p, f])}
              onRemove={(i) => setFotosDespues((p) => p.filter((_, idx) => idx !== i))}
            />
          </div>
        </FormSection>

        {/* â”€â”€ 3. Observaciones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <FormSection icon={ClipboardList} title={resultado === 'No Resuelto' ? 'Justificación (obligatoria)' : 'Observaciones técnicas'} required>
          {resultado === 'No Resuelto' && (
            <p className="mb-3 rounded-xl border border-warning/40 bg-warning-light px-3 py-2 text-xs text-warning">
              Explica con detalle por qué no fue posible resolver el problema.
            </p>
          )}
          <textarea
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            rows={4}
            placeholder={resultado === 'No Resuelto'
              ? 'Explica por qué no fue posible resolver el problema...'
              : 'Describe detalladamente lo que encontraste y las acciones realizadas...'}

            className="block w-full resize-none rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-surface-dark-card dark:text-text-dark-primary"
          />
          <p className="mt-1.5 text-right text-xs text-text-muted">{observacion.length} caracteres</p>
        </FormSection>

        {/* â”€â”€ 4. Materiales â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}

        {/* â”€â”€ 5. Firma â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <FormSection icon={PenLine} title="Firma del operario">
          <p className="mb-2 text-xs text-text-muted">
            Dibuja tu firma en el recuadro para validar la intervención.
          </p>
          <SignaturePad value={firma} onChange={setFirma} />
        </FormSection>

      </div>

      {/* â”€â”€ Sticky submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 p-4 backdrop-blur-sm dark:border-gray-700 dark:bg-surface-dark-card/95">
        <div className="mx-auto max-w-2xl space-y-2">
          <Button
            size="lg"
            className="w-full"
            loading={submitting}
            onClick={handleSubmit}
          >
            <Wrench className="h-5 w-5" />
            Enviar intervención
          </Button>
          <p className="text-center text-xs text-text-muted">
            Al enviar, el estado de la denuncia será actualizado.
          </p>
        </div>
      </div>

    </div>
  )
}

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FormSection({ icon: Icon, title, required, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-surface-card p-4 dark:border-gray-800 dark:bg-surface-dark-card">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary dark:text-text-dark-primary">
        <Icon className="h-4 w-4 text-primary" />
        {title}
        {required && <span className="text-accent">*</span>}
      </h2>
      {children}
    </div>
  )
}

function PhotoSlot({ label, photos, onAdd, onRemove }) {
  const inputRef = useRef(null)

  const handleFiles = (e) => {
    const files = Array.from(e.target.files ?? [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => onAdd({ url: ev.target.result, name: file.name, file })
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-text-secondary dark:text-text-dark-secondary">{label}</p>
      <div className="flex flex-wrap gap-2">
        {photos.map((p, i) => (
          <div key={i} className="group relative h-20 w-20 shrink-0">
            <img
              src={p.url}
              alt={p.name}
              className="h-full w-full rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute -right-1 -top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-danger text-white shadow"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {photos.length < 5 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 text-text-muted transition-colors hover:border-primary hover:text-primary dark:border-gray-600"
          >
            <Camera className="h-6 w-6" />
            <span className="text-[10px]">Foto</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  )
}

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)

  const getPos = (canvas, e) => {
    const rect = canvas.getBoundingClientRect()
    const client = e.touches ? e.touches[0] : e
    return {
      x: (client.clientX - rect.left) * (canvas.width  / rect.width),
      y: (client.clientY - rect.top)  * (canvas.height / rect.height),
    }
  }

  const initCtx = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#111827'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    return ctx
  }, [])

  useEffect(() => { initCtx() }, [initCtx])

  const onStart = (e) => {
    e.preventDefault()
    const ctx = initCtx()
    if (!ctx) return
    const pos = getPos(canvasRef.current, e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    isDrawing.current = true
  }

  const onMove = (e) => {
    if (!isDrawing.current) return
    e.preventDefault()
    const ctx = initCtx()
    if (!ctx) return
    const pos = getPos(canvasRef.current, e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    onChange(canvasRef.current.toDataURL())
  }

  const onEnd = () => { isDrawing.current = false }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    onChange(null)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={140}
        className={cn(
          'w-full touch-none cursor-crosshair rounded-xl border-2 bg-white',
          value ? 'border-primary/40' : 'border-gray-300'
        )}
        onMouseDown={onStart}
        onMouseMove={onMove}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
      />
      {!value && (
        <p className="mt-1.5 text-center text-xs text-text-muted">Traza tu firma con el dedo o el cursor</p>
      )}
      {value && (
        <button
          type="button"
          onClick={clearCanvas}
          className="mt-2 cursor-pointer text-xs text-danger hover:underline"
        >
          Borrar firma
        </button>
      )}
    </div>
  )
}


