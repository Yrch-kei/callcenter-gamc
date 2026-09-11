import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin as MapPinIcon,
  Camera as CameraIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  AlertCircle as AlertCircleIcon,
  X as XIcon,
  Upload as UploadIcon,
  RefreshCw as RefreshCwIcon,
  Navigation as NavigationIcon,
  FileText as FileTextIcon,
  ShieldAlert as ShieldAlertIcon,
  ChevronRight as ChevronRightIcon,
  Check as CheckIcon,
  Package as PackageIcon
} from 'lucide-react';
import complaintService from '../services/complaintService';
import { useAuth } from '../context/AuthContext';

const MapPin = MapPinIcon as any;
const Camera = CameraIcon as any;
const CheckCircle = CheckCircleIcon as any;
const Clock = ClockIcon as any;
const AlertCircle = AlertCircleIcon as any;
const X = XIcon as any;
const Upload = UploadIcon as any;
const RefreshCw = RefreshCwIcon as any;
const Navigation = NavigationIcon as any;
const FileText = FileTextIcon as any;
const ShieldAlert = ShieldAlertIcon as any;
const ChevronRight = ChevronRightIcon as any;
const Check = CheckIcon as any;
const Package = PackageIcon as any;

interface ComplaintItem {
  _id: number;
  id: string; // código GAMC-2026-XXXXX
  titulo: string;
  descripcion: string;
  categoria: string;
  area: string;
  direccion: string;
  estado: string; // 'pendiente' | 'en_proceso' | 'resuelta' | 'rechazada'
  prioridad: string;
  fecha: string;
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  ubicacion?: {
    type?: string;
    coordinates?: [number, number];
  } | null;
  arrivalTime?: string | null;
  technicalNotes?: string | null;
  materialsUsed?: string | null;
  resolutionResult?: string | null;
}

const getCoordinates = (c: ComplaintItem) => {
  if (c.latitude && c.longitude) return { lat: Number(c.latitude), lng: Number(c.longitude) };
  if (c.lat && c.lng) return { lat: Number(c.lat), lng: Number(c.lng) };
  if (c.ubicacion?.coordinates && Array.isArray(c.ubicacion.coordinates)) {
    return { lat: Number(c.ubicacion.coordinates[1]), lng: Number(c.ubicacion.coordinates[0]) };
  }
  return null;
};

