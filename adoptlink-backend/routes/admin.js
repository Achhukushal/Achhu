const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { pool } = require('../config/database');

const router = express.Router();

// Admin dashboard
router.get('/dashboard', auth, authorize('admin'), async (req, res) => {
  try {
    // Get total users count
    const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
    // Get total parents count
    const [totalParents] = await pool.execute('SELECT COUNT(*) as count FROM parents');
    
    // Get total children count
    const [totalChildren] = await pool.execute('SELECT COUNT(*) as count FROM children');
    
    // Get pending verifications
    const [pendingVerifications] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE status = "pending"'
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: totalUsers[0].count,
          totalParents: totalParents[0].count,
          totalChildren: totalChildren[0].count,
          pendingVerifications: pendingVerifications[0].count
        }
      }
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;