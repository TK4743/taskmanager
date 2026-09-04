import { pool } from './db.js';
import { dispatchEmailThroughPool, getCanonicalPortalUrl } from './emailService.js';
import { sendTelegramMessage } from './telegramService.js';

export type NotificationEventType =
  | 'APPLICATION_RECEIVED'
  | 'APPLICATION_SHORTLISTED'
  | 'APPLICATION_REJECTED'
  | 'INTERVIEW_SCHEDULED'
  | 'CANDIDATE_SELECTED'
  | 'POSTING_CREATED'
  | 'POSTING_APPROVED'
  | 'REPORT_GENERATED'
  | 'SKILL_ASSESSMENT_COMPLETED'
  | 'NEW_TASK_POSTED'
  | 'CODING_ASSESSMENT_PUBLISHED';

export interface SendNotificationOptions {
  userId?: string;
  targetRole?: string;
  eventType: NotificationEventType;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

export async function getUserNotificationPreferences(userId: string) {
  try {
    const res = await pool.query(
      `SELECT * FROM notification_preferences WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    if (res.rows.length > 0) return res.rows[0];

    // Default preferences
    return {
      email_enabled: true,
      telegram_enabled: true,
      in_app_enabled: true,
      application_notifications: true,
      interview_notifications: true,
      selection_notifications: true,
      system_notifications: true,
    };
  } catch (err) {
    return {
      email_enabled: true,
      telegram_enabled: true,
      in_app_enabled: true,
      application_notifications: true,
      interview_notifications: true,
      selection_notifications: true,
      system_notifications: true,
    };
  }
}

export async function sendUnifiedNotification(options: SendNotificationOptions): Promise<void> {
  const { userId, targetRole, eventType, title, message, referenceType, referenceId, metadata } = options;

  // Execute asynchronously to ensure parent HTTP transactions never wait or crash
  setImmediate(async () => {
    try {
      let recipientList: any[] = [];
      if (targetRole) {
        const roleRes = await pool.query(
          `SELECT id, full_name, email, telegram_chat_id, role FROM users WHERE role = $1`,
          [targetRole]
        );
        recipientList = roleRes.rows;
      } else if (userId) {
        const userRes = await pool.query(
          `SELECT id, full_name, email, telegram_chat_id, role FROM users WHERE id = $1 LIMIT 1`,
          [userId]
        );
        if (userRes.rows.length > 0) recipientList = userRes.rows;
      }

      if (recipientList.length === 0) return;

      const portalUrl = getCanonicalPortalUrl();

      for (const recipient of recipientList) {
        const uid = recipient.id;
        const prefs = await getUserNotificationPreferences(uid);

        // 1. In-App Notification (Always created if in_app_enabled)
        if (prefs.in_app_enabled !== false) {
          await pool.query(
            `INSERT INTO notifications 
             (user_id, message, type, event_type, channel, title, status, reference_type, reference_id, is_read, sent_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, CURRENT_TIMESTAMP)`,
            [
              uid,
              message,
              eventType,
              eventType,
              'IN_APP',
              title,
              'SENT',
              referenceType || 'SYSTEM',
              referenceId || null
            ]
          ).catch((e: any) => console.warn('[Notification] In-app insert warning:', e.message));
        }

        // 2. Telegram Notification
        if (prefs.telegram_enabled !== false && recipient.telegram_chat_id) {
          const formattedMessage = `<b>🔔 ${title}</b>\n\n${message}\n\n🔗 <a href="${portalUrl}">Open Academic Platform</a>`;
          sendTelegramMessage(recipient.telegram_chat_id, formattedMessage)
            .catch((e: any) => console.warn('[Notification] Telegram dispatch warning:', e.message));
        }

        // 3. Email Notification (for individual targeted users)
        if (prefs.email_enabled !== false && recipient.email && recipient.email.includes('@') && !targetRole) {
          const emailSubject = `${title} — Academia-Industry Platform`;
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"/></head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="background: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
                  <h2 style="margin: 0; font-size: 20px; font-weight: 800;">${title}</h2>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">SIH26044 Academia–Industry Platform</p>
                </div>
                <div style="padding: 28px; color: #334155; line-height: 1.6;">
                  <p style="margin-top: 0;">Hello <strong>${recipient.full_name || 'User'}</strong>,</p>
                  <div style="background: #f1f5f9; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 8px; font-size: 14px; color: #0f172a; margin: 20px 0;">
                    ${message}
                  </div>
                  ${metadata ? `<div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; margin: 20px 0; font-size: 13px;">${Object.entries(metadata).map(([k, v]) => `<div style="margin: 4px 0;"><strong>${k}:</strong> ${v}</div>`).join('')}</div>` : ''}
                  <div style="margin-top: 24px; text-align: center;">
                    <a href="${portalUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 8px;">Open Platform</a>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `;
          dispatchEmailThroughPool(
            recipient.email,
            recipient.full_name || 'User',
            emailSubject,
            emailHtml,
            'VSBEC IT Department'
          ).catch((e: any) => console.warn('[Notification] Email dispatch warning:', e.message));
        }
      }
    } catch (err: any) {
      console.error('[NotificationService Error]:', err.message);
    }
  });
}
