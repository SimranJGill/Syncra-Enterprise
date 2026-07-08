import express from 'express';
import { dbAll, dbGet, dbRun } from '#@/core/database';
import { authenticateToken } from '#@/core/middleware/auth';

const router = express.Router();

// Raise a Help Desk ticket (Category Auto-Routing links asset automatically if asset issue)
router.post('/', authenticateToken, async (req, res) => {
  const { category, subject, description, priority, linkedAssetId } = req.body;
  if (!category || !subject) {
    return res.status(400).json({ error: 'Category and subject are required.' });
  }

  try {
    let finalAssetId = linkedAssetId || null;

    // Auto-route linkage if employee has assigned asset and category is "Asset issue"
    if (!finalAssetId && category === 'Asset issue') {
      const emp = await dbGet('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
      if (emp) {
        const asset = await dbGet('SELECT id FROM assets WHERE assigned_to = ? LIMIT 1', [emp.id]);
        if (asset) {
          finalAssetId = asset.id;
        }
      }
    }

    const result = await dbRun(
      `INSERT INTO tickets (raised_by, category, subject, description, priority, status, assigned_to, linked_asset_id)
       VALUES (?, ?, ?, ?, ?, 'Open', NULL, ?)`,
      [req.user.id, category, subject, description, priority || 'Medium', finalAssetId]
    );

    res.status(201).json({ message: 'Ticket raised successfully.', ticketId: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET personal tickets (Self-Service)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const tickets = await dbAll(`
      SELECT t.*, a.name as asset_name 
      FROM tickets t
      LEFT JOIN assets a ON t.linked_asset_id = a.id
      WHERE t.raised_by = ?
      ORDER BY t.created_at DESC
    `, [req.user.id]);
    res.status(200).json({ tickets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET IT Queue (IT Admin / HR view - Oldest unresolved first)
router.get('/queue', authenticateToken, async (req, res) => {
  try {
    const tickets = await dbAll(`
      SELECT t.*, u.name as raised_by_name, a.name as asset_name 
      FROM tickets t
      JOIN users u ON t.raised_by = u.id
      LEFT JOIN assets a ON t.linked_asset_id = a.id
      WHERE t.status != 'Closed' AND t.status != 'Resolved'
      ORDER BY t.created_at ASC
    `);
    res.status(200).json({ tickets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const ticket = await dbGet(`
      SELECT t.*, u.name as raised_by_name, a.name as asset_name 
      FROM tickets t
      JOIN users u ON t.raised_by = u.id
      LEFT JOIN assets a ON t.linked_asset_id = a.id
      WHERE t.id = ?
    `, [req.params.id]);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    res.status(200).json({ ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update status or assignee
router.put('/:id', authenticateToken, async (req, res) => {
  const { status, assignedTo } = req.body;
  try {
    const ticket = await dbGet('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

    await dbRun(
      'UPDATE tickets SET status = ?, assigned_to = ? WHERE id = ?',
      [status || ticket.status, assignedTo !== undefined ? assignedTo : ticket.assigned_to, req.params.id]
    );

    res.status(200).json({ message: 'Ticket updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thread Comments
router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const comments = await dbAll(`
      SELECT tc.*, u.name as user_name 
      FROM ticket_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.ticket_id = ?
      ORDER BY tc.created_at ASC
    `, [req.params.id]);
    res.status(200).json({ comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/comments', authenticateToken, async (req, res) => {
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ error: 'Comment content is required.' });
  try {
    await dbRun(
      'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, comment]
    );
    res.status(201).json({ message: 'Comment posted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
