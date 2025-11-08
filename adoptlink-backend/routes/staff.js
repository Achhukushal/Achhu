const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { pool } = require('../config/database');

const router = express.Router();

// Staff dashboard
router.get('/dashboard', auth, authorize('staff'), async (req, res) => {
  try {
    // Get pending verifications count
    const [pendingVerifications] = await pool.execute(
      `SELECT COUNT(*) as count FROM users u 
       JOIN parents p ON u.id = p.user_id 
       WHERE u.status = 'pending'`
    );

    // Get scheduled visits count
    const [scheduledVisits] = await pool.execute(
      `SELECT COUNT(*) as count FROM visits 
       WHERE status = 'scheduled' AND staff_id = ?`,
      [req.user.id]
    );

    // Get pending documents count
    const [pendingDocuments] = await pool.execute(
      `SELECT COUNT(*) as count FROM documents 
       WHERE status = 'uploaded'`
    );

    res.json({
      success: true,
      data: {
        stats: {
          pendingVerifications: pendingVerifications[0].count,
          scheduledVisits: scheduledVisits[0].count,
          pendingDocuments: pendingDocuments[0].count
        }
      }
    });
  } catch (err) {
    console.error('Staff dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;