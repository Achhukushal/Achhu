// backend/routes/adminCreate.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// ✅ Database connection
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'achhuachhu05',
  database: process.env.DB_NAME || 'adoptlink'
});

// ✅ Create Admin Account
router.post('/', async (req, res) => {
  console.log("📩 Create Admin payload received:", req.body);

  try {
    const { username, email, password } = req.body;

    // 🧩 Validation
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1️⃣ Check if admin already exists
    const [existing] = await db.query('SELECT * FROM admin WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }

    // 2️⃣ Insert admin
    await db.query(
      'INSERT INTO admin (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    console.log(`✅ New admin created: ${username}`);
    res.json({ success: true, message: 'Admin created successfully' });

  } catch (err) {
    console.error('❌ Error creating admin:', err);
    res.status(500).json({ success: false, message: 'Error creating admin: ' + err.message });
  }
});

module.exports = router;
