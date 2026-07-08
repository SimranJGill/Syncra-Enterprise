import express from 'express';
import { dbAll, dbGet, dbRun } from '#@/core/database.js';
import { authenticateToken } from '#@/core/middleware/auth.js';

const router = express.Router();

// GET all skills
router.get('/', authenticateToken, async (req, res) => {
  try {
    const list = await dbAll('SELECT * FROM skills ORDER BY skill_name ASC');
    res.status(200).json({ skills: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET specific employee skills
router.get('/employee/:id', authenticateToken, async (req, res) => {
  try {
    const list = await dbAll(
      `SELECT es.*, s.skill_name, s.category 
       FROM employee_skills es
       JOIN skills s ON es.skill_id = s.id
       WHERE es.employee_id = ?`,
      [req.params.id]
    );
    res.status(200).json({ employeeSkills: list.map(item => ({ ...item, endorsed_by: JSON.parse(item.endorsed_by || '[]') })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add/update skill for employee
router.post('/employee/:id', authenticateToken, async (req, res) => {
  const { skillName, category, proficiency } = req.body;
  try {
    // Check or insert skill in global list
    let skill = await dbGet('SELECT * FROM skills WHERE normalized_name = ?', [skillName.toLowerCase().replace(/\s+/g, '')]);
    if (!skill) {
      const ins = await dbRun(
        'INSERT INTO skills (skill_name, category, normalized_name) VALUES (?, ?, ?)',
        [skillName, category || 'Frontend', skillName.toLowerCase().replace(/\s+/g, '')]
      );
      skill = { id: ins.id };
    }

    await dbRun(
      `INSERT INTO employee_skills (employee_id, skill_id, proficiency, source, endorsed_by)
       VALUES (?, ?, ?, 'self_assessed', '[]')
       ON CONFLICT(employee_id, skill_id) DO UPDATE SET proficiency = excluded.proficiency, last_updated = CURRENT_TIMESTAMP`,
      [req.params.id, skill.id, proficiency]
    );

    res.status(200).json({ message: 'Skill successfully updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST endorsement
router.post('/employee/:id/endorse', authenticateToken, async (req, res) => {
  const { skillId, endorserEmployeeId } = req.body;
  try {
    const record = await dbGet('SELECT * FROM employee_skills WHERE employee_id = ? AND skill_id = ?', [req.params.id, skillId]);
    if (!record) {
      return res.status(404).json({ error: 'Employee skill not found.' });
    }

    const endorsers = JSON.parse(record.endorsed_by || '[]');
    if (!endorsers.includes(endorserEmployeeId)) {
      endorsers.push(endorserEmployeeId);
      await dbRun(
        'UPDATE employee_skills SET endorsed_by = ?, source = "endorsed" WHERE employee_id = ? AND skill_id = ?',
        [JSON.stringify(endorsers), req.params.id, skillId]
      );
    }

    res.status(200).json({ message: 'Skill successfully endorsed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET department skill coverage heatmap matrix
router.get('/departments/:id/heatmap', authenticateToken, async (req, res) => {
  try {
    const matrix = await dbAll(
      `SELECT es.proficiency, s.skill_name, u.name as employee_name
       FROM employee_skills es
       JOIN skills s ON es.skill_id = s.id
       JOIN employees e ON es.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE e.department_id = ?`,
      [req.params.id]
    );
    res.status(200).json({ heatmap: matrix });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET open gigs
router.get('/gigs', authenticateToken, async (req, res) => {
  try {
    const list = await dbAll('SELECT * FROM gig_marketplace ORDER BY created_at DESC');
    res.status(200).json({ gigs: list.map(g => ({ ...g, required_skills: JSON.parse(g.required_skills), bids: JSON.parse(g.bids || '[]') })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new gig
router.post('/gigs', authenticateToken, async (req, res) => {
  const { title, description, requiredSkills, estimatedHours, postedBy, departmentId } = req.body;
  try {
    await dbRun(
      'INSERT INTO gig_marketplace (title, description, required_skills, estimated_hours, posted_by, department_id, bids, status) VALUES (?, ?, ?, ?, ?, ?, "[]", "open")',
      [title, description, JSON.stringify(requiredSkills || []), estimatedHours, postedBy, departmentId]
    );
    res.status(201).json({ message: 'Gig posted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST bid on gig
router.post('/gigs/:id/bid', authenticateToken, async (req, res) => {
  const { employeeId, proposedHours, message } = req.body;
  try {
    const gig = await dbGet('SELECT * FROM gig_marketplace WHERE id = ?', [req.params.id]);
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found.' });
    }

    const bids = JSON.parse(gig.bids || '[]');
    bids.push({ employeeId, proposedHours, message, bidDate: new Date().toISOString() });

    await dbRun(
      'UPDATE gig_marketplace SET bids = ? WHERE id = ?',
      [JSON.stringify(bids), req.params.id]
    );
    res.status(200).json({ message: 'Bid submitted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
