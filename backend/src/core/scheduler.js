import { dbAll, dbRun } from '#@/core/database.js';
import { writeAuditLog } from '#@/core/audit.js';

export function startInternshipExpiryScheduler() {
  const checkExpiry = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      // Fetch all active interns whose internship_end_date is set and in the past
      const expiredInterns = await dbAll(
        "SELECT id, name, email FROM users WHERE role = 'Intern' AND status = 'active' AND internship_end_date IS NOT NULL AND internship_end_date < ?",
        [today]
      );
      
      for (const intern of expiredInterns) {
        await dbRun("UPDATE users SET status = 'blocked' WHERE id = ?", [intern.id]);
        await writeAuditLog(
          intern.id, 
          'Account Expired', 
          `Intern account automatically disabled past the end date: ${today}`
        );
        console.log(`[Scheduler] Auto-disabled expired intern account: ${intern.email}`);
      }
    } catch (err) {
      console.error('[Scheduler Error] Internship expiry check failed:', err.message);
    }
  };

  // Run immediately on boot
  checkExpiry();
  // Check every hour (3600000ms)
  setInterval(checkExpiry, 3600000);
}
