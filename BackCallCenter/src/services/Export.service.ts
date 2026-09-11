import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { ReportData, ReportResult } from '../types/reportTypes';

export class ExportService {
  // ========== Excel ==========
  static async exportToExcel(data: ReportData, title: string): Promise<ExcelJS.Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    // Configuración de columnas
    worksheet.columns = [
      { header: 'Item', key: 'name', width: 30 },
      { header: 'Cantidad', key: 'count', width: 15 },
      { header: 'Porcentaje', key: 'percentage', width: 15 }
    ];

    // Añadir datos
    data.results.forEach((item: ReportResult) => {
      worksheet.addRow({
        name: item.name,
        count: item.count,
        percentage: `${item.percentage.toFixed(2)}%`
      });
    });

    // Total
    worksheet.addRow(['TOTAL', data.total, '100%']);

    // Estilos
    worksheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } };
    });

    if (worksheet.lastRow) {
      worksheet.lastRow.eachCell((cell: ExcelJS.Cell) => {
        cell.font = { bold: true };
      });
    }

    // Bordes
    worksheet.eachRow((row: ExcelJS.Row) => {
      row.eachCell((cell: ExcelJS.Cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    return (await workbook.xlsx.writeBuffer()) as ExcelJS.Buffer;
  }

  // ========== PDF con Gráfico de Pastel ==========
  static async exportToPDF(data: ReportData, title: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Uint8Array[] = [];

      doc.on('data', (chunk: Uint8Array) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: Error) => reject(err));

      // Encabezado
      doc.fillColor('#333333')
        .fontSize(20)
        .text(title, { align: 'center' })
        .moveDown(0.5);

      // Gráfico de Pastel
      this.drawPieChart(doc, data);

      // Tabla de datos
      this.drawDataTable(doc, data, 400);

      // Fecha generación
      doc.fontSize(10)
        .text(`Generado el: ${new Date().toLocaleDateString()}`, 50, 750);

      doc.end();
    });
  }

  private static drawPieChart(doc: PDFKit.PDFDocument, data: ReportData): void {
    const centerX = 300;
    const centerY = 200;
    const radius = 150;
    let startAngle = 0;

    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      '#9966FF', '#FF9F40', '#8AC24A', '#EA5F89'
    ];

    data.results.forEach((item: ReportResult, i: number) => {
      const sliceAngle = (item.percentage / 100) * (2 * Math.PI);
      const endAngle = startAngle + sliceAngle;

      // Generar puntos de arco como líneas
      const steps = 30; // mayor = más suave el borde
      const angleStep = sliceAngle / steps;

      doc.save();
      doc.moveTo(centerX, centerY);

      for (let j = 0; j <= steps; j++) {
        const angle = startAngle + j * angleStep;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        doc.lineTo(x, y);
      }

      doc.closePath()
        .fill(colors[i % colors.length])
        .restore();

      // Leyenda
      const legendX = 500;
      const legendY = 100 + (i * 25);

      doc.rect(legendX, legendY, 20, 20)
        .fill(colors[i % colors.length]);

      doc.fontSize(12)
        .fillColor('#333333')
        .text(`${item.name} (${item.percentage.toFixed(1)}%)`, legendX + 30, legendY + 5);

      startAngle = endAngle;
    });

    // Círculo central blanco (manual)
    doc.save();
    doc.circle(centerX, centerY, radius * 0.3).fill('#FFFFFF');
    doc.restore();
  }

  private static drawDataTable(doc: PDFKit.PDFDocument, data: ReportData, startY: number): void {
    const tableTop = startY;
    const rowHeight = 30;
    const colWidths = [300, 100, 100];
    const headers = ['Item', 'Cantidad', 'Porcentaje'];

    // Encabezados de tabla
    doc.font('Helvetica-Bold')
      .fontSize(12);

    headers.forEach((header: string, i: number) => {
      doc.text(header, 50 + (i * colWidths[i]), tableTop, {
        width: colWidths[i],
        align: 'center'
      });
    });

    // Línea divisoria
    doc.moveTo(50, tableTop + rowHeight)
      .lineTo(550, tableTop + rowHeight)
      .stroke();

    // Datos
    doc.font('Helvetica')
      .fontSize(10);

    data.results.forEach((item: ReportResult, rowIndex: number) => {
      const y = tableTop + (rowIndex + 1) * rowHeight;

      [item.name, item.count.toString(), `${item.percentage.toFixed(2)}%`].forEach((text: string, colIndex: number) => {
        doc.text(text, 50 + (colIndex * colWidths[colIndex]), y + 10, {
          width: colWidths[colIndex],
          align: colIndex === 0 ? 'left' : 'center'
        });
      });
    });

    // Total
    const totalY = tableTop + (data.results.length + 1) * rowHeight;
    doc.font('Helvetica-Bold')
      .text('TOTAL', 50, totalY + 10)
      .text(data.total.toString(), 50 + colWidths[1], totalY + 10, { align: 'center' })
      .text('100%', 50 + colWidths[2], totalY + 10, { align: 'center' });
  }
}