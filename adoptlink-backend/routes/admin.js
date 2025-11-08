// admin.js (backend route)
const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [totalParents] = await pool.execute('SELECT COUNT(*) as count FROM parents');
    const [totalChildren] = await pool.execute('SELECT COUNT(*) as count FROM children');
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
