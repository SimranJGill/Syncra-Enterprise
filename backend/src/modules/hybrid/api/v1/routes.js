import express from 'express';
import { dbAll, dbGet, dbRun } from '#@/core/database.js';
import { authenticateToken } from '#@/core/middleware/auth.js';

const router = express.Router();

// GET office floor map and booked status
router.get('/offices/:id/floors', authenticateToken, async (req, res) => {
  try {
    let floors = await dbAll('SELECT * FROM office_floors WHERE location_id = ?', [req.params.id]);
    if (floors.length === 0) {
      // Seed initial dummy floor desks coordinates for visualization
      const dummyDesks = JSON.stringify([
        { deskId: 'Desk 1', x: 50, y: 50, status: 'available' },
        { deskId: 'Desk 2', x: 120, y: 50, status: 'available' },
        { deskId: 'Desk 3', x: 190, y: 50, status: 'occupied', employeeId: 2 },
        { deskId: 'Desk 4', x: 50, y: 150, status: 'available' },
        { deskId: 'Desk 5', x: 120, y: 150, status: 'available' }
      ]);
      await dbRun(
        'INSERT INTO office_floors (floor_name, location_id, desks) VALUES ("Main Engineering Floor", ?, ?)',
        [req.params.id, dummyDesks]
      );
      floors = [{ id: 1, floor_name: 'Main Engineering Floor', location_id: req.params.id, desks: dummyDesks }];
    }

    res.status(200).json({
      floors: floors.map(f => ({
        ...f,
        desks: JSON.parse(f.desks)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST book desk
router.post('/desk-bookings', authenticateToken, async (req, res) => {
  const { employeeId, deskId, date, floorId } = req.body;
  try {
    // 1. Check double bookings
    const existing = await dbGet('SELECT * FROM desk_bookings WHERE employee_id = ? AND date = ?', [employeeId, date]);
    if (existing) {
      return res.status(400).json({ error: 'You have already booked a desk for this date.' });
    }

    // 2. Insert booking
    await dbRun(
      'INSERT INTO desk_bookings (employee_id, desk_id, date, clock_in) VALUES (?, ?, ?, "09:00")',
      [employeeId, deskId, date]
    );

    // 3. Update floor plan desk status dynamically
    const floor = await dbGet('SELECT * FROM office_floors WHERE id = ?', [floorId]);
    if (floor) {
      const desksList = JSON.parse(floor.desks);
      const deskObj = desksList.find(d => d.deskId === deskId);
      if (deskObj) {
        deskObj.status = 'occupied';
        deskObj.employeeId = employeeId;
        await dbRun(
          'UPDATE office_floors SET desks = ? WHERE id = ?',
          [JSON.stringify(desksList), floorId]
        );
      }
    }

    res.status(200).json({ message: 'Desk booked successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
