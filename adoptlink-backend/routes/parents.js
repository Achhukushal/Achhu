const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// ✅ MySQL Connection
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'achhuachhu05',
  database: process.env.DB_NAME || 'adoptlink'
});

// ✅ Fetch all parents (for admin or staff)
// ✅ GET /api/parents
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.id,
        COALESCE(u.name, CONCAT('Parent_', p.id)) AS name,
        u.email AS email,
        COALESCE(u.phone, 'No phone') AS phone,
        p.marital_status,
        p.spouse_name,
        p.children_count,
        p.occupation,
        p.annual_income,
        p.home_type,
        p.created_at
      FROM parents p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.id ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching parents:', err.message);
    res.status(500).json({ error: 'Database error while fetching parents', details: err.message });
  }
});



// ✅ REGISTER Parent (with optional Caring ID link)
router.post('/register', async (req, res) => {
  const {
    name,
    email,
    password,
    contact,
    marital_status,
    spouse_name,
    occupation,
    annual_income,
    home_type,
    caring_id
  } = req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // 1️⃣ Check if email exists
    const [existing] = await conn.query('SELECT * FROM parents WHERE email = ?', [email]);
    if (existing.length > 0) {
      await conn.release();
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // 2️⃣ Hash password
    const hashed = await bcrypt.hash(password, 10);

    // 3️⃣ Insert parent
    const [parentResult] = await conn.query(
      `INSERT INTO parents 
      (name, email, password, contact, marital_status, spouse_name, occupation, annual_income, home_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        hashed,
        contact,
        marital_status || null,
        spouse_name || null,
        occupation || null,
        annual_income || null,
        home_type || null
      ]
    );

    const parentId = parentResult.insertId;

    // 4️⃣ Link parent to child via Caring ID (if provided)
    if (caring_id) {
      const [childRows] = await conn.query('SELECT id, parent_id FROM children WHERE caring_id = ?', [caring_id]);

      if (childRows.length === 0) {
        await conn.rollback();
        await conn.release();
        return res.status(400).json({ success: false, message: 'Invalid Caring ID — no child found.' });
      }

      const child = childRows[0];

      if (child.parent_id) {
        await conn.rollback();
        await conn.release();
        return res.status(400).json({ success: false, message: 'This child is already adopted.' });
      }

      await conn.query('UPDATE children SET parent_id = ? WHERE id = ?', [parentId, child.id]);
    }

    await conn.commit();
    conn.release();

    res.json({ success: true, message: 'Parent registered successfully and linked to child if applicable.' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('❌ Registration error:', err);
    res.status(500).json({ success: false, message: 'Error during registration: ' + err.message });
  }
});


// ✅ LOGIN Parent
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM parents WHERE email = ?', [email]);
    if (rows.length === 0)
      return res.json({ success: false, message: 'User not found' });

    const parent = rows[0];
    const match = await bcrypt.compare(password, parent.password);
    if (!match)
      return res.json({ success: false, message: 'Incorrect password' });

    const token = jwt.sign(
      { id: parent.id, email: parent.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ success: true, token, parent });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});


// ✅ FETCH All Parents (for Admin Dashboard)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.id, p.name, p.email, p.contact,
        p.marital_status, p.spouse_name, p.occupation,
        p.annual_income, p.home_type,
        c.caring_id, c.name AS adopted_child, c.gender, c.status
      FROM parents p
      LEFT JOIN children c ON p.id = c.parent_id
      ORDER BY p.id;
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching parents:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch parents data' });
  }
});

module.exports = router;
