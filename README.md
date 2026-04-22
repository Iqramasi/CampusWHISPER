# 👻 CampusWhisper

> A location-based anonymous social platform for colleges.  
> Built with Next.js · Node.js · PostgreSQL · Redis · Kafka · Docker · Kubernetes

---

## Architecture

```
Browser (Next.js)
      ↓
API Gateway  :3000       ← rate limiting, routing
      ↓
┌─────────────────────────────────┐
│  user-service  :3001            │  JWT auth, registration
│  post-service  :3002            │  CRUD posts, likes, comments
│  feed-service  :3003            │  trending, real-time stream
└─────────────────────────────────┘
      ↓               ↓
PostgreSQL          Redis          ← DB + cache
      ↓
    Kafka                          ← async events (post-created, post-liked)
      ↓
 feed-service (consumer)          ← updates Redis streams
      ↓
Kubernetes + HPA                  ← auto-scaling per service
      ↓
GitHub Actions CI/CD              ← test → build → deploy
```

---

## Quickstart (Local with Docker)

```bash
# Clone the repo
git clone https://github.com/you/campuswhisper.git
cd campuswhisper

# Start everything
docker compose up --build

# Create Kafka topics (in a new terminal, after services start)
chmod +x kafka/setup-topics.sh
./kafka/setup-topics.sh
```

Then open http://localhost (frontend) or hit the API at http://localhost:3000.

---

## API Reference

### Auth
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{username, email, password, college}` | Register |
| POST | `/api/auth/login` | `{email, password}` | Login → JWT |
| POST | `/api/auth/verify` | `{token}` | Verify JWT |

### Posts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts` | No | Get posts (filter by `college`, `location_tag`, `page`) |
| POST | `/api/posts` | ✅ | Create post |
| POST | `/api/posts/:id/like` | ✅ | Like post |
| DELETE | `/api/posts/:id/like` | ✅ | Unlike post |
| GET | `/api/posts/:id/comments` | No | Get comments |
| POST | `/api/posts/:id/comments` | ✅ | Add comment |

### Feed
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feed/trending?college=X` | Top 10 liked posts |
| GET | `/api/feed/stream?college=X` | Real-time stream from Redis |

---

## Environment Variables

Each service uses these env vars (set in `docker-compose.yml` or K8s secrets):

| Variable | Services | Description |
|----------|----------|-------------|
| `DATABASE_URL` | user, post | PostgreSQL connection string |
| `REDIS_URL` | user, post, feed | Redis connection URL |
| `JWT_SECRET` | user | JWT signing secret |
| `KAFKA_BROKERS` | post, feed | Kafka broker address |
| `USER_SERVICE_URL` | post | Internal user-service URL |
| `POST_SERVICE_URL` | feed, gateway | Internal post-service URL |

---

## Kubernetes Deployment

```bash
# Set up secrets first (edit k8s/secrets.yaml with your base64 values)
kubectl apply -f k8s/secrets.yaml

# Deploy services
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/services.yaml

# Check pods
kubectl get pods

# Watch HPA
kubectl get hpa --watch
```

---

## CI/CD (GitHub Actions)

Add these secrets to your GitHub repo:

| Secret | Value |
|--------|-------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `KUBECONFIG` | base64-encoded kubeconfig |

Pipeline on push to `main`:
1. **Test** – runs `npm test` per service
2. **Build** – builds & pushes Docker images with SHA tag
3. **Deploy** – applies K8s manifests + waits for rollout

---

## Kafka Events

| Topic | Producer | Consumer | Payload |
|-------|----------|----------|---------|
| `post-created` | post-service | feed-service | `{post, userId}` |
| `post-liked` | post-service | feed-service | `{postId, userId}` |
| `post-commented` | post-service | feed-service | `{postId, comment}` |

---

## Project Structure

```
campuswhisper/
├── services/
│   ├── api-gateway/       # Express proxy + rate limiting
│   ├── user-service/      # Auth, JWT, user profiles
│   ├── post-service/      # Posts, likes, comments + Kafka
│   └── feed-service/      # Trending, stream, Kafka consumer
├── frontend/              # Next.js 14 app
│   ├── app/               # App router pages
│   ├── components/        # PostCard, CreatePost, AuthModal
│   ├── lib/               # API client (axios)
│   └── store/             # Zustand auth store
├── k8s/                   # Kubernetes YAML manifests
├── kafka/                 # Topic setup scripts
├── .github/workflows/     # CI/CD pipeline
└── docker-compose.yml     # Full local stack
```

---

## What to say in interviews

> "I introduced Kafka to handle asynchronous feed updates — when a post is created, a `post-created` event is published to Kafka. The feed-service consumes it and updates Redis sorted sets, so the feed reads are always O(log n) from cache, never hitting the DB under load."

> "The API Gateway handles rate limiting centrally, so individual services don't need to implement it. Each service scales independently via Kubernetes HPA based on CPU utilization."

> "Redis serves a dual role — LRU cache for feed queries (60s TTL) and a sorted set for real-time streams ordered by timestamp."
