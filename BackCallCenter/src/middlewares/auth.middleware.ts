import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { isTokenInvalidated } from '../utils/jwt';

const ROLE_ALIASES: Record<string, string> = {
  'Operador de Call Center': 'Operador Call Center',
  'Operador Call Center': 'Operador Call Center',
};

const normalizeRole = (role?: string) => ROLE_ALIASES[role ?? ''] ?? role ?? '';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Token no proporcionado' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    if (isTokenInvalidated(token)) {
      res.status(401).json({ message: 'Token inválido (logout)' });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded as Express.Request['user'];
    next();
  } catch (error: any) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as { id: number; email: string; role: string };

    if (!user) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return 
    }

    const normalizedUserRole = normalizeRole(user.role);
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
      return 
    }

    next(); // Continúa si el rol es válido
  };
};
