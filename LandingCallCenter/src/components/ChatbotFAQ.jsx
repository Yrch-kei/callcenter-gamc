import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  RotateCcw,
  Sparkles,
  User,
  ChevronRight,
  HelpCircle,
  Shield,
  CheckCircle2,
} from 'lucide-react';

const SYSTEM_PROMPT = `Eres el Asistente Virtual Ciudadano de la Alcaldía de Cochabamba (GAMC). Orienta al vecino de forma empática, formal y en un máximo de 3 oraciones sobre trámites, reportes vecinales y seguimiento de solicitudes. No desvíes a temas no municipales.`;

const PREDEFINED_FAQS = [
  {
    id: 'faq-1',
    question: '¿Cómo registrar un nuevo reporte?',
    answer:
      'Presiona el botón "Registrar Denuncia", ubica el lugar exacto en el mapa interactivo, adjunta una fotografía como evidencia y describe brevemente el problema. El sistema clasificará tu solicitud automáticamente.',
  },
  {
    id: 'faq-2',
    question: '¿Qué tipo de incidentes puedo reportar?',
    answer:
      'Puedes reportar cualquier afectación en la vía pública o infraestructura urbana: daños en calzadas, fallas de iluminación, problemas de agua o drenaje, acumulación de residuos, mantenimiento de áreas verdes y ocupación indebida del espacio público.',
  },
  {
    id: 'faq-3',
    question: '¿Cómo hago seguimiento a mi caso?',
    answer:
      'Dirígete a la pestaña "Consultar Estado" e introduce el código de ticket asignado (ej. GAMC-2026-00001). Podrás ver la etapa actual, la unidad municipal a cargo y las notas técnicas de atención.',
  },
  {
    id: 'faq-4',
    question: '¿El servicio o atención tiene algún costo?',
    answer:
      'No. Todo el registro, inspección técnica y trabajos de mantenimiento ejecutados por el Gobierno Autónomo Municipal de Cochabamba son 100% gratuitos.',
  },
  {
    id: 'faq-5',
    question: '¿Cuánto tiempo tarda la atención técnica?',
    answer:
      'Los incidentes con riesgo para la seguridad o servicios básicos se atienden con prioridad alta dentro de las 24 horas. Los mantenimientos regulares se programan en un plazo estimado de 48 a 72 horas hábiles.',
  },
];

function getFormattedTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatbotFAQ() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: '¡Hola! 👋 Soy el Asistente Virtual del Gobierno Autónomo Municipal de Cochabamba. ¿En qué puedo orientarte hoy?',
      time: getFormattedTime(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
    }
  }, [messages, isOpen, isTyping]);

  // Manejador para preguntas predefinidas
  const handleSelectFAQ = (faq) => {
    const time = getFormattedTime();
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: faq.question,
      time,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: faq.answer,
        time: getFormattedTime(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  // Función para consultar a Ollama con fallbacks
  const queryOllama = async (promptText) => {
    const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434/api/generate';
    const modelsToTry = ['gamc-clasificador', 'llama3', 'tinyllama', 'mistral'];

    for (const modelName of modelsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 seg timeout

        const response = await fetch(OLLAMA_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model: modelName,
            prompt: promptText,
            system: SYSTEM_PROMPT,
            stream: false,
          }),
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const responseText = (data?.response || '').trim();
          if (responseText) {
            return responseText;
          }
        }
      } catch (err) {
        // Intenta el siguiente modelo o salta al fallback
      }
    }

    // Fallback si Ollama no está respondiendo en desarrollo local
    return 'Gracias por escribirnos. Puedes registrar reportes o realizar seguimiento en esta misma página. Si requieres atención de emergencia municipal, la línea gratuita 151 del GAMC está disponible las 24 horas.';
  };

  // Enviar mensaje abierto
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userTime = getFormattedTime();
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Verificar si coincide directamente con una FAQ rápida
    const matchedFaq = PREDEFINED_FAQS.find(
      (f) => f.question.toLowerCase() === text.toLowerCase()
    );

    if (matchedFaq) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: matchedFaq.answer,
            time: getFormattedTime(),
          },
        ]);
        setIsTyping(false);
      }, 500);
      return;
    }

    // Consultar a la IA
    try {
      const aiResponse = await queryOllama(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: aiResponse,
          time: getFormattedTime(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'En este momento nuestro canal automatizado está experimentando alta demanda. Por favor intenta seleccionar una de las preguntas frecuentes o llama al 151.',
          time: getFormattedTime(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: 'Conversación reiniciada. ¿En qué más puedo ayudarte?',
        time: getFormattedTime(),
      },
    ]);
  };

  return (
    <>
      {/* ── BOTÓN FLOTANTE CIRCULAR EN ESQUINA INFERIOR DERECHA ── */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Asistente Virtual GAMC"
          className="relative group flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white rounded-full shadow-2xl shadow-sky-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-sky-500/30"
        >
          {/* Anillo de pulso exterior */}
          <span className="absolute -inset-1 rounded-full bg-sky-500/30 animate-ping opacity-75 group-hover:opacity-100 pointer-events-none" />

          {/* Icono de Mensajería / Bot */}
          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-200 rotate-90" />
          ) : (
            <MessageSquare className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
          )}

          {/* Insignia de estado En Línea */}
          <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-zinc-900 rounded-full" />

          {/* Notificación no leída (Tooltip si cerrado) */}
          {hasUnread && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
            </span>
          )}
        </button>
      </div>

      {/* ── VENTANA DE CHAT COMPACTA ── */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[390px] h-[530px] max-h-[calc(100vh-7rem)] bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          
          {/* Cabecera Oficial */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Bot className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-zinc-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Asistente Virtual GAMC
                  </h3>
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span>En línea • Alcaldía de Cochabamba</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reiniciar chat"
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Cerrar"
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Icono de remitente */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white'
                      : 'bg-zinc-800 border border-zinc-700 text-sky-400'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Burbuja de texto */}
                <div>
                  <div
                    className={`p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-sky-600 text-white rounded-2xl rounded-tr-xs shadow-md'
                        : 'bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 rounded-2xl rounded-tl-xs shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span
                    className={`block text-[10px] mt-1 text-zinc-500 ${
                      msg.sender === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {/* Indicador animado de "Escribiendo..." */}
            {isTyping && (
              <div className="flex gap-2.5 mr-auto max-w-[85%]">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-sky-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-zinc-800/80 border border-zinc-700/60 rounded-2xl rounded-tl-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            {/* Banco de Preguntas Frecuentes Rápidas */}
            <div className="pt-2 border-t border-zinc-800/60 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-1">
                <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>Preguntas Frecuentes Rápidas</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {PREDEFINED_FAQS.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => handleSelectFAQ(faq)}
                    className="text-left text-xs text-zinc-300 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-sky-500/40 p-2.5 rounded-xl transition-all flex items-center justify-between group"
                  >
                    <span className="line-clamp-1">{faq.question}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-sky-400 transition-colors shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Formulario e Input Inferior */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-zinc-950/80 border-t border-zinc-800/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe tu consulta vecinal..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="p-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white rounded-xl transition-all shadow-md shadow-sky-600/20 shrink-0"
              title="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
