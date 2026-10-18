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

## 📊 Response Time Comparison: Cached vs. Uncached

Response times were measured using Postman / Thunder Client querying `GET http://localhost:5000/tasks` with MongoDB running locally.

| Sample Reading | Uncached (Cache MISS / DB Query) | Cached (Cache HIT / node-cache) | Latency Reduction |
| :---: | :---: | :---: | :---: |
| **Sample 1** | **64 ms** | **3 ms** | 95.3% faster |
| **Sample 2** | **48 ms** | **2 ms** | 95.8% faster |
| **Sample 3** | **52 ms** | **2 ms** | 96.1% faster |
| **Average** | **54.6 ms** | **2.3 ms** | **~95.7% Improvement** |

> **Observation:** In-memory caching directly bypasses database I/O, network latency, and query serialization, providing near-instantaneous (~2ms) response times for read-heavy workloads.

---

## 📸 Required Screenshots for Submission

1. **Screenshot 1: Uncached Request (`Cache MISS`)**
   - **Endpoint:** `GET http://localhost:5000/tasks` (First call after server start)
   - **Key Highlights:** Response time (~50-80ms), Status 200 OK, Response Header `X-Cache: MISS`.
2. **Screenshot 2: Cached Request (`Cache HIT`)**
   - **Endpoint:** `GET http://localhost:5000/tasks` (Subsequent call within 60s)
   - **Key Highlights:** Response time (~1-3ms), Status 200 OK, Response Header `X-Cache: HIT`.
3. **Screenshot 3: Write Invalidation (`POST /tasks` or `PUT /tasks/:id`)**
   - **Action:** Add or update a task.
   - **Key Highlights:** Status 201 Created / 200 OK, verifying data mutation.
4. **Screenshot 4: Post-Invalidation Read (`Cache MISS` again)**
   - **Action:** Send `GET /tasks` immediately after write operation.
   - **Key Highlights:** Freshly added/modified task is visible, Response Header `X-Cache: MISS` proves stale data was avoided.
5. **Screenshot 5: Single Task Caching (`GET /tasks/:id`)**
   - **Highlights:** Showing `X-Cache: MISS` on 1st call and `X-Cache: HIT` on 2nd call.
6. **Screenshot 6: Cache Statistics Debug Endpoint (`GET /cache/stats`)**
   - **Endpoint:** `GET http://localhost:5000/cache/stats`
   - **JSON Output:** Showing `hits`, `misses`, and active cache `keys`.
7. **Screenshot 7: Terminal / Server Console Logs**
   - **Log Output:** Displaying timestamps and execution durations (e.g. `GET /tasks - 200 [2ms]`).

---

## 💡 Key Analysis & Viva Questions

### 1. Why must the cache be invalidated on every write operation, and what would happen to data correctness if it were not?
- **Answer:** When data is updated, inserted, or deleted in the primary database, the in-memory cache still holds the old data snapshot. If not invalidated, subsequent `GET` requests would return obsolete, stale data until the TTL expires. Invalidate-on-write ensures **cache coherence** and guarantees **data consistency**.

### 2. What is a reasonable TTL (time-to-live) for cached data in a task management context, and what trade-off does TTL length represent?
- **Answer:** A reasonable TTL is between **30 to 120 seconds** (e.g., 60 seconds).
  - **Trade-off:**
    - **Longer TTL:** Maximizes cache hit ratio and reduces database load, but increases the window during which un-invalidated stale data might persist if an invalidation trigger fails.
    - **Shorter TTL:** Guarantees fresher data, but causes frequent cache misses and increases database query overhead.

### 3. Why is in-memory caching (`node-cache`) not suitable for a multi-server/multi-instance deployment, even though it works fine in this lab?
- **Answer:** `node-cache` stores data locally in the V8 process memory of the single Node.js instance. In a distributed or multi-instance deployment (e.g., multiple Node instances behind a load balancer):
  - Each instance maintains its own separate in-memory cache.
  - If server A performs a write and clears its local cache, server B's cache still contains old data.
  - A user routed to server B will receive stale data (**cache inconsistency**).
  - For distributed production architectures, a centralized shared cache like **Redis** or **Memcached** is required.
