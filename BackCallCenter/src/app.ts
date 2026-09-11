import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { initializeDB } from './config/db';
import { errorMiddleware } from './middlewares/error.middleware';
import { logger } from './utils/logger';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import complaintRoutes from './routes/complaint.routes';
import complaintHistoryRoutes from './routes/complaintHistory.routes';
import roleRoutes from './routes/role.routes';
import unitRoutes from './routes/unit.routes';
import categoryRoutes from './routes/category.routes';
import departmentRoutes from './routes/department.routes';
import userComplaintRoutes from './routes/userComplaint.routes';
import companyRoutes from './routes/company.routes';
import path from 'path';
import fs from 'fs';
import reportRoutes from './routes/report.routes';
import statsRoutes from './routes/stats.routes';
import exportRoutes from './routes/export.routes';
import pushRoutes from './routes/push.routes';

const app = express();

// Middlewares básicos
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', '*'],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.')) {
      callback(null, true);
    } else {
      callback(new Error('CORS bloqueado'));
    }
  },
  credentials: true
}));



app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite cada IP
});
app.use(limiter);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/complaint-history', complaintHistoryRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/user-complaints', userComplaintRoutes);
app.use('/api/companies', companyRoutes);
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
const cwdUploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(cwdUploadDir)) {
  fs.mkdirSync(cwdUploadDir, { recursive: true });
}

// Servir estáticos tanto para /uploads como para /photos con cabeceras CORS
app.use(
  ['/uploads', '/photos'],
  (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(uploadDir),
  express.static(cwdUploadDir)
);
app.use('/api/reports', reportRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/push', pushRoutes);

// Manejo de errores
app.use(errorMiddleware);

// Inicialización
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await initializeDB();
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
