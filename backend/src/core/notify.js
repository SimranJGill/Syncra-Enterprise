import { dbRun, dbGet } from '#@/core/database.js';
import { getIo } from '#@/core/socket.js';
import { logSimulatedEmail } from '#@/core/email.js';

export const notify = async (userId, type, title, message, linkTo = null) => {
  try {
    // 1. Fetch preferences
    let prefs = await dbGet('SELECT * FROM notification_preferences WHERE user_id = ?', [userId]);
    if (!prefs) {
      await dbRun('INSERT OR IGNORE INTO notification_preferences (user_id, email_enabled, in_app_enabled) VALUES (?, 1, 1)', [userId]);
      prefs = { email_enabled: 1, in_app_enabled: 1 };
    }

    // 2. Store & socket emit in-app notification
    if (prefs.in_app_enabled) {
      const result = await dbRun(
        'INSERT INTO notifications (user_id, type, title, message, link_to, read) VALUES (?, ?, ?, ?, ?, 0)',
        [userId, type, title, message, linkTo]
      );

      const io = getIo();
      if (io) {
        const roomName = `user_${userId}`;
        io.to(roomName).emit('notification', {
          id: result.id,
          type,
          title,
          message,
          link_to: linkTo,
          read: 0,
          created_at: new Date().toISOString()
        });
      }
    }

    // 3. Dispatch simulated/real email
    if (prefs.email_enabled) {
      const user = await dbGet('SELECT email FROM users WHERE id = ?', [userId]);
      if (user && user.email) {
        await logSimulatedEmail(user.email, title, message, type);
      }
    }
  } catch (err) {
    console.error('[Notify Error]', err.message);
  }
};
