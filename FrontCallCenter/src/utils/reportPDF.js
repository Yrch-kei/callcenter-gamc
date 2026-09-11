import dayjs from 'dayjs'

const STATUS_LABELS = {
  pendiente:  'Pendiente',
  en_proceso: 'En proceso',
  resuelta:   'Resuelta',
  rechazada:  'Rechazada',
}

const STATUS_BADGE = {
  pendiente:  { bg: '#fef3c7', color: '#b45309' },
  en_proceso: { bg: '#dbeafe', color: '#1d4ed8' },
  resuelta:   { bg: '#d1fae5', color: '#065f46' },
  rechazada:  { bg: '#fee2e2', color: '#b91c1c' },
}

const PRIORITY_LABELS = {
  urgente: '🔴 Urgente',
  alta:    '🟠 Alta',
  media:   '🟡 Media',
  baja:    '⚪ Baja',
}

const EVENTO_LABELS = {
  creacion:      'Creación',
  asignacion:    'Asignación',
  cambio_estado: 'Cambio de estado',
  nota:          'Nota / Observación',
  derivacion:    'Derivación',
  edicion:       'Edición',
  intervencion:  'Intervención de campo',
}

export function generateReportHTML(denuncia, historial = []) {
  const statusCfg    = STATUS_BADGE[denuncia.estado]   ?? { bg: '#f3f4f6', color: '#6b7280' }
  const statusLabel  = STATUS_LABELS[denuncia.estado]  ?? denuncia.estado
  const prioLabel    = PRIORITY_LABELS[denuncia.prioridad] ?? denuncia.prioridad
  const fechaRegistro = dayjs(denuncia.fecha).format('DD/MM/YYYY [a las] HH:mm')
  const fechaReporte  = dayjs().format('DD/MM/YYYY HH:mm')

  const historialRows = historial.map((e, i) => `
    <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'}">
      <td style="padding:8px 12px;font-size:11.5px;color:#6b7280;white-space:nowrap;vertical-align:top">
        ${dayjs(e.fecha).format('DD/MM/YYYY')}<br>
        <span style="font-size:10px">${dayjs(e.fecha).format('HH:mm')}</span>
      </td>
      <td style="padding:8px 12px;font-size:11.5px;color:#374151;vertical-align:top">
        <span style="display:inline-block;margin-bottom:2px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#9ca3af">
          ${EVENTO_LABELS[e.tipo] ?? e.tipo}
        </span><br>
        ${e.descripcion}
      </td>
      <td style="padding:8px 12px;font-size:11px;color:#9ca3af;vertical-align:top;white-space:nowrap">
        ${e.usuario ?? '—'}
      </td>
    </tr>
  `).join('')

  const infoRow = (label, value) => value
    ? `<div class="info-item">
        <div class="info-label">${label}</div>
        <div class="info-value">${value}</div>
       </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Reporte — ${denuncia.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family:'Segoe UI',Arial,sans-serif;
      color:#1f2937;
      background:#f1f5f9;
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }
    .page{
      max-width:820px;
      margin:0 auto;
      background:#fff;
      box-shadow:0 0 40px rgba(0,0,0,.08);
    }

    /* ── Top accent bar ── */
    .accent-bar{
      height:5px;
      background:linear-gradient(to right,#4ac1e0,#818cf8);
    }

    /* ── Header ── */
    .doc-header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:28px 44px 20px;
      border-bottom:1px solid #e5e7eb;
    }
    .brand{display:flex;align-items:center;gap:12px}
    .brand-icon{
      width:40px;height:40px;
      background:linear-gradient(135deg,#4ac1e0,#818cf8);
      border-radius:10px;
      display:flex;align-items:center;justify-content:center;
      flex-shrink:0;
    }
    .brand-icon svg{fill:#fff}
    .brand-name{font-size:16px;font-weight:700;color:#0f172a;line-height:1.2}
    .brand-sub{font-size:11px;color:#6b7280;margin-top:2px}
    .doc-meta{text-align:right}
    .doc-meta .title{font-size:13px;font-weight:600;color:#374151}
    .doc-meta .date{font-size:11px;color:#9ca3af;margin-top:3px}

    /* ── ID Banner ── */
    .id-banner{
      margin:28px 44px 0;
      padding:20px 24px;
      background:#f0f9ff;
      border:1px solid #bae6fd;
      border-left:5px solid #4ac1e0;
      border-radius:10px;
    }
    .id-code{
      font-family:'Courier New',monospace;
      font-size:12px;font-weight:700;
      color:#0369a1;letter-spacing:.04em;
    }
    .id-title{
      font-size:20px;font-weight:700;
      color:#0f172a;margin-top:5px;line-height:1.3;
    }
    .badges{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
    .badge{
      display:inline-block;
      padding:4px 12px;border-radius:20px;
      font-size:11.5px;font-weight:600;white-space:nowrap;
    }
    .id-banner-meta{
      margin-top:12px;
      font-size:12px;color:#6b7280;
      padding-top:12px;
      border-top:1px solid #e0f2fe;
    }
    .id-banner-meta strong{color:#374151}

    /* ── Content ── */
    .content{padding:28px 44px 44px}

    /* ── Section ── */
    .section{margin-bottom:28px}
    .section-title{
      font-size:10.5px;font-weight:700;
      text-transform:uppercase;letter-spacing:.08em;
      color:#9ca3af;
      padding-bottom:8px;
      border-bottom:1px solid #f3f4f6;
      margin-bottom:14px;
    }

    /* ── Info grid ── */
    .info-grid{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px 28px;
    }
    .info-item .info-label{
      font-size:10px;font-weight:700;
      text-transform:uppercase;letter-spacing:.06em;
      color:#9ca3af;
    }
    .info-item .info-value{
      font-size:13px;color:#1f2937;margin-top:2px;
    }

    /* ── Description box ── */
    .desc-box{
      background:#f9fafb;
      border:1px solid #e5e7eb;
      border-radius:8px;
      padding:14px 16px;
      font-size:13px;color:#374151;
      line-height:1.75;
      white-space:pre-wrap;
    }

    /* ── Timeline ── */
    .timeline-table{
      width:100%;border-collapse:collapse;
    }
    .timeline-table thead tr{background:#f3f4f6}
    .timeline-table thead th{
      padding:8px 12px;text-align:left;
      font-size:10px;font-weight:700;
      text-transform:uppercase;letter-spacing:.06em;
      color:#6b7280;border-bottom:1px solid #e5e7eb;
    }
    .timeline-table td{border-bottom:1px solid #f3f4f6;vertical-align:top}

    /* ── Footer ── */
    .doc-footer{
      padding:16px 44px 24px;
      border-top:1px solid #e5e7eb;
      display:flex;align-items:center;justify-content:space-between;
    }
    .footer-text{font-size:10.5px;color:#9ca3af}
    .confidential{
      font-size:10px;font-weight:700;
      text-transform:uppercase;letter-spacing:.06em;
      color:#d1d5db;
    }

    @media print{
      body{background:#fff}
      .page{box-shadow:none}
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="accent-bar"></div>

    <!-- Header -->
    <div class="doc-header">
      <div class="brand">
        <div class="brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div>
          <div class="brand-name">Sistema de Denuncias</div>
          <div class="brand-sub">Reporte Oficial</div>
        </div>
      </div>
      <div class="doc-meta">
        <div class="title">Reporte de Denuncia Ciudadana</div>
        <div class="date">Generado el ${fechaReporte}</div>
      </div>
    </div>

    <!-- ID Banner -->
    <div class="id-banner">
      <div class="id-code">${denuncia.id}</div>
      <div class="id-title">${denuncia.titulo}</div>
      <div class="badges">
        <span class="badge" style="background:${statusCfg.bg};color:${statusCfg.color}">${statusLabel}</span>
        <span class="badge" style="background:#fef9c3;color:#713f12">${prioLabel}</span>
        ${denuncia.categoria ? `<span class="badge" style="background:#ede9fe;color:#6d28d9">${denuncia.categoria}</span>` : ''}
        ${denuncia.area ? `<span class="badge" style="background:#ecfdf5;color:#065f46">${denuncia.area}</span>` : ''}
      </div>
      <div class="id-banner-meta">
        Registrado el <strong>${fechaRegistro}</strong>
        ${denuncia.operador ? ` &nbsp;·&nbsp; Operador: <strong>${denuncia.operador}</strong>` : ''}
      </div>
    </div>

    <!-- Content -->
    <div class="content">

      <!-- Denunciante -->
      <div class="section">
        <div class="section-title">Datos del Denunciante</div>
        <div class="info-grid">
          ${infoRow('Nombre',   denuncia.ciudadano)}
          ${infoRow('Teléfono', denuncia.telefono)}
        </div>
      </div>

      <!-- Ubicación -->
      <div class="section">
        <div class="section-title">Ubicación</div>
        <div class="info-grid">
          ${infoRow('Dirección',   denuncia.direccion)}
          ${infoRow('Distrito',    denuncia.distrito)}
          ${infoRow('Subdistrito', denuncia.subdistrito)}
          ${infoRow('OTB',         denuncia.otb)}
          ${denuncia.lat && denuncia.lng
            ? infoRow('Coordenadas', `<span style="font-family:'Courier New',monospace;font-size:12px">${denuncia.lat.toFixed(5)}, ${denuncia.lng.toFixed(5)}</span>`)
            : ''}
        </div>
      </div>

      <!-- Descripción -->
      <div class="section">
        <div class="section-title">Descripción</div>
        <div class="desc-box">${denuncia.descripcion ?? 'Sin descripción registrada.'}</div>
      </div>

      <!-- Historial -->
      ${historial.length > 0 ? `
      <div class="section">
        <div class="section-title">Historial de Eventos (${historial.length})</div>
        <table class="timeline-table">
          <thead>
            <tr>
              <th style="width:90px">Fecha</th>
              <th>Descripción</th>
              <th style="width:120px">Usuario</th>
            </tr>
          </thead>
          <tbody>
            ${historialRows}
          </tbody>
        </table>
      </div>` : ''}

    </div><!-- /content -->

    <!-- Footer -->
    <div class="doc-footer">
      <div class="footer-text">Documento generado automáticamente — ${fechaReporte}</div>
      <div class="confidential">Uso interno</div>
    </div>

  </div><!-- /page -->
</body>
</html>`
}

/**
 * Opens a new window with the report HTML and triggers the browser print dialog.
 * Returns false if the popup was blocked.
 */
export function downloadReport(denuncia, historial) {
  const html = generateReportHTML(denuncia, historial)
  const win = window.open('', '_blank', 'width=920,height=1100,scrollbars=yes,resizable=yes')
  if (!win) return false
  win.document.write(html)
  win.document.close()
  // Small delay so styles render before print dialog opens
  setTimeout(() => {
    win.focus()
    win.print()
  }, 450)
  return true
}
