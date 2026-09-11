import jwt from 'jsonwebtoken';
import { logger } from './logger';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'CAMBIAR_EN_PRODUCCION_usar_openssl_rand_hex_64') {
  if (process.env.NODE_ENV === 'production') {
    logger.error('FATAL: JWT_SECRET no configurado correctamente en producción');
    process.exit(1);
  }
  logger.warn('⚠️  JWT_SECRET no configurado — usando valor de desarrollo. NO usar en producción.');
}

const SECRET = JWT_SECRET || 'dev_fallback_secret_inseguro';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export const generateToken = (payload: { id: number; email: string; role: string; unitId?: number | null }) => {
  // El cast es seguro: JWT_EXPIRES_IN siempre es una string válida para jsonwebtoken ('8h', '24h', etc.)
  return jwt.sign(payload, SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    logger.error('Error verifying token:', error);
    throw new Error('Invalid or expired token');
  }
};

// Para logout podríamos usar una lista negra de tokens (si necesitas esta funcionalidad)
const tokenBlacklist = new Set<string>();

export const invalidateToken = (token: string) => {
  tokenBlacklist.add(token);
};

export const isTokenInvalidated = (token: string) => {
  return tokenBlacklist.has(token);
};