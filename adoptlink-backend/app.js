const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database initialization
const { initDatabase } = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database and then start server
initDatabase().then(() => {
  console.log('Database initialized, setting up routes...');
  
  // Import routes after database is initialized
  const authRoutes = require('./routes/auth');
  const parentRoutes = require('./routes/parents');
  const staffRoutes = require('./routes/staff');
  const adminRoutes = require('./routes/admin');
  const visitRoutes = require('./routes/visits');

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/parents', parentRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/visits', visitRoutes);

  // Test route
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Test the API: http://localhost:${PORT}/api/test`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});