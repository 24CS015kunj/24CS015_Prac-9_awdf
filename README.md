# Practical 9: In-Memory Caching and Query Optimization

**Course:** Advanced Web Development Frameworks (ITUE301)  
**Institution:** CHAROTAR UNIVERSITY OF SCIENCE AND TECHNOLOGY (CHARUSAT)  
**Faculty of Technology and Engineering** — B. Tech (IT/CE/CSE/AIML)

---

## 📌 Objective
To implement server-side in-memory caching using `node-cache` in a Node.js/Express/MongoDB Task Management API and measure its empirical impact on API response times.

---

## 🏗️ Architecture & Caching Workflow

```text
       GET /tasks (or /tasks/:id) Request
                     │
                     ▼
          ┌──────────────────────┐
          │     node-cache       │
          └──────────┬───────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
       [ HIT ]               [ MISS ]
          │                     │
          ▼                     ▼
 Return cached data      Query MongoDB
    immediately          Database
 (Response: ~1-3ms)             │
                         Save in node-cache
                         (TTL: 60 seconds)
                                │
                                ▼
                         Return response
                       (Response: ~40-80ms)

----------------------------------------------------

        POST / PUT / DELETE /tasks Request
                     │
                     ▼
          Write / Update in MongoDB
                     │
                     ▼
          Invalidate Cache Keys
  (cache.del('all_tasks') & cache.del(`task_${id}`))
```

---

## 🚀 Setup & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskmanager
```

### 3. (Optional) Seed Sample Tasks
Populate sample tasks to test caching with realistic data:
```bash
npm run seed
```

### 4. Run the Server
```bash
# Production mode
npm start

# Development mode (auto-restart)
npm run dev
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Cache Behavior |
|---|---|---|---|
| `GET` | `/tasks` | Retrieve all tasks | Cached for 60s (`X-Cache: HIT/MISS`) |
| `GET` | `/tasks/:id` | Retrieve single task | Cached per ID for 60s |
| `GET` | `/cache/stats` | View cache hit/miss stats | Real-time cache performance metrics |
| `POST` | `/tasks` | Create a new task | Invalidates `all_tasks` cache |
| `PUT` | `/tasks/:id` | Update an existing task | Invalidates `all_tasks` and `task_${id}` |
| `DELETE` | `/tasks/:id` | Delete a task | Invalidates `all_tasks` and `task_${id}` |

---
