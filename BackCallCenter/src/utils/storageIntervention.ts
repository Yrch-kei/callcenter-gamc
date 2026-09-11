import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const MAX_MB  = parseInt(process.env.MAX_FILE_SIZE || '5', 10);
const ALLOWED = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(',');

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se aceptan imágenes JPEG, PNG o WebP.`));
  }
};

function makeStorage(subdir: string) {
  const dir = path.join(process.env.UPLOAD_DIR || './uploads', subdir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const name = crypto.randomBytes(8).toString('hex') + '-' + Date.now() + ext;
      cb(null, name);
    },
  });
}

export const uploadBefore = multer({
  storage: makeStorage('denuncias/antes'),
  fileFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

export const uploadAfter = multer({
  storage: makeStorage('denuncias/despues'),
  fileFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});
