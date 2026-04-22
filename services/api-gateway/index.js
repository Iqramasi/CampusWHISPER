

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Docker service names (DO NOT CHANGE if using docker-compose)
const USER_SERVICE = 'http://user-service:3001';
const POST_SERVICE = 'http://post-service:3002';
const FEED_SERVICE = 'http://feed-service:3003';

// 🔥 FIX: forward request body correctly
const proxy = (target, rewrite) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: rewrite,
    proxyTimeout: 10000,
    timeout: 10000,

    onProxyReq(proxyReq, req) {
      if (req.body && Object.keys(req.body).length) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },

    onError(err, req, res) {
      console.error('❌ PROXY ERROR:', err.message);
      res.status(502).json({ error: 'Service unreachable' });
    },
  });

// ROUTES
app.use('/api/auth', proxy(USER_SERVICE, { '^/api/auth': '' }));
app.use('/api/posts', proxy(POST_SERVICE, { '^/api/posts': '' }));
app.use('/api/feed', proxy(FEED_SERVICE, { '^/api/feed': '' }));

// HEALTH
app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'gateway' });
});

app.listen(3000, '0.0.0.0', () => {
  console.log('🚀 API Gateway running on 3000');
});