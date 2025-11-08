const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { pool } = require('../config/database');

const router = express.Router();

// Request reschedule
router.post('/reschedule', auth, authorize('parent'), async (req, res) => {
  try {
    const { visitId, requestedDate, reason } = req.body;

    // Get parent id
    const [parents] = await pool.execute(
      'SELECT id FROM parents WHERE user_id = ?',
      [req.user.id]
    );

    if (parents.length === 0) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    const parentId = parents[0].id;

    // Check if visit belongs to parent
    const [visits] = await pool.execute(
      'SELECT * FROM visits WHERE id = ? AND parent_id = ?',
      [visitId, parentId]
    );

    if (visits.length === 0) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    // Insert reschedule request
    const [result] = await pool.execute(
      `INSERT INTO reschedule_requests (visit_id, requested_date, reason, status) 
       VALUES (?, ?, ?, ?)`,
      [visitId, requestedDate, reason, 'pending']
    );

    res.json({ 
      success: true, 
      message: 'Reschedule request submitted successfully' 
    });
  } catch (err) {
    console.error('Reschedule error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get scheduled visits for parent
router.get('/parent', auth, authorize('parent'), async (req, res) => {
  try {
    const [parents] = await pool.execute(
      'SELECT id FROM parents WHERE user_id = ?',
      [req.user.id]
    );

    if (parents.length === 0) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    const parentId = parents[0].id;

    const [visits] = await pool.execute(
      `SELECT v.*, u.name as staff_name, u.email as staff_email 
       FROM visits v 
       LEFT JOIN users u ON v.staff_id = u.id 
       WHERE v.parent_id = ? 
       ORDER BY v.scheduled_date DESC`,
      [parentId]
    );

    res.json({ 
      success: true, 
      data: visits 
    });
  } catch (err) {
    console.error('Get visits error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;