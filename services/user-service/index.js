

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors());



const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});






const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// DEBUG
app.use((req, res, next) => {
  console.log('👉 USER SERVICE HIT:', req.method, req.url);
  next();
});




// user-service index.js
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT,
        email TEXT UNIQUE,
        password TEXT,
        college TEXT DEFAULT 'global'
      )
    `);
    console.log('✅ Users table ready');
  } catch (err) {
    console.error('❌ DB INIT FAILED:', err.message);
    // Don't crash — service stays up, requests will fail gracefully
  }
})();













// REGISTER
app.post('/register', async (req, res) => {
  try {
    const { username, email, password, college } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password, college)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [username, email, hashed, college || 'global']
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: String(user.id), username: user.username },
      JWT_SECRET
    );

    res.json({
      user: {
        id: String(user.id),
        username: user.username,
        email: user.email,
        college: user.college
      },
      token
    });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE email=$1',
      [email]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign(
      { id: String(user.id), username: user.username },
      JWT_SECRET
    );

    res.json({
      user: {
        id: String(user.id),
        username: user.username,
        email: user.email,
        college: user.college
      },
      token
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HEALTH
app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

app.listen(3001, '0.0.0.0', () => {
  console.log('🚀 User Service running on 3001');
});