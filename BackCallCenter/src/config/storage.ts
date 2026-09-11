import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const maxSize = parseInt(process.env.MAX_FILE_SIZE || '5') * 1024 * 1024;
const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '').split(',');

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSize },
});

export const getFileUrl = (filename: string) => {
  return `/uploads/${filename}`;
};