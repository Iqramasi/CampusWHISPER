

const express = require('express');
const redis = require('redis');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const POST_SERVICE = process.env.POST_SERVICE_URL || 'http://post-service:3002';
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect().catch(console.error);

const fetchPosts = async ({ college, limit = 50 }) => {
  const { data } = await axios.get(`${POST_SERVICE}/`, {
    params: {
      limit,
      ...(college ? { college } : {})
    }
  });
  return Array.isArray(data?.posts) ? data.posts : [];
};

app.get('/trending', async (req, res) => {
  try {
    const { college } = req.query;
    const cacheKey = `trending:${college || 'global'}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) return res.json(JSON.parse(cached));

    const posts = await fetchPosts({ college, limit: 50 });
    const sorted = posts
      .sort(
        (a, b) =>
          (b.likes_count || b.likes?.length || b.likes || 0) -
          (a.likes_count || a.likes?.length || a.likes || 0)
      )
      .slice(0, 10);

    await redisClient.setEx(cacheKey, 120, JSON.stringify(sorted));
    res.json(sorted);
  } catch (err) {
    console.error('TRENDING ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch trending posts' });
  }
});

app.get('/stream', async (req, res) => {
  try {
    const { college, limit = 20 } = req.query;
    const posts = await fetchPosts({ college, limit });
    res.json({ posts });
  } catch (err) {
    console.error('STREAM ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch stream' });
  }
});

app.get('/stats', async (_req, res) => {
  try {
    const keys = await redisClient.keys('trending:*');
    res.json({ keys });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'feed-service' });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Feed service running on :${PORT}`);
});