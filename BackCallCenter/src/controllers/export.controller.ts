import { Request, Response } from 'express';
import { ExportService } from '../services/Export.service';
import ReportService from '../services/ReportService';

const reportTypes = {
  office: ReportService.getComplaintsByOffice,
  category: ReportService.getComplaintsByCategory,
  receptionist: ReportService.getComplaintsByReceptionist,
  submayor: ReportService.getComplaintsBySubMayor,
  district: ReportService.getComplaintsByDistrict,
  status: ReportService.getComplaintsByStatus
};

export class ExportController {
  async exportExcel(req: Request, res: Response): Promise<void> {
    try {
      const { type, year } = req.params;
      
      if (!(type in reportTypes)) {
        res.status(400).json({ error: 'Tipo de reporte inválido' });
        return;
      }

      const data = await reportTypes[type as keyof typeof reportTypes](Number(year));
      const buffer = await ExportService.exportToExcel(data, `Reporte de ${type} - ${year}`);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=reporte_${type}_${year}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error('Error en exportExcel:', error);
      res.status(500).json({ error: 'Error al generar el archivo Excel' });
    }
  }

  async exportPDF(req: Request, res: Response): Promise<void> {
    try {
      const { type, year } = req.params;
      
      if (!(type in reportTypes)) {
        res.status(400).json({ error: 'Tipo de reporte inválido' });
        return;
      }

      const data = await reportTypes[type as keyof typeof reportTypes](Number(year));
      const buffer = await ExportService.exportToPDF(data, `Reporte de ${type} - ${year}`);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=reporte_${type}_${year}.pdf`);
      res.send(buffer);
    } catch (error) {
      console.error('Error en exportPDF:', error);
      res.status(500).json({ error: 'Error al generar el archivo PDF' });
    }
  }
}