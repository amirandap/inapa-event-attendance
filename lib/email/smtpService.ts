// lib/email/smtpService.ts
import nodemailer from 'nodemailer';
import MailComposer from 'mailcomposer';

class SmtpService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpUser || !smtpPassword) {
      throw new Error('Variables de entorno SMTP_USER o SMTP_PASSWORD no están definidas.');
    }

    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
  }

  /**
   * Envía un correo electrónico con adjuntos.
   * @param to - El destinatario del correo.
   * @param subject - El asunto del correo.
   * @param body - El cuerpo del correo (puede ser HTML).
   * @param attachments - Un array de objetos con los adjuntos.
   */
  async sendEmail(to: string[], subject: string, body: string, attachments: any[] = []): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: to,
        subject: subject,
        html: body,
        attachments: attachments,
      });

      console.log('✅ Correo electrónico enviado con éxito. ID del mensaje:', info.messageId);
    } catch (error) {
      console.error('❌ Error al enviar el correo electrónico:', error);
      throw new Error('Error al enviar el correo electrónico vía SMTP.');
    }
  }
}

export const smtpService = new SmtpService();