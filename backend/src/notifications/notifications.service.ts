
import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resend } from 'resend';
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
  private resend!: Resend;

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepo: Repository<NotificationEntity>,
    private readonly socketGateway: SocketGateway,
  ) {}

  async onModuleInit() {
    const apiKey = process.env.RESEND_API_KEY?.trim();

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    this.resend = new Resend(apiKey);

    this.logger.log('[Email] Resend API initialized successfully');
  }

  private get fromAddress(): string {
    return process.env.EMAIL_FROM || 'onboarding@resend.dev';
  }

private async sendEmail(
  to: string,
  subject: string,
  content: { html?: string; text?: string },
) {
  let result;

  if (content.html !== undefined) {
    result = await this.resend.emails.send({
      from: this.fromAddress,
      to: [to],
      subject,
      html: content.html,
    });
  } else if (content.text !== undefined) {
    result = await this.resend.emails.send({
      from: this.fromAddress,
      to: [to],
      subject,
      text: content.text,
    });
  } else {
    throw new Error('Email must contain HTML or text');
  }

  if (result.error) {
    this.logger.error(`[Email Error] ${result.error.message}`);
    throw new Error(result.error.message);
  }

  this.logger.log(
    `[Email] Sent successfully to ${to}. ID: ${result.data?.id}`,
  );

  return result.data;
}


  // ---------------------------------------------------------------------------
  // In-app notifications
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Emails
  // ---------------------------------------------------------------------------

  async sendVerificationEmail(email: string, name: string, token: string) {
    try {
      const verificationUrl =
        `${process.env.CORS_ORIGIN || 'http://localhost:3000'}` +
        `/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

      await this.sendEmail(
        email,
        'Verify Your Email Address - LocalLink',
        {
          html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f0e8;">
          <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
          <div style="text-align:center;margin-bottom:30px;"><h1 style="color:#0f766e;font-size:32px;font-weight:bold;margin:0;">LocalLink</h1><p style="color:#54575e;font-size:16px;margin:8px 0 0;">Find Trusted Local Services</p></div>
          <div style="background:#ffffff;border-radius:16px;padding:40px;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
          <h2 style="color:#1c1917;font-size:24px;margin:0 0 20px;">Verify Your Email Address</h2>
          <p style="color:#44403c;font-size:16px;line-height:1.6;margin:0 0 10px;">Hi ${name},</p>
          <p style="color:#44403c;font-size:16px;line-height:1.6;margin:0 0 30px;">Thanks for joining LocalLink. Confirm your email to start booking trusted local services.</p>
          <div style="text-align:center;margin:40px 0;"><a href="${verificationUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;padding:16px 32px;text-decoration:none;border-radius:10px;font-weight:600;font-size:16px;">Verify Email Address</a></div>
          <div style="background:#f5f0e8;border-radius:10px;padding:16px;margin:30px 0;"><p style="color:#54575e;font-size:14px;margin:0 0 8px;font-weight:600;">Or copy and paste this link:</p><a href="${verificationUrl}" style="color:#0f766e;word-break:break-all;font-size:14px;">${verificationUrl}</a></div>
          <p style="color:#a8a29e;font-size:14px;margin:20px 0 0;line-height:1.6;">This link expires in 24 hours.</p>
          <hr style="border:none;border-top:1px solid #e7e5e4;margin:30px 0;">
          <p style="color:#57534e;font-size:14px;margin:0;">Didn't create an account with LocalLink? Ignore this email.</p>
          </div></div></body></html>`,
        },
      );
    } catch (e) {
      this.logger.error('[Email Error] sendVerificationEmail', e);
      throw e;
    }
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    try {
      const resetUrl =
        `${process.env.CORS_ORIGIN || 'http://localhost:3000'}` +
        `/reset-password?token=${token}`;

      await this.sendEmail(
        email,
        'Reset Your Password - LocalLink',
        {
          html: `<div style="max-width:600px;margin:0 auto;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f0e8;">
          <div style="text-align:center;margin-bottom:30px;"><h1 style="color:#0f766e;font-size:32px;font-weight:bold;margin:0;">LocalLink</h1></div>
          <div style="background:#ffffff;border-radius:16px;padding:40px;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
          <h2 style="color:#1c1917;font-size:24px;margin:0 0 20px;">Reset Your Password</h2>
          <p style="color:#44403c;font-size:16px;line-height:1.6;">Hi ${name},</p>
          <p style="color:#44403c;font-size:16px;line-height:1.6;">We received a request to reset your LocalLink password. Click below to create a new one.</p>
          <div style="text-align:center;margin:40px 0;"><a href="${resetUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;padding:16px 32px;text-decoration:none;border-radius:10px;font-weight:600;font-size:16px;">Reset Password</a></div>
          <p style="color:#a8a29e;font-size:14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
          </div></div>`,
        },
      );
    } catch (e) {
      this.logger.error('[Email Error] sendPasswordResetEmail', e);
      throw e;
    }
  }

  async sendPasswordChangedEmail(email: string, name: string) {
    try {
      await this.sendEmail(
        email,
        'Your LocalLink password has been changed',
        {
          html: `<h2 style="font-family:sans-serif">Password Changed</h2><p style="font-family:sans-serif">Hello ${name}, your LocalLink password was changed successfully.</p>`,
        },
      );
    } catch (e) {
      this.logger.error('[Email Error] sendPasswordChangedEmail', e);
    }
  }

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
          text: `Hello ${providerName},\n\nYou have received a new service request:\n\nRequest ID: ${requestDisplayId}\nService: ${service}\nCustomer: ${customerName}\n\nPlease login to your dashboard to accept or reject this request.`,
        },
      );
    } catch (e) {
      this.logger.error('[Email Error] sendNewServiceRequestToProvider', e);
    }
  }

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
          text: `Hello ${userName},\n\nYour service request ${requestDisplayId} has been ${status} by ${providerName}.\n\nPlease login to your dashboard to view details.`,
        },
      );
    } catch (e) {
      this.logger.error('[Email Error] sendProviderResponseToUser', e);
    }
  }

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
          text: `Hello ${userName},\n\nYour service request ${requestDisplayId} has been completed by ${providerName}.\n\nPlease login to your dashboard to make payment and leave a review.`,
        },
      );
    } catch (e) {
      this.logger.error('[Email Error] sendServiceCompletedToUser', e);
    }
  }

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
          text: `Hello ${userName},\n\nYou have received a new message from ${senderName} regarding request ${requestDisplayId}.\n\nPlease login to your dashboard to view and reply.`,
        },
      );
    } catch (e) {
      this.logger.error('[Email Error] sendNewMessageNotification', e);
    }
  }
}
