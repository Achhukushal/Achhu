const express = require('express');
const multer = require('multer');
const path = require('path');
const { auth, authorize } = require('../middleware/auth');
const { pool } = require('../config/database');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// Get parent dashboard data
router.get('/dashboard', auth, authorize('parent'), async (req, res) => {
  try {
    // Get parent info
    const [parents] = await pool.execute(
      `SELECT p.*, u.name, u.email, u.phone, u.address, u.status 
       FROM parents p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (parents.length === 0) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    const parent = parents[0];

    // Get children
    const [children] = await pool.execute(
      'SELECT * FROM children WHERE parent_id = ?',
      [parent.id]
    );

    // Get health records count
    const [healthRecords] = await pool.execute(
      `SELECT COUNT(*) as count FROM health_records hr 
       JOIN children c ON hr.child_id = c.id 
       WHERE c.parent_id = ?`,
      [parent.id]
    );

    // Get documents count
    const [documents] = await pool.execute(
      'SELECT COUNT(*) as count FROM documents WHERE parent_id = ?',
      [parent.id]
    );

    // Get scheduled visits count
    const [visits] = await pool.execute(
      'SELECT COUNT(*) as count FROM visits WHERE parent_id = ? AND status = "scheduled"',
      [parent.id]
    );

    res.json({
      success: true,
      data: {
        parent,
        children,
        stats: {
          healthRecords: healthRecords[0].count,
          documents: documents[0].count,
          scheduledVisits: visits[0].count
        },
        recentActivity: []
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update parent profile
router.put('/profile', auth, authorize('parent'), async (req, res) => {
  try {
    const { maritalStatus, spouseName, childrenCount, occupation, annualIncome, homeType } = req.body;

    // Get parent id
    const [parents] = await pool.execute(
      'SELECT id FROM parents WHERE user_id = ?',
      [req.user.id]
    );

    if (parents.length === 0) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    const parentId = parents[0].id;

    // Update parent profile
    await pool.execute(
      `UPDATE parents 
       SET marital_status = ?, spouse_name = ?, children_count = ?, occupation = ?, annual_income = ?, home_type = ?
       WHERE id = ?`,
      [maritalStatus, spouseName, childrenCount, occupation, annualIncome, homeType, parentId]
    );

    // Get updated parent data
    const [updatedParents] = await pool.execute(
      `SELECT p.*, u.name, u.email, u.phone, u.address, u.status 
       FROM parents p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.id = ?`,
      [parentId]
    );

    res.json({ 
      success: true, 
      data: updatedParents[0] 
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload document
router.post('/documents', auth, authorize('parent'), upload.single('document'), async (req, res) => {
  try {
    const { type } = req.body;
    
    // Get parent id
    const [parents] = await pool.execute(
      'SELECT id FROM parents WHERE user_id = ?',
      [req.user.id]
    );

    if (parents.length === 0) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    const parentId = parents[0].id;

    const [result] = await pool.execute(
      `INSERT INTO documents (parent_id, type, file_name, file_path, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [parentId, type, req.file.originalname, req.file.path, 'uploaded']
    );

    const [document] = await pool.execute(
      'SELECT * FROM documents WHERE id = ?',
      [result.insertId]
    );

    res.json({ 
      success: true, 
      data: document[0] 
    });
  } catch (err) {
    console.error('Upload document error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get child information
router.get('/child', auth, authorize('parent'), async (req, res) => {
  try {
    const [parents] = await pool.execute(
      'SELECT id FROM parents WHERE user_id = ?',
      [req.user.id]
    );

    if (parents.length === 0) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    const parentId = parents[0].id;

    const [children] = await pool.execute(
      'SELECT * FROM children WHERE parent_id = ?',
      [parentId]
    );

    res.json({ 
      success: true, 
      data: children[0] || null 
    });
  } catch (err) {
    console.error('Get child error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;