import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import complaintService from '@/services/complaintService'
import api from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { DENUNCIA_STATUS, PRIORITY } from '@/utils/constants'

const DenunciasContext = createContext(null)

function mapHistorialEntry(h) {
  return {
    id:          h.id,
    tipo:        h.tipo,
    descripcion: h.description,
    fecha:       h.registerDate,
    usuario:     h.user
      ? [h.user.names, h.user.lastname].filter(Boolean).join(' ')
      : 'Sistema',
  }
}

export function DenunciasProvider({ children }) {
  const { isAuthenticated } = useAuth()

  const [denuncias, setDenuncias] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  const historialRef = useRef({})

  // ── Carga inicial ─────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    setError(null)
    try {
      setDenuncias(await complaintService.getAll())
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Error al cargar denuncias')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAll()
    } else {
      setDenuncias([])
      setError(null)
      historialRef.current = {}
    }
  }, [isAuthenticated, fetchAll])

  // ── Selectors ─────────────────────────────────────────────────────────────────
  const getById = useCallback(
    (code) => denuncias.find((d) => d.id === code || String(d._id) === String(code)) ?? null,
    [denuncias]
  )

  const getHistorial = useCallback((code) => historialRef.current[code] ?? [], [])

  const loadHistorial = useCallback(async (code) => {
    const denuncia = denuncias.find((d) => d.id === code || String(d._id) === String(code))
    const numericId = denuncia?._id
    if (!numericId) return []
    try {
      const { data } = await api.get(`/complaint-history/complaint/${numericId}`)
      const mapped = data.map(mapHistorialEntry)
      const key = denuncia?.id || code
      historialRef.current = { ...historialRef.current, [key]: mapped }
      return mapped
    } catch {
      return []
    }
  }, [denuncias])

  const getEvidencias = useCallback(
    (code) => {
      const d = denuncias.find((d) => d.id === code || String(d._id) === String(code))
      return (d?.images ?? []).map((img) => ({
        id:  img.id,
        url: img.url,
        alt: img.type === 'BEFORE' ? 'Foto antes de intervención' : 'Foto después de intervención',
      }))
    },
    [denuncias]
  )

  // Stats derivadas
  const stats = {
    total:      denuncias.length,
    pendientes: denuncias.filter((d) => d.estado === DENUNCIA_STATUS.PENDIENTE).length,
    enProceso:  denuncias.filter((d) => d.estado === DENUNCIA_STATUS.EN_PROCESO).length,
    resueltas:  denuncias.filter((d) => d.estado === DENUNCIA_STATUS.RESUELTA).length,
    rechazadas: denuncias.filter((d) => d.estado === DENUNCIA_STATUS.RECHAZADA).length,
    urgentes:   denuncias.filter((d) => d.prioridad === PRIORITY.URGENTE).length,
  }

  const updateLocal = useCallback((code, changes) => {
    setDenuncias((prev) =>
      prev.map((d) => (d.id === code || String(d._id) === String(code) ? { ...d, ...changes } : d))
    )
  }, [])

  // ── Actions ───────────────────────────────────────────────────────────────────

  const cambiarEstado = useCallback(async (code, nuevoEstado, nota) => {
    const denuncia = denuncias.find((d) => d.id === code || String(d._id) === String(code))
    const numericId = denuncia?._id || (!isNaN(Number(code)) ? Number(code) : null)
    const targetId = numericId || code
    const noteText = nota?.trim() || 'Cambio de estado realizado por operador'

    // updateStatus already handles frontend→backend status mapping internally
    await complaintService.updateStatus(targetId, nuevoEstado, noteText)

    const lookupKey = denuncia?.id || code
    updateLocal(lookupKey, { estado: nuevoEstado })
    await loadHistorial(lookupKey)
  }, [denuncias, updateLocal, loadHistorial])

  const agregarObservacion = useCallback(async (code, texto) => {
    const denuncia = denuncias.find((d) => d.id === code || String(d._id) === String(code))
    const numericId = denuncia?._id
    if (!numericId) return
    await complaintService.addNote(numericId, texto)
    await loadHistorial(denuncia?.id || code)
  }, [denuncias, loadHistorial])

  const derivar = useCallback(async (code, areaDestino, nota) => {
    const denuncia = denuncias.find((d) => d.id === code || String(d._id) === String(code))
    const numericId = denuncia?._id
    if (!numericId) return
    const updated = await complaintService.derive(numericId, areaDestino, nota)
    const lookupKey = denuncia?.id || code
    updateLocal(lookupKey, { area: updated.area, estado: updated.estado })
    await loadHistorial(lookupKey)
  }, [denuncias, updateLocal, loadHistorial])

  const editarDenuncia = useCallback(async (code, formData) => {
    const denuncia = denuncias.find((d) => d.id === code || String(d._id) === String(code))
    const numericId = denuncia?._id
    if (!numericId) return null
    const updated = await complaintService.update(numericId, formData)
    const lookupKey = denuncia?.id || code
    setDenuncias((prev) =>
      prev.map((d) => (d.id === lookupKey || String(d._id) === String(numericId) ? { ...d, ...updated } : d))
    )
    historialRef.current = { ...historialRef.current, [lookupKey]: undefined }
    return updated
  }, [denuncias])

  const evaluateReopen = useCallback(async (code, action, note) => {
    const denuncia = denuncias.find((d) => d.id === code || String(d._id) === String(code))
    const numericId = denuncia?._id || (!isNaN(Number(code)) ? Number(code) : null)
    if (!numericId) return null
    const updated = await complaintService.evaluateReopen(numericId, action, note)
    const lookupKey = denuncia?.id || code
    updateLocal(lookupKey, {
      reopenStatus: updated.reopenStatus,
      reopenResolution: updated.reopenResolution,
      estado: updated.estado,
    })
    await loadHistorial(lookupKey)
    await fetchAll()
    return updated
  }, [denuncias, updateLocal, loadHistorial, fetchAll])

  const crearDenuncia = useCallback(async (formData) => {
    const created = await complaintService.create(formData)
    setDenuncias((prev) => [created, ...prev])
    return created
  }, [])

  return (
    <DenunciasContext.Provider
      value={{
        denuncias,
        loading,
        error,
        stats,
        refetch: fetchAll,
        getById,
        getHistorial,
        loadHistorial,
        getEvidencias,
        cambiarEstado,
        agregarObservacion,
        derivar,
        evaluateReopen,
        editarDenuncia,
        crearDenuncia,
      }}
    >
      {children}
    </DenunciasContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDenuncias() {
  const ctx = useContext(DenunciasContext)
  if (!ctx) throw new Error('useDenuncias must be used within DenunciasProvider')
  return ctx
}
