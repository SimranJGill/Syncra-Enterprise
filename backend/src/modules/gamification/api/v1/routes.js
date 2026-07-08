import express from 'express';
import { dbAll, dbGet, dbRun } from '#@/core/database.js';
import { authenticateToken } from '#@/core/middleware/auth.js';

const router = express.Router();

// GET my gamification profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    let emp = await dbGet('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
    if (!emp) {
      const empIns = await dbRun(
        'INSERT INTO employees (user_id, employee_id, joining_date, status) VALUES (?, ?, CURRENT_DATE, "Active")',
        [req.user.id, `EMP_${req.user.id}`]
      );
      emp = { id: empIns.id };
    }

    let profile = await dbGet('SELECT * FROM gamification_profiles WHERE employee_id = ?', [emp.id]);
    if (!profile) {
      const dummyBadges = JSON.stringify(['welcome_badge']);
      const dummyStreaks = JSON.stringify({ attendance: 1 });
      await dbRun(
        'INSERT INTO gamification_profiles (employee_id, level, total_xp, badges, streaks, kudos_received, kudos_given) VALUES (?, 1, 100, ?, ?, 0, 0)',
        [emp.id, dummyBadges, dummyStreaks]
      );
      profile = {
        employee_id: emp.id,
        level: 1,
        total_xp: 100,
        badges: dummyBadges,
        streaks: dummyStreaks,
        kudos_received: 0,
        kudos_given: 0
      };
    }

    res.status(200).json({
      profile: {
        ...profile,
        badges: JSON.parse(profile.badges || '[]'),
        streaks: JSON.parse(profile.streaks || '{}')
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST peer kudos points
router.post('/kudos', authenticateToken, async (req, res) => {
  const { toEmployeeId, message, points } = req.body;
  try {
    const fromEmp = await dbGet('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
    if (!fromEmp) {
      return res.status(404).json({ error: 'Sender employee profile not found.' });
    }

    if (fromEmp.id === parseInt(toEmployeeId)) {
      return res.status(400).json({ error: 'You cannot send kudos points to yourself.' });
    }

    // Record kudos transaction
    await dbRun(
      'INSERT INTO kudos (from_employee_id, to_employee_id, message, points) VALUES (?, ?, ?, ?)',
      [fromEmp.id, toEmployeeId, message, points || 10]
    );

    // Update recipient level and total XP
    const rewardXP = (points || 10) * 15;
    await dbRun(
      `INSERT INTO gamification_profiles (employee_id, level, total_xp, badges, streaks, kudos_received, kudos_given)
       VALUES (?, 1, ?, '[]', '{}', 1, 0)
       ON CONFLICT(employee_id) DO UPDATE SET 
         total_xp = total_xp + excluded.total_xp,
         kudos_received = kudos_received + 1,
         level = (total_xp + excluded.total_xp) / 500 + 1`,
      [toEmployeeId, rewardXP]
    );

    // Update sender transaction count
    await dbRun(
      `INSERT INTO gamification_profiles (employee_id, level, total_xp, badges, streaks, kudos_received, kudos_given)
       VALUES (?, 1, 50, '[]', '{}', 0, 1)
       ON CONFLICT(employee_id) DO UPDATE SET 
         total_xp = total_xp + 50,
         kudos_given = kudos_given + 1`,
      [fromEmp.id]
    );

    res.status(200).json({ message: 'Kudos successfully gifted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET department leaderboard ranking
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const list = await dbAll(`
      SELECT gp.level, gp.total_xp, u.name as employee_name
      FROM gamification_profiles gp
      JOIN employees e ON gp.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ORDER BY gp.total_xp DESC LIMIT 10
    `);
    res.status(200).json({ leaderboard: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
