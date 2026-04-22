

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});


const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// AUTH
const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = auth.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};





(async () => {
  try {
    // ❌ REMOVE EXTENSION (IMPORTANT)
    // await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        topic VARCHAR(100) DEFAULT 'General',
        college VARCHAR(100) DEFAULT 'global',
        likes INT DEFAULT 0,
        author_id TEXT,
        is_anonymous BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        author_id TEXT,
        username TEXT,
        is_anonymous BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id TEXT,
        UNIQUE(post_id, user_id)
      );
    `);

    console.log("✅ Post DB ready");

  } catch (err) {
    console.error("❌ DB INIT FAILED:", err.message);
    // IMPORTANT: DO NOT CRASH
  }
})();






// GET POSTS
app.get('/', async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM posts ORDER BY created_at DESC LIMIT 20`
  );
  res.json({ posts: result.rows });
});


// CREATE POST
app.post('/', authenticate, async (req, res) => {
  const { content, topic, college } = req.body;

  const result = await pool.query(
    `INSERT INTO posts (content, topic, college, author_id)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [content, topic, college, req.user.id]
  );

  res.json(result.rows[0]);
});


// 🔥 LIKE POST (FIXED)
app.post('/:id/like', authenticate, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  try {
    // check if already liked
    const exists = await pool.query(
      `SELECT * FROM post_likes WHERE post_id=$1 AND user_id=$2`,
      [postId, userId]
    );

    if (exists.rows.length > 0) {
      return res.json({ success: true }); // already liked
    }

    // insert like
    await pool.query(
      `INSERT INTO post_likes (post_id, user_id) VALUES ($1,$2)`,
      [postId, userId]
    );

    // increment count
    await pool.query(
      `UPDATE posts SET likes = likes + 1 WHERE id=$1`,
      [postId]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Like failed' });
  }
});


// 🔥 UNLIKE POST (FIXED)
app.delete('/:id/like', authenticate, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2`,
      [postId, userId]
    );

    if (result.rowCount > 0) {
      await pool.query(
        `UPDATE posts SET likes = GREATEST(likes - 1, 0) WHERE id=$1`,
        [postId]
      );
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unlike failed' });
  }
});


// 🔥 TRENDING
app.get('/trending', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM posts
      ORDER BY likes DESC, created_at DESC
      LIMIT 3
    `);

    res.json({ posts: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Trending failed' });
  }
});


// COMMENTS
app.get('/:id/comments', async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM comments WHERE post_id=$1 ORDER BY created_at ASC`,
    [req.params.id]
  );
  res.json({ comments: result.rows });
});

app.post('/:id/comments', authenticate, async (req, res) => {
  const { content, is_anonymous } = req.body;

  const result = await pool.query(
    `INSERT INTO comments (post_id, content, author_id, username, is_anonymous)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.params.id, content, req.user.id, req.user.username, is_anonymous]
  );

  res.json(result.rows[0]);
});

app.delete('/comments/:id', authenticate, async (req, res) => {
  const result = await pool.query(
    `DELETE FROM comments WHERE id=$1 AND author_id=$2 RETURNING *`,
    [req.params.id, req.user.id]
  );

  if (!result.rowCount) {
    return res.status(403).json({ error: 'Not allowed' });
  }

  res.json({ success: true });
});


// DELETE POST
app.delete('/:id', authenticate, async (req, res) => {
  const result = await pool.query(
    `DELETE FROM posts WHERE id=$1 AND author_id=$2 RETURNING *`,
    [req.params.id, req.user.id]
  );

  if (!result.rowCount) {
    return res.status(403).json({ error: 'Not allowed' });
  }

  res.json({ success: true });
});

// app.listen(3002, () => {
//   console.log('🚀 Post Service running on 3002');
// });




const PORT = process.env.PORT || 3002;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Post Service running on ${PORT}`);
});