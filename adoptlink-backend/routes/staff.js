// backend/routes/staff.js
const express = require('express');
const router = express.Router();
router.use((req, res, next) => {
  console.log("📍 Staff route hit:", req.method, req.url);
  next();
});
const mysql = require('mysql2/promise');
require('dotenv').config();

// ✅ Database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'achhuachhu05',
  database: process.env.DB_NAME || 'adoptlink'
});

// ✅ Fetch all staff (for admin dashboard)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, u.name, u.email, u.phone, s.role, s.department, s.status
      FROM staff s
      JOIN users u ON s.user_id = u.id
      WHERE u.role = 'staff'
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching staff:', err);
    res.status(500).json({ success: false, message: 'Database error while fetching staff' });
  }
});


// ✅ Add new staff (from admin dashboard)
// ✅ Add new staff (from admin dashboard)
// ✅ Add new staff (from admin dashboard)
router.post('/add', async (req, res) => {
  console.log("📩 Received staff payload:", req.body);

  try {
    const { name, email, phone, role, department } = req.body;
    if (!name || !email) {
      console.log("❌ Missing name or email");
      return res.status(400).json({ success: false, message: 'Name and Email required' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log("⚠️ Duplicate email found:", email);
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    console.log("🟢 Inserting into users...");
    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, password, role, phone, status)
       VALUES (?, ?, ?, 'staff', ?, 'verified')`,
      [name, email, 'staff123', phone || '']
    );
    console.log("✅ Inserted user:", userResult.insertId);

    console.log("🟢 Inserting into staff...");
    await connection.query(
      `INSERT INTO staff (user_id, role, department, status)
       VALUES (?, ?, ?, 'Active')`,
      [userResult.insertId, role || 'Case Worker', department || 'Adoption Services']
    );

    await connection.commit();
    connection.release();
    console.log("✅ Staff successfully added!");

    res.json({ success: true, message: 'Staff member added successfully!' });

  } catch (err) {
    console.error("❌ Error adding staff:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;
