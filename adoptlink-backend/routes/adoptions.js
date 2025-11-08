// routes/adoptions.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
require('dotenv').config();

// ✅ MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'achhuachhu05',
  database: process.env.DB_NAME || 'adoptlink'
});

/**
 * ✅ 1. Assign a child to a parent (used when admin clicks "Assign to Parent")
 * 
 * This updates the `children` table by setting the parent_id
 * and marking the child as 'pending' adoption.
 */
router.post('/', async (req, res) => {
  const { child_id, parent_id } = req.body;

  if (!child_id || !parent_id) {
    return res.status(400).json({ success: false, error: 'Missing child_id or parent_id' });
  }

  try {
    const [checkChild] = await db.query('SELECT * FROM children WHERE id = ?', [child_id]);
    const [checkParent] = await db.query('SELECT * FROM parents WHERE id = ?', [parent_id]);

    if (checkChild.length === 0) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }
    if (checkParent.length === 0) {
      return res.status(404).json({ success: false, error: 'Parent not found' });
    }

    // ✅ Link parent and child
    await db.query(
      'UPDATE children SET parent_id = ?, status = "pending" WHERE id = ?',
      [parent_id, child_id]
    );

    res.json({ success: true, message: 'Child successfully assigned to parent' });
  } catch (error) {
    console.error('Error assigning child:', error);
    res.status(500).json({ success: false, error: 'Database error during assignment' });
  }
});

/**
 * ✅ 2. Fetch all adoptions (joins children + parents)
 * 
 * This lets the Admin Dashboard show parent-child mapping info.
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.id AS child_id, 
        c.name AS child_name, 
        c.status AS child_status,
        c.date_of_birth,
        c.gender,
        p.id AS parent_id, 
        p.name AS parent_name,
        p.email AS parent_email,
        p.contact AS parent_contact
      FROM children c
      LEFT JOIN parents p ON c.parent_id = p.id
      ORDER BY c.id ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching adoption records:', error);
    res.status(500).json({ success: false, error: 'Database error while fetching adoptions' });
  }
});

/**
 * ✅ 3. Optional: Approve or reject adoption
 * You can later call this from your dashboard (for example, when verifying).
 */
router.put('/:child_id/status', async (req, res) => {
  const { child_id } = req.params;
  const { status } = req.body; // "adopted" or "placed"

  try {
    await db.query('UPDATE children SET status = ? WHERE id = ?', [status, child_id]);
    res.json({ success: true, message: `Child status updated to ${status}` });
  } catch (error) {
    console.error('Error updating adoption status:', error);
    res.status(500).json({ success: false, error: 'Database error while updating status' });
  }
});

module.exports = router;
