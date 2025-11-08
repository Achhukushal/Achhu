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

// ✅ Add a new child (used by Admin Dashboard)
router.post('/add', async (req, res) => {
  const {
    parent_id,
    name,
    date_of_birth,
    gender,
    background,
    photo,
    placement_date,
    adoption_date,
    status,
    caring_id
  } = req.body;

  try {
    // insert child (allow parent_id to be NULL)
    await db.query(
      `INSERT INTO children 
        (parent_id, caring_id, name, date_of_birth, gender, background, photo, placement_date, adoption_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parent_id || null,
        caring_id || null,
        name,
        date_of_birth,
        gender ? gender.toLowerCase() : null,
        background,
        photo || 'noimage.jpg',
        placement_date || null,
        adoption_date || null,
        status || 'placed'
      ]
    );

    res.json({ success: true, message: 'Child added successfully!' });
  } catch (err) {
    console.error('❌ Error adding child:', err);
    res.status(500).json({
      success: false,
      message: 'Error adding child. ' + (err.sqlMessage || err.message)
    });
  }
});

// ✅ Fetch all children (for Admin "Children Management")
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM children ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching children:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch children.' });
  }
});

// ✅ Fetch children with parent info (for "Adoptions" view)
router.get('/with-parents', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.id AS child_id,
        c.caring_id,
        c.name AS child_name,
        c.gender,
        c.status,
        p.id AS parent_id,
        p.spouse_name,
        p.occupation,
        p.annual_income,
        p.home_type
      FROM children c
      LEFT JOIN parents p ON c.parent_id = p.id
      ORDER BY c.id;
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching children with parents:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch adoption data.' });
  }
});

// ✅ Delete child (optional)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM children WHERE id = ?', [id]);
    res.json({ success: true, message: 'Child deleted successfully.' });
  } catch (err) {
    console.error('❌ Error deleting child:', err);
    res.status(500).json({ success: false, message: 'Failed to delete child.' });
  }
});

module.exports = router;
