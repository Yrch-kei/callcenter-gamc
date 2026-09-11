import { AppDataSource } from '../config/db';
import { User } from '../models/user.entity';
import { compare, hash } from 'bcryptjs';
import crypto from 'crypto';
import { MoreThan } from 'typeorm';
import { generateToken, invalidateToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { sendEmail } from '../utils/email';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role', 'unit'],
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.status !== 1) {
      throw new Error('Usuario inactivo');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      unitId: user.unit?.id ?? null,
    };

    const token = generateToken(tokenPayload);

    return {
      token,
      user: {
        id: user.id,
        names: user.names,
        lastname: user.lastname,
        email: user.email,
        role: user.role.name,
        unitId: user.unit?.id ?? null,
      },
    };
  }

  async logout(token: string) {
    invalidateToken(token);
    logger.info(`User logged out. Token: ${token.substring(0, 10)}...`);
    return { message: 'Logout exitoso' };
  }

  async forgotPassword(email: string) {
    const genericResponse = {
      success: true,
      message: 'Si el correo está registrado, se ha enviado un enlace de recuperación.',
    };

    if (!email) return genericResponse;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || user.status !== 1) {
      // Prevención de enumeración de usuarios
      return genericResponse;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hora de validez

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await this.userRepository.save(user);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
        <div style="background-color: #0284c7; padding: 16px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px;">Gobierno Autónomo Municipal de Cochabamba</h2>
          <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Plataforma de Atención Ciudadana y Call Center</p>
        </div>
        <div style="padding: 24px;">
          <p>Hola, <strong>${user.names} ${user.lastname}</strong>:</p>
          <p>Has solicitado restablecer la contraseña de tu cuenta en el sistema GAMC CallCenter.</p>
          <p>Para ingresar una nueva contraseña, haz clic en el siguiente botón (el enlace expirará en 1 hora):</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
          </div>
          <p style="font-size: 13px; color: #64748b;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual no sufrirá cambios.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><a href="${resetUrl}" style="color: #0284c7;">${resetUrl}</a></p>
        </div>
      </div>
    `;

    try {
      await sendEmail(
        user.email,
        'Recuperación de Contraseña - GAMC Call Center',
        `Hola ${user.names}, utiliza este enlace para restablecer tu contraseña: ${resetUrl}`,
        htmlContent
      );
    } catch (error) {
      logger.error(`Error sending email to ${email}:`, error);
    }

    return genericResponse;
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new Error('Token y nueva contraseña son obligatorios.');
    }

    // Validar requisitos de contraseña: mín 8 caracteres, mayúscula, minúscula, número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new Error('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números.');
    }

    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new Error('El token es inválido o ha expirado.');
    }

    user.password = await hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);

    return { success: true, message: 'La contraseña ha sido restablecida exitosamente.' };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) {
      throw new Error('La contraseña actual y la nueva contraseña son requeridas.');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new Error('La nueva contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números.');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const isMatch = await compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('La contraseña actual no es correcta.');
    }

    user.password = await hash(newPassword, 10);
    await this.userRepository.save(user);

    return { success: true, message: 'Contraseña actualizada exitosamente' };
  }
}