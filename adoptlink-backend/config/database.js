const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'adoptlink',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database tables
const initDatabase = async () => {
  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    
    // Drop and recreate database to ensure clean state
    await connection.execute(`DROP DATABASE IF EXISTS ${process.env.DB_NAME || 'adoptlink'}`);
    await connection.execute(`CREATE DATABASE ${process.env.DB_NAME || 'adoptlink'}`);
    await connection.end();

    console.log('Database created successfully');

    // Users table
    await pool.execute(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('parent', 'staff', 'admin') NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        status ENUM('pending', 'verified', 'approved', 'rejected') DEFAULT 'pending',
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Parents table
    await pool.execute(`
      CREATE TABLE parents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        marital_status VARCHAR(50),
        spouse_name VARCHAR(255),
        children_count INT DEFAULT 0,
        occupation VARCHAR(255),
        annual_income DECIMAL(12,2),
        home_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Children table
    await pool.execute(`
      CREATE TABLE children (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        gender ENUM('male', 'female', 'other'),
        background TEXT,
        photo VARCHAR(500),
        placement_date DATE,
        adoption_date DATE,
        status ENUM('placed', 'adopted') DEFAULT 'placed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
      )
    `);

    // Documents table
    await pool.execute(`
      CREATE TABLE documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT NOT NULL,
        type ENUM('id_proof', 'address_proof', 'income_proof', 'background_check') NOT NULL,
        file_name VARCHAR(255),
        file_path VARCHAR(500),
        status ENUM('pending', 'uploaded', 'verified', 'rejected') DEFAULT 'pending',
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
      )
    `);

    // Health records table
    await pool.execute(`
      CREATE TABLE health_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        child_id INT NOT NULL,
        record_date DATE NOT NULL,
        \`condition\` VARCHAR(500) NOT NULL,
        treatment TEXT,
        doctor VARCHAR(255),
        status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
      )
    `);

    // Visits table
    await pool.execute(`
      CREATE TABLE visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT NOT NULL,
        type ENUM('home_visit', 'follow_up') NOT NULL,
        scheduled_date DATETIME NOT NULL,
        staff_id INT,
        purpose TEXT,
        status ENUM('scheduled', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
        FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Reschedule requests table
    await pool.execute(`
      CREATE TABLE reschedule_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        visit_id INT NOT NULL,
        requested_date DATETIME NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
      )
    `);

    // Academic records table
    await pool.execute(`
      CREATE TABLE academic_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        child_id INT NOT NULL,
        subject VARCHAR(255) NOT NULL,
        grade VARCHAR(10),
        teacher_comments TEXT,
        record_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
      )
    `);

    // Activities table
    await pool.execute(`
      CREATE TABLE activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        child_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        schedule VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
      )
    `);

    // Create initial admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await pool.execute(
      `INSERT INTO users (name, email, password, role, status) 
       VALUES (?, ?, ?, ?, ?)`,
      ['Admin User', 'admin@adoptlink.com', hashedPassword, 'admin', 'approved']
    );

    console.log('Initial admin user created');
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

module.exports = { pool, initDatabase };