import nodemailer from 'nodemailer';

const rawPass = process.env.EMAIL_PASSWORD || 'tmydhlyamqhbocjf';
const cleanPass = rawPass.replace(/\s+/g, '');

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'rasputin4568@gmail.com',
    pass: cleanPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    const senderEmail = process.env.EMAIL_USER || 'rasputin4568@gmail.com';
    await transporter.sendMail({
      from: `CallCenter Municipal <${senderEmail}>`,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    });
    console.log(`Correo enviado exitosamente a ${to}`);
  } catch (error: any) {
    console.error('Error al enviar el correo:', error.message || error);
    throw new Error('No se pudo enviar el correo de recuperación');
  }
};