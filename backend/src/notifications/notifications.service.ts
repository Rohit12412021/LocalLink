
import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { SocketGateway } from './socket.gateway';
import { NotificationEntity } from './entities/notification.entity';

export type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  requestId?: string | null;
  link?: string | null;
};

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;
  private gmail: ReturnType<typeof google.gmail> | null = null;
  private emailMode: 'smtp' | 'gmail-api' | 'disabled' = 'disabled';

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepo: Repository<NotificationEntity>,
    private readonly socketGateway: SocketGateway,
  ) {}

  async onModuleInit() {
    // ── Priority 1: SMTP (fast, no token refresh delay) ──────────────────
    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 465),
        secure: process.env.SMTP_SECURE !== 'false',
        auth: { user: smtpUser, pass: smtpPass },
        // Connection pool for speed
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        // Keep connection alive
        socketTimeout: 10000,
      });
      // Verify connection eagerly (non-blocking)
      this.transporter.verify().then(() => {
        this.emailMode = 'smtp';
        this.logger.log(`[Email] SMTP ready → ${smtpHost} (${smtpUser})`);
      }).catch(err => {
        this.logger.error(`[Email] SMTP verify failed: ${err.message}`);
        this.transporter = null;
        this.initGmailApi();
      });
      return;
    }

    // ── Priority 2: Gmail API ─────────────────────────────────────────────
    this.initGmailApi();
  }

  private initGmailApi() {
    const clientId = process.env.GMAIL_CLIENT_ID?.trim();
    const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim();
    const sender = process.env.GMAIL_USER?.trim();

    if (!clientId || !clientSecret || !refreshToken || !sender) {
      this.logger.warn('[Email] No email credentials configured. Emails disabled.');
      return;
    }

    const auth = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
    auth.setCredentials({ refresh_token: refreshToken });
    this.gmail = google.gmail({ version: 'v1', auth });
    this.emailMode = 'gmail-api';
    this.logger.log('[Email] Gmail API ready.');
  }

  private get fromAddress(): string {
    return process.env.SMTP_FROM || process.env.GMAIL_USER || 'LocalLink <noreply@locallink.app>';
  }

  private async sendEmail(to: string, subject: string, content: { html?: string; text?: string }) {
    // ── SMTP path (fast) ──────────────────────────────────────────────────
    if (this.transporter && this.emailMode === 'smtp') {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html: content.html,
        text: content.text,
      });
      this.logger.log(`[Email] SMTP sent to ${to} — "${subject}"`);
      return;
    }

    // ── Gmail API path ────────────────────────────────────────────────────
    if (this.gmail && this.emailMode === 'gmail-api') {
      const sender = process.env.GMAIL_USER?.trim();
      if (!sender) throw new Error('GMAIL_USER not configured');

      const body = content.html ?? content.text ?? '';
      const contentType = content.html ? 'text/html' : 'text/plain';
      const encoded = Buffer.from(body, 'utf8').toString('base64');
      const message = [
        `From: LocalLink <${sender}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        `Content-Type: ${contentType}; charset=utf-8`,
        'Content-Transfer-Encoding: base64',
        '',
        encoded,
      ].join('\r\n');

      const result = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: Buffer.from(message, 'utf8').toString('base64url') },
      });
      this.logger.log(`[Email] Gmail API sent to ${to}. ID: ${result.data.id}`);
      return;
    }

    this.logger.warn(`[Email] No email transport configured — skipping email to ${to}`);
  }

  // --------------------------------------------------
  // In-app notifications
  // --------------------------------------------------

  async createNotification(input: CreateNotificationInput) {
    const notification = this.notificationsRepo.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body || '',
      requestId: input.requestId ?? null,
      link: input.link ?? null,
      read: false,
    });

    await this.notificationsRepo.save(notification);

    const dto = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      requestId: notification.requestId,
      link: notification.link,
      read: false,
      createdAt: notification.createdAt,
    };

    try {
      this.socketGateway.emitToUser(input.userId, 'notification', dto);
    } catch (e) {
      this.logger.warn('[Notify] socket emit failed', e);
    }

    return dto;
  }

  async listForUser(userId: string) {
    const rows = await this.notificationsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      requestId: n.requestId,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt,
    }));
  }

  async unreadCount(userId: string) {
    const count = await this.notificationsRepo.count({
      where: { userId, read: false },
    });

    return { count };
  }

  async markRead(userId: string, notificationId: string) {
    const result = await this.notificationsRepo.update(
      { id: notificationId, userId },
      { read: true },
    );

    if ((result.affected ?? 0) === 0) {
      throw new NotFoundException('Notification not found');
    }

    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.notificationsRepo.update({ userId }, { read: true });
    return { ok: true };
  }

  // --------------------------------------------------
  // Email: Verification
  // --------------------------------------------------

  async sendVerificationEmail(email: string, name: string, token: string) {
    try {
      const verificationUrl =
        `${process.env.CORS_ORIGIN || 'http://localhost:3000'}` +
        `/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

      await this.sendEmail(
        email,
        'Verify Your Email Address - LocalLink',
        {
          html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:30px;font-family:Arial;background:#f5f0e8;">
<div style="max-width:600px;margin:auto;background:white;padding:35px;border-radius:15px;">
<h1 style="color:#0f766e;text-align:center;">LocalLink</h1>
<h2>Verify Your Email Address</h2>
<p>Hi ${name},</p>
<p>Thanks for joining LocalLink. Confirm your email to start booking trusted local services.</p>
<div style="text-align:center;margin:35px;">
<a href="${verificationUrl}" style="background:#0f766e;color:white;padding:15px 25px;text-decoration:none;border-radius:8px;">Verify Email Address</a>
</div>
<p>Or copy this link:</p>
<a href="${verificationUrl}">${verificationUrl}</a>
<p style="color:#888;font-size:13px;">This link expires in 24 hours.</p>
<p>Didn't create an account? Ignore this email.</p>
</div>
</body>
</html>`,
        },
      );
    } catch (e) {
      this.logger.error('[Email Error] sendVerificationEmail', e);
      throw e;
    }
  }

  // --------------------------------------------------
  // Email: Password reset
  // --------------------------------------------------

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    try {
      const resetUrl =
        `${process.env.CORS_ORIGIN || 'http://localhost:3000'}` +
        `/reset-password?token=${token}`;

      await this.sendEmail(
        email,
        'Reset Your Password - LocalLink',
        {
          html: `<div style="max-width:600px;margin:auto;padding:35px;font-family:Arial;background:#f5f0e8;">
<div style="background:white;padding:35px;border-radius:15px;">
<h1 style="color:#0f766e;text-align:center;">LocalLink</h1>
<h2>Reset Your Password</h2>
<p>Hi ${name},</p>
<p>We received a request to reset your LocalLink password.</p>
<div style="text-align:center;margin:35px;">
<a href="${resetUrl}" style="background:#0f766e;color:white;padding:15px 25px;text-decoration:none;border-radius:8px;">Reset Password</a>
</div>
<p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
</div></div>`,
        },
      );
    } catch (e) {
      this.logger.error('[Email Error] sendPasswordResetEmail', e);
      throw e;
    }
  }

  // --------------------------------------------------
  // Email: Password changed
  // --------------------------------------------------

  async sendPasswordChangedEmail(email: string, name: string) {
    try {
      await this.sendEmail(
        email,
        'Your LocalLink password has been changed',
        {
          html: `<h2>Password Changed</h2>
<p>Hello ${name}, your LocalLink password was changed successfully.</p>`,
        },
      );
    } catch (e) {
      this.logger.error('[Email Error] sendPasswordChangedEmail', e);
    }
  }

  // --------------------------------------------------
  // Email: Booking status
  // --------------------------------------------------

  async sendBookingStatusUpdate(
    email: string,
    requestDisplayId: string,
    status: string,
  ) {
    try {
      await this.sendEmail(
        email,
        `Booking ${requestDisplayId} Update`,
        {
          text: `Your booking ${requestDisplayId} is now: ${status}.`,
        },
      );
    } catch (e) {
      this.logger.error('[Email Error] sendBookingStatusUpdate', e);
    }
  }

  // --------------------------------------------------
  // Email: New service request
  // --------------------------------------------------

  async sendNewServiceRequestToProvider(
    email: string,
    providerName: string,
    requestDisplayId: string,
    service: string,
    customerName: string,
  ) {
    try {
      await this.sendEmail(
        email,
        `New Service Request: ${requestDisplayId}`,
        {
          text: `Hello ${providerName},

You have received a new service request:

Request ID: ${requestDisplayId}
Service: ${service}
Customer: ${customerName}

Please login to your dashboard to accept or reject this request.`,
        },
      );
    } catch (e) {
      this.logger.error('[Email Error] sendNewServiceRequestToProvider', e);
    }
  }

  // --------------------------------------------------
  // Email: Provider response
  // --------------------------------------------------

  async sendProviderResponseToUser(
    email: string,
    userName: string,
    requestDisplayId: string,
    status: string,
    providerName: string,
  ) {
    try {
      await this.sendEmail(
        email,
        `Request ${requestDisplayId} ${status}`,
        {
          text: `Hello ${userName},

Your service request ${requestDisplayId} has been ${status} by ${providerName}.

Please login to your dashboard to view details.`,
        },
      );
    } catch (e) {
      this.logger.error('[Email Error] sendProviderResponseToUser', e);
    }
  }

  // --------------------------------------------------
  // Email: Service completed
  // --------------------------------------------------

  async sendServiceCompletedToUser(
    email: string,
    userName: string,
    requestDisplayId: string,
    providerName: string,
  ) {
    try {
      await this.sendEmail(
        email,
        `Service Completed: ${requestDisplayId}`,
        {
          text: `Hello ${userName},

Your service request ${requestDisplayId} has been completed by ${providerName}.

Please login to your dashboard to make payment and leave a review.`,
        },
      );
    } catch (e) {
      this.logger.error('[Email Error] sendServiceCompletedToUser', e);
    }
  }

  // --------------------------------------------------
  // Email: New message
  // --------------------------------------------------

  async sendNewMessageNotification(
    email: string,
    userName: string,
    requestDisplayId: string,
    senderName: string,
  ) {
    try {
      await this.sendEmail(
        email,
        `New Message: ${requestDisplayId}`,
        {
          text: `Hello ${userName},

You have received a new message from ${senderName} regarding request ${requestDisplayId}.

Please login to your dashboard to view and reply.`,
        },
      );
    } catch (e) {
      this.logger.error('[Email Error] sendNewMessageNotification', e);
    }
  }
}
