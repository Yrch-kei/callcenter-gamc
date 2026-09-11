import PDFKit from 'pdfkit';

declare module 'pdfkit' {
  interface PDFDocument {
    // Método arc con su firma completa
    arc(
      x: number,
      y: number,
      radius: number,
      startAngle: number,
      endAngle: number,
      anticlockwise?: boolean
    ): PDFKit.PDFDocument;
    
    // Otros métodos que puedan faltar
    save(): PDFKit.PDFDocument;
    restore(): PDFKit.PDFDocument;
    closePath(): PDFKit.PDFDocument;
  }
}