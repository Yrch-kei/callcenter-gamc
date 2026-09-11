import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { validateLoginInput } from '../validations/auth.validation';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    const { errors, isValid } = validateLoginInput(email, password);
    if (!isValid) {
      res.status(400).json({ errors });
      return;
    }

    try {
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    try {
      const result = await authService.forgotPassword(email);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body;
    try {
      const result = await authService.resetPassword(token, newPassword);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;
    try {
      const result = await authService.changePassword(userId, currentPassword, newPassword);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(400).json({ message: 'Token no proporcionado' });
      return;
    }

    try {
      const result = await authService.logout(token);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: 'Error durante el logout' });
    }
  }
}