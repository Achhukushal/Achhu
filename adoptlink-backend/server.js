// ===============================
// ✅ AdoptLink Backend - server.js
// ===============================

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const adminCreateRoute = require('./routes/adminCreate');
app.use('/api/create-admin', adminCreateRoute);




// ✅ Global Middlewares (MUST come before any routes)
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());                            // <-- parse JSON requests
app.use(express.urlencoded({ extended: true }));    // <-- parse form data

// ===============================
// ✅ MySQL Database Connection
// ===============================
const mysql = require('mysql2');
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'achhuachhu05',
  database: process.env.DB_NAME || 'adoptlink'
});

db.connect(err => {
  if (err) console.log('❌ Database connection failed:', err);
  else console.log('✅ Connected to MySQL database.');
});

// ===============================
// ✅ Import Routes
// ===============================
const staffRoutes = require('./routes/staff');
const adoptionsRoutes = require('./routes/adoptions');
const childrenRoutes = require('./routes/children');
const parentsRoutes = require('./routes/parents');
const adminRoutes = require('./routes/admin');

// ===============================
// ✅ Use Routes
// ===============================
app.use('/api/staff', staffRoutes);
app.use('/api/adoptions', adoptionsRoutes);
app.use('/api/parents', parentsRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/admin', adminRoutes);

// ===============================
// ✅ Admin Login (Temporary)
// ===============================
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM admin WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (results.length > 0)
      res.json({ success: true, message: 'Admin login successful' });
    else
      res.json({ success: false, message: 'Invalid credentials' });
  });
});

// ===============================
// ✅ Root Route
// ===============================
app.get('/', (req, res) => {
  res.send('AdoptLink Backend API is running 🚀');
});

// ===============================
// ✅ Start Server
// ===============================
// Temporary fix for missing routes
app.get('/api/visits', (req, res) => {
  res.json([]); // Return empty list for now
});

app.post('/api/create-admin', (req, res) => {
  res.status(200).json({ success: true, message: 'Admin created (dummy response)' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