export default function TechnicianFieldView() {
  const auth = useAuth() as any;
  const user = auth?.user;
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de acciones
  const [arrivingId, setArrivingId] = useState<number | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Formulario modal de resolución (Múltiples fotos de evidencia)
  const [technicalNotes, setTechnicalNotes] = useState<string>('');
  const [materialsUsed, setMaterialsUsed] = useState<string>('');
  const [resolutionResult, setResolutionResult] = useState<'Resuelto' | 'Parcial' | 'No Resuelto'>('Resuelto');
  const [evidenceImages, setEvidenceImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevCountRef = useRef<number>(0);

  // Mantener previsualizaciones de imágenes vivas sin memory leaks
  useEffect(() => {
    const objectUrls = evidenceImages.map((file) => URL.createObjectURL(file));
    setPreviews(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [evidenceImages]);

  const fetchAssigned = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: ComplaintItem[];
      try {
        data = await complaintService.getAssigned();
      } catch {
        data = await complaintService.getAll();
      }
      
      if ('Notification' in window && Notification.permission === 'granted') {
        if (prevCountRef.current > 0 && data.length > prevCountRef.current) {
          const newest = data[0];
          new Notification('Nueva Asignación de Campo', {
            body: `Se te ha asignado el caso ${newest.id || newest._id}: ${newest.titulo}`,
            icon: '/icon-192.png'
          });
        }
      }
      prevCountRef.current = data.length;
      setComplaints(data);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar las denuncias asignadas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    fetchAssigned();

    const interval = setInterval(() => {
      fetchAssigned();
    }, 15000);

    const handleFocus = () => fetchAssigned();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Paso 1: "Llegué al Sitio"
  const handleArrive = (complaint: ComplaintItem) => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada por su navegador.');
      sendArriveCoords(complaint._id, -17.3895, -66.1568); // fallback a Cochabamba centro
      return;
    }

    setArrivingId(complaint._id);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendArriveCoords(complaint._id, pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn('Error al obtener coordenadas:', err.message);
        // Fallback a enviar la llegada con coords por defecto
        sendArriveCoords(complaint._id, -17.3895, -66.1568);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const sendArriveCoords = async (id: number, lat: number, lng: number) => {
    try {
      await complaintService.arriveAtSite(id, { latitude: lat, longitude: lng });
      setComplaints((prev) =>
        prev.map((c) => (c._id === id ? { ...c, estado: 'en_proceso', arrivalTime: new Date().toISOString() } : c))
      );
      setSubmitSuccess(`Llegada registrada para el ticket #${id}`);
      setTimeout(() => setSubmitSuccess(null), 3000);
    } catch (err: any) {
      alert('Error al registrar llegada: ' + (err?.response?.data?.error || err.message));
    } finally {
      setArrivingId(null);
    }
  };

  // Abrir Modal de Resolución
  const openResolveModal = (complaint: ComplaintItem) => {
    setSelectedComplaint(complaint);
    setTechnicalNotes('');
    setMaterialsUsed('');
    setResolutionResult('Resuelto');
    setEvidenceImages([]);
    setIsModalOpen(true);
  };

  // Manejo de múltiples fotos tomadas (Máximo 5)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setEvidenceImages((prev) => [...prev, ...newFiles].slice(0, 5));
    }
    if (e.target) e.target.value = '';
  };

  const removeImage = (index: number) => {
    setEvidenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Paso 2: Finalizar y Subir Evidencias
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('technicalNotes', technicalNotes);
      formData.append('materialsUsed', materialsUsed);
      formData.append('resolutionResult', resolutionResult);
      formData.append('finishTime', new Date().toISOString());

      // Adjuntar cada archivo de imagen
      evidenceImages.forEach((file) => {
        formData.append('afterImages', file);
      });
      // Retrocompatibilidad con backend de archivo único
      if (evidenceImages.length > 0) {
        formData.append('afterImage', evidenceImages[0]);
        formData.append('file', evidenceImages[0]);
      }

      await complaintService.resolve(selectedComplaint._id, formData);

      setComplaints((prev) =>
        prev.map((c) =>
          c._id === selectedComplaint._id
            ? {
                ...c,
                estado: 'resuelta',
                technicalNotes,
                materialsUsed,
                resolutionResult
              }
            : c
        )
      );

      setIsModalOpen(false);
      setSubmitSuccess(`Denuncia ${selectedComplaint.id} resuelta exitosamente con ${evidenceImages.length} evidencia(s).`);
      setTimeout(() => setSubmitSuccess(null), 4000);
    } catch (err: any) {
      alert('Error al resolver la denuncia: ' + (err?.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 dark:bg-slate-900">
      {/* Header móvil superior */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 dark:text-white">Módulo Técnico de Campo</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.name || 'Técnico Móvil'} {user?.area ? `· ${user.area}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={fetchAssigned}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            title="Recargar denuncias"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerta de notificación flotante */}
      {submitSuccess && (
        <div className="mx-auto my-3 max-w-lg px-4">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-600/20">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <main className="mx-auto max-w-lg px-4 pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <RefreshCw className="mb-3 h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Cargando denuncias asignadas...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center dark:border-rose-950 dark:bg-rose-900/20">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-rose-600 dark:text-rose-400" />
            <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">{error}</p>
            <button
              onClick={fetchAssigned}
              className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700"
            >
              Reintentar
            </button>
          </div>
        ) : complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
            <Package className="mb-3 h-10 w-10 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sin denuncias pendientes</h3>
            <p className="mt-1 text-xs text-slate-500">No tienes asignaciones pendientes en este momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>Denuncias Asignadas</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                {complaints.length} ticket{complaints.length > 1 ? 's' : ''}
              </span>
            </div>

            {complaints.map((item) => {
              const isResuelta = item.estado === 'resuelta' || item.estado === 'Resuelta';
              const hasArrived = Boolean(
                item.arrivalTime &&
                item.arrivalTime !== 'null' &&
                item.arrivalTime !== null &&
                !isNaN(new Date(item.arrivalTime).getTime())
              );
              const isArriving = arrivingId === item._id;
              const coords = getCoordinates(item);

              return (
                <div
                  key={item._id}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all dark:bg-slate-800 ${
                    isResuelta
                      ? 'border-emerald-200 opacity-80 dark:border-emerald-900/50'
                      : hasArrived
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-500/80'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Encabezado de Tarjeta */}
                  <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-700/50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {item.id || `#${item._id}`}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          isResuelta
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : hasArrived
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isResuelta ? 'Resuelta' : hasArrived ? 'En Sitio / Proceso' : 'Pendiente de Llegada'}
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo y Datos de la Tarjeta */}
                  <div className="p-4">
                    <h2 className="text-base font-semibold leading-snug text-slate-800 dark:text-slate-100">
                      {item.titulo}
                    </h2>
                    <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{item.direccion || 'Dirección no especificada'}</span>
                    </p>
                    <div className="mt-2.5 mb-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {item.categoria}
                      </span>
                      {item.area && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {item.area}
                        </span>
                      )}
                    </div>

                    {/* Botón de Ruta / Navegación GPS (Siempre visible si hay coordenadas) */}
                    {coords && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-1 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 active:scale-[0.98] transition-all dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                      >
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        Cómo llegar (Abrir en Maps)
                      </a>
                    )}
                  </div>

                  {/* Acciones Operativas de la Tarjeta (Secuencia Estricta Paso 1 y Paso 2) */}
                  <div className="border-t border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700/50 dark:bg-slate-800/80">
                    {isResuelta ? (
                      <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-4 w-4" />
                        <span>Caso Finalizado</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {/* Paso 1: "Llegué al Sitio" */}
                        {!hasArrived ? (
                          <button
                            onClick={() => handleArrive(item)}
                            disabled={isArriving}
                            className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-3 py-2.5 text-xs font-bold text-white active:scale-95 shadow-sm shadow-orange-500/20 transition-all disabled:opacity-50"
                          >
                            <Navigation className={`h-3.5 w-3.5 ${isArriving ? 'animate-bounce' : ''}`} />
                            <span>{isArriving ? 'Marcando...' : '1. Llegué al Sitio'}</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2.5 text-xs font-bold dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 cursor-default"
                          >
                            <CheckIcon className="h-4 w-4 text-emerald-600" />
                            <span>✓ En Sitio</span>
                          </button>
                        )}

                        {/* Paso 2: "Finalizar" */}
                        {!hasArrived ? (
                          <button
                            disabled
                            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500 px-3 py-2.5 text-xs font-bold cursor-not-allowed opacity-70"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span>2. Finalizar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => openResolveModal(item)}
                            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white active:scale-95 shadow-sm shadow-emerald-600/20 transition-all"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span>2. Finalizar</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL / DRAWER DE RESOLUCIÓN CON FOTOS MÚLTIPLES */}
      {isModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl transition-all sm:rounded-2xl dark:bg-slate-800">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Cierre de Reporte #{selectedComplaint.id || selectedComplaint._id}
                </h3>
                <p className="text-xs text-slate-500">{selectedComplaint.titulo}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Formulario de Cierre */}
            <form onSubmit={handleResolveSubmit} className="mt-4 space-y-4">
              {/* Sección Cámara & Múltiples Evidencias */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Fotografías Evidencia 'AFTER' (Hasta 5 fotos)
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {evidenceImages.length}/5 fotos
                  </span>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  id="camera-input"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Cuadrícula de Previsualización de Miniaturas */}
                {previews.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {previews.map((src, index) => (
                      <div key={index} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-700">
                        <img
                          src={src}
                          alt={`Evidencia ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600/90 text-white shadow-xs hover:bg-rose-700"
                          title="Eliminar foto"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <span className="absolute bottom-1 left-1 rounded-md bg-slate-900/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          #{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botón para Capturar / Agregar Foto */}
                {evidenceImages.length < 5 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 flex min-h-[90px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-3 text-center transition-colors hover:bg-emerald-50 dark:border-emerald-700/50 dark:bg-emerald-950/20"
                  >
                    <div className="flex flex-col items-center gap-1 text-emerald-700 dark:text-emerald-400">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                        <Camera className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold">
                        {evidenceImages.length === 0 ? 'Tomar Foto de Evidencia' : 'Agregar Otra Foto'}
                      </span>
                      <span className="text-[10px] text-slate-500">Toca para abrir cámara o galería</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas Técnicas / Trabajo Realizado */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Trabajo Realizado / Notas Técnicas *
                </label>
                <textarea
                  rows={2}
                  required
                  value={technicalNotes}
                  onChange={(e) => setTechnicalNotes(e.target.value)}
                  placeholder="Ej. Se reparó el bache utilizando mezcla asfáltica en caliente y compactación..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              {/* Materiales Utilizados */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Materiales Utilizados *
                </label>
                <input
                  type="text"
                  required
                  value={materialsUsed}
                  onChange={(e) => setMaterialsUsed(e.target.value)}
                  placeholder="Ej. 2 sacos de asfalto, 1 galón de imprimante..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              {/* Resultado Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Resultado de la Atención *
                </label>
                <select
                  value={resolutionResult}
                  onChange={(e: any) => setResolutionResult(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="Resuelto">Resuelto (100% Solucionado)</option>
                  <option value="Parcial">Parcial (Requiere Segunda Fase)</option>
                  <option value="No Resuelto">No Resuelto (Imprevisto Técnico)</option>
                </select>
              </div>

              {/* Botón Guardar */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Guardando evidencia...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Enviar Resolución y Finalizar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

