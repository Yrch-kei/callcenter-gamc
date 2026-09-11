import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { Complaint } from '../models/complaint.entity';

export class PdfService {
  public generateInterventionReport(complaint: Complaint): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });

        const technicianName = complaint.attendedBy
          ? [complaint.attendedBy.names, complaint.attendedBy.lastname].filter(Boolean).join(' ')
          : 'No registrado';

        doc.fontSize(20).text('Informe Oficial de Cierre', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Codigo unico: ${complaint.code}`, { align: 'center', underline: true });
        doc.moveDown(2);

        doc.fontSize(12).font('Helvetica-Bold').text('Resumen de tiempos');
        doc.font('Helvetica').text(`Fecha de registro: ${complaint.registerDate ? complaint.registerDate.toLocaleString() : 'N/A'}`);
        doc.text(`Hora de llegada: ${complaint.arrivalTime ? complaint.arrivalTime.toLocaleString() : 'N/A'}`);
        doc.text(`Hora de finalizacion: ${complaint.finishTime ? complaint.finishTime.toLocaleString() : 'N/A'}`);
        doc.moveDown();

        doc.font('Helvetica-Bold').text('Reporte tecnico / resolucion');
        doc.font('Helvetica').text(`Tecnico responsable: ${technicianName}`);
        doc.text(`Estado del trabajo: ${complaint.resolutionResult || 'N/A'}`);
        doc.text(`Notas del personal: ${complaint.technicalNotes || 'No hay notas tecnicas.'}`);
        doc.moveDown(2);

        doc.font('Helvetica-Bold').text('Cuadro comparativo de evidencia visual', { align: 'center' });
        doc.moveDown();

        const beforeImages = complaint.images?.filter((img: any) => img.type === 'BEFORE') || [];
        const afterImages = complaint.images?.filter((img: any) => img.type === 'AFTER') || [];

        const beforeImgUrl = beforeImages.length > 0 ? beforeImages[beforeImages.length - 1].url : null;
        const afterImgUrl = afterImages.length > 0 ? afterImages[afterImages.length - 1].url : null;

        const startY = doc.y;

        if (beforeImgUrl) {
          const fullPath = path.join(process.cwd(), beforeImgUrl);
          if (fs.existsSync(fullPath)) {
            doc.text('ANTES', 50, startY);
            doc.image(fullPath, 50, startY + 20, { width: 220, height: 180 });
          }
        }

        if (afterImgUrl) {
          const fullPath = path.join(process.cwd(), afterImgUrl);
          if (fs.existsSync(fullPath)) {
            doc.text('DESPUES', 300, startY);
            doc.image(fullPath, 300, startY + 20, { width: 220, height: 180 });
          }
        }

        if (complaint.operatorSignature?.startsWith('data:image/')) {
          const signatureBase64 = complaint.operatorSignature.split(',')[1];
          if (signatureBase64) {
            const signatureBuffer = Buffer.from(signatureBase64, 'base64');
            const signatureTop = Math.max(startY + 230, doc.y + 10);
            doc.font('Helvetica-Bold').text('Firma del tecnico responsable', 50, signatureTop);
            doc.roundedRect(50, signatureTop + 20, 220, 90, 8).stroke('#cbd5e1');
            doc.image(signatureBuffer, 60, signatureTop + 30, { fit: [200, 60], valign: 'center' });
          }
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
export default new PdfService();
