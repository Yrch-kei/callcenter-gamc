// src/controllers/complaint.controller.ts
import { Request, Response } from 'express';
import { ComplaintService } from '../services/complaint.service';
import { ComplaintHistoryService } from '../services/complaintHistory.service';
import reportService from '../services/ReportService';
import pdfService from '../services/PdfService';

const complaintService = new ComplaintService();
const historyService   = new ComplaintHistoryService();

// mapeo estado → descripción
const DESCRIPTIONS: Record<string,string> = {
  Pendiente: 'Denuncia creada',
  Derivada:  'Denuncia derivada',
  Resuelta:  'Denuncia resuelta',
  Cancelada: 'Denuncia cancelada'
};

export const createComplaint = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 1;
    const dto = { ...req.body };

    if (req.file) {
      dto.evidence = req.file.filename;
    } else if (!dto.evidence) {
      dto.evidence = 'sin-evidencia.jpg';
    }

    // Parsea explícitamente los campos numéricos provenientes de FormData
    if (dto.latitude !== undefined && dto.latitude !== null) {
      dto.latitude = parseFloat(String(dto.latitude));
    }
    if (dto.longitude !== undefined && dto.longitude !== null) {
      dto.longitude = parseFloat(String(dto.longitude));
    }
    if (dto.categoryId !== undefined && dto.categoryId !== null) {
      dto.categoryId = parseInt(String(dto.categoryId), 10);
    }
    if (dto.risk !== undefined && dto.risk !== null) {
      dto.risk = parseInt(String(dto.risk), 10);
    }
    if (dto.amount !== undefined && dto.amount !== null) {
      dto.amount = parseInt(String(dto.amount), 10);
    }
    if (dto.locationId !== undefined && dto.locationId !== null) {
      dto.locationId = parseInt(String(dto.locationId), 10);
    }

    const complaint = await complaintService.create(dto, userId);

    // historial inicial
    try {
      await historyService.create({
        complaintId: complaint.id,
        description: DESCRIPTIONS[complaint.status] || 'Denuncia creada',
        tipo: 'creacion',
        userId: complaint.createdBy?.id || userId
      });
    } catch (e) {
      console.warn('[ComplaintController] No se pudo guardar el historial inicial:', (e as Error).message);
    }

    res.status(201).json({
      success: true,
      data: complaint,
      code: complaint.code,
      id: complaint.id,
      status: complaint.status,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const createPublicComplaint = async (req: Request, res: Response): Promise<void> => {
  return createComplaint(req, res);
};

export const updateComplaint = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 1;
    const updated = await complaintService.update(
      req.params.id,
      req.body,
      userId
    );
    if (!updated) {
      res.status(404).json({ message: 'Denuncia no encontrada' });
      return;
    }
    
    if (req.file) {
      updated.evidence = req.file.filename;
    }

    // si cambio de estado, inserta historial
    if (req.body.status) {
      const customNotes = req.body.notes || req.body.note;
      const desc = customNotes && String(customNotes).trim() ? String(customNotes).trim() : (DESCRIPTIONS[req.body.status] || `Estado cambiado a ${req.body.status}`);
      await historyService.create({
        complaintId: updated.id,
        description: desc,
        tipo: req.body.status === 'Derivada' ? 'derivacion' : 'cambio_estado',
        userId
      });
    } else {
      // edición sin cambio de estado
      await historyService.create({
        complaintId: updated.id,
        description: 'Denuncia editada por el operador.',
        tipo: 'edicion',
        userId
      });
    }

    res.json(updated);
  } catch (error: any) {
    console.error('Error al actualizar denuncia:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};

export const updateComplaintStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 1;
    const status = req.body.status;
    if (!status) {
      res.status(400).json({ message: 'El estado es requerido' });
      return;
    }
    const updated = await complaintService.updateStatus(req.params.id, status, userId);
    if (!updated) {
      res.status(404).json({ message: 'Denuncia no encontrada' });
      return;
    }

    const customNotes = req.body.notes || req.body.note;
    const desc = customNotes && String(customNotes).trim() ? String(customNotes).trim() : (DESCRIPTIONS[status] || `Estado cambiado a ${status}`);
    await historyService.create({
      complaintId: updated.id,
      description: desc,
      tipo: status === 'Derivada' ? 'derivacion' : 'cambio_estado',
      userId,
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar el estado de la denuncia' });
  }
};

export const deleteComplaint = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const updated = await complaintService.updateStatus(
      Number(req.params.id),
      'Cancelada',
      userId
    );
    if (!updated) {
      res.status(404).json({ message: 'Denuncia no encontrada' });
      return;
    }

    // historial de derivación
    await historyService.create({
      complaintId: updated.id,
      description: DESCRIPTIONS.Cancelada,
      tipo: 'cambio_estado',
      userId
    });

    res.status(200).json({ message: 'Denuncia cancelada correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


export const getComplaints = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const complaints = await complaintService.findAll(userId);
    res.status(200).json(complaints);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getComplaintById = async (req: Request, res: Response): Promise<void> => {
  try {
    const complaint = await complaintService.findOne(Number(req.params.id));
    if (!complaint) {
      res.status(404).json({ message: 'Denuncia no encontrada' });
      return;
    }
    res.status(200).json(complaint);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deriveComplaint = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId      = req.user!.id;
    const complaintId = Number(req.params.id);
    const { area, note } = req.body;

    if (!area || String(area).trim().length < 2) {
      res.status(400).json({ error: 'Debes indicar el área destino.' });
      return;
    }

    const complaint = await complaintService.findOne(complaintId);
    if (!complaint) {
      res.status(404).json({ message: 'Denuncia no encontrada' });
      return;
    }

    if (['Resuelta', 'Cancelada'].includes(complaint.status)) {
      res.status(400).json({ error: 'No se puede derivar una denuncia en estado terminal.' });
      return;
    }

    const updated = await complaintService.updateStatus(complaintId, 'Derivada', userId);

    const desc = note?.trim()
      ? `Derivada al área "${area}". Motivo: ${note.trim()}`
      : `Derivada al área "${area}".`;

    await historyService.create({
      complaintId,
      description: desc,
      tipo: 'derivacion',
      userId,
    });

    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId      = req.user!.id;
    const complaintId = Number(req.params.id);
    const { text }    = req.body;

    if (!text || String(text).trim().length < 5) {
      res.status(400).json({ error: 'La nota debe tener al menos 5 caracteres.' });
      return;
    }

    const complaint = await complaintService.findOne(complaintId);
    if (!complaint) {
      res.status(404).json({ message: 'Denuncia no encontrada' });
      return;
    }

    await historyService.create({
      complaintId,
      description: String(text).trim(),
      tipo: 'nota',
      userId,
    });

    res.status(201).json({ message: 'Nota registrada correctamente.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const startIntervention = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { latitude, longitude } = req.body;
    const complaintId = Number(req.params.id);
    
    // Obtener array de archivos desde multer
    const files = req.files as Express.Multer.File[];
    const photosUrls: string[] = files ? files.map(file => `/uploads/denuncias/antes/${file.filename}`) : [];

    const complaint = await complaintService.startIntervention(
      complaintId,
      userId,
      Number(latitude),
      Number(longitude),
      photosUrls
    );

    await historyService.create({
      complaintId: complaint.id,
      description: 'El técnico ha llegado al lugar y está iniciando la atención.',
      tipo: 'intervencion',
      userId
    });

    res.status(200).json(complaint);
  } catch (error: any) {
    if (error.message.includes('No autorizado')) {
       res.status(403).json({ error: error.message });
       return;
    }
    res.status(400).json({ error: error.message });
  }
};

export const finishIntervention = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const complaintId = Number(req.params.id);
    const { technicalNotes, materialsUsed, resolutionResult, operatorSignature } = req.body;
    
    // Obtener array de archivos desde multer
    const files = req.files as Express.Multer.File[];
    const photosUrls: string[] = files ? files.map(file => `/uploads/denuncias/despues/${file.filename}`) : [];

    const complaint = await complaintService.finishIntervention(
      complaintId,
      userId,
      technicalNotes,
      materialsUsed,
      resolutionResult,
      operatorSignature,
      photosUrls
    );

    await historyService.create({
      complaintId: complaint.id,
      description: `Intervención finalizada. Resultado: ${resolutionResult}.`,
      tipo: 'intervencion',
      userId
    });

    res.status(200).json(complaint);
  } catch (error: any) {
    if (error.message.includes('No autorizado')) {
       res.status(403).json({ error: error.message });
       return;
    }
    res.status(400).json({ error: error.message });
  }
};

export const getPublicStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const info = await complaintService.getPublicStatus(code);
    if (!info) {
       res.status(404).json({ message: 'No se encontró la denuncia con el código brindado' });
       return;
    }
    res.status(200).json(info);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getHeatmap = async (req: Request, res: Response): Promise<void> => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const heatmapData = await reportService.getHeatmap(year);
    res.status(200).json(heatmapData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const downloadPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const complaintId = Number(req.params.id);
    const complaint = await complaintService.findOne(complaintId);
    if (!complaint) {
       res.status(404).json({ message: 'Denuncia no encontrada' });
       return;
    }
    
    const pdfBuffer = await pdfService.generateInterventionReport(complaint as any);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=acta_intervencion_${complaint.code}.pdf`);
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const rateComplaint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const rawRating = req.body?.rating ?? req.body?.satisfactionRating;
    const rating = Number(rawRating);

    if (isNaN(rating) || rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        message: 'La calificación debe ser un número entero entre 1 y 5.'
      });
      return;
    }
    const updated = await complaintService.rateComplaint(code, rating);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Denuncia no encontrada' });
      return;
    }
    res.status(200).json({ success: true, message: 'Gracias por tu calificación.', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const requestReopen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const reopenText = req.body?.reopenReason || req.body?.reason;
    if (!reopenText || typeof reopenText !== 'string' || reopenText.trim().length < 5) {
      res.status(400).json({
        success: false,
        message: 'Debes detallar el motivo de disconformidad (mínimo 5 caracteres).'
      });
      return;
    }
    const updated = await complaintService.requestReopen(code, reopenText.trim());
    if (!updated) {
      res.status(404).json({ success: false, message: 'Denuncia no encontrada' });
      return;
    }
    res.status(200).json({ success: true, message: 'Solicitud de reapertura enviada.', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const evaluateReopen = async (req: Request, res: Response): Promise<void> => {
  try {
    const complaintId = Number(req.params.id);
    const operatorUserId = req.user?.id || 1;
    const { action, note } = req.body;

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      res.status(400).json({ error: 'Acción no válida. Utiliza APPROVE o REJECT.' });
      return;
    }

    if (action === 'REJECT' && (!note || String(note).trim().length < 5)) {
      res.status(400).json({ error: 'Debes justificar técnicamente el rechazo de la reapertura.' });
      return;
    }

    const updated = await complaintService.evaluateReopen(complaintId, action, note, operatorUserId);
    if (!updated) {
      res.status(404).json({ message: 'Denuncia no encontrada' });
      return;
    }

    res.status(200).json({ success: true, message: `Reapertura ${action === 'APPROVE' ? 'aprobada' : 'rechazada'} exitosamente.`, data: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const arriveAtSite = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 1;
    const complaintId = Number(req.params.id);
    const { latitude, longitude } = req.body;

    const complaint = await complaintService.arriveAtSite(
      complaintId,
      userId,
      Number(latitude),
      Number(longitude)
    );

    res.status(200).json(complaint);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const resolveComplaint = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 1;
    const complaintId = Number(req.params.id);
    const { technicalNotes, materialsUsed, resolutionResult, finishTime } = req.body;

    let filesList: Express.Multer.File[] = [];
    if (req.file) {
      filesList = [req.file];
    }
    if (req.files) {
      if (Array.isArray(req.files)) {
        filesList = [...filesList, ...req.files];
      } else {
        const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] };
        Object.values(filesObj).forEach((arr) => {
          if (Array.isArray(arr)) filesList.push(...arr);
        });
      }
    }

    const complaint = await complaintService.resolveComplaint(
      complaintId,
      userId,
      { technicalNotes, materialsUsed, resolutionResult, finishTime },
      filesList
    );

    res.status(200).json(complaint);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const assignComplaint = async (req: Request, res: Response): Promise<void> => {
  try {
    const operatorUserId = req.user?.id || 1;
    const complaintId = Number(req.params.id);
    const { technicianId, userId: bodyTechId, observation } = req.body;
    const targetTechId = Number(technicianId || bodyTechId);

    if (isNaN(targetTechId) || targetTechId <= 0) {
      res.status(400).json({ error: 'Debes seleccionar un técnico válido.' });
      return;
    }

    const complaint = await complaintService.assignComplaint(
      complaintId,
      targetTechId,
      operatorUserId,
      observation
    );

    res.status(200).json(complaint);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al asignar la denuncia al técnico' });
  }
};

