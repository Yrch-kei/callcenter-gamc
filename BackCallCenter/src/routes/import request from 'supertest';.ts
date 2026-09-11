import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import router from './export.routes';

// src/routes/export.routes.test.ts

// Mock middlewares to always call next()
jest.mock('../middlewares/auth.middleware', () => ({
  authMiddleware: (req: Request, res: Response, next: NextFunction) => next(),
  authorizeRoles: () => (req: Request, res: Response, next: NextFunction) => next(),
}));
jest.mock('../validations/report.validations', () => ({
  reportValidations: (req: Request, res: Response, next: NextFunction) => next(),
}));

// Mock ExportController methods
const exportExcelMock = jest.fn((req: Request, res: Response) => res.status(200).send('excel'));
const exportPDFMock = jest.fn((req: Request, res: Response) => res.status(200).send('pdf'));
jest.mock('../controllers/export.controller', () => ({
  ExportController: jest.fn().mockImplementation(() => ({
    exportExcel: exportExcelMock,
    exportPDF: exportPDFMock,
  })),
}));


const app = express();
app.use(router);

describe('Export Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /excel/:type/:year calls exportExcel and returns 200', async () => {
    const res = await request(app).get('/excel/testType/2024');
    expect(exportExcelMock).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.text).toBe('excel');
  });

  it('GET /pdf/:type/:year calls exportPDF and returns 200', async () => {
    const res = await request(app).get('/pdf/testType/2024');
    expect(exportPDFMock).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.text).toBe('pdf');
  });
});