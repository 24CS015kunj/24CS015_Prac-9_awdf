require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const Task = require('./models/Task')
const { getCache, setCache, delCache, getStats } = require('./cache')

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskmanager'

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.url} - ${res.statusCode} [${duration}ms]`)
  })
  next()
})

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err.message))

app.get('/cache/stats', (req, res) => {
  res.status(200).json(getStats())
})

app.get('/tasks', async (req, res, next) => {
  try {
    const cacheKey = 'all_tasks'
    const cached = getCache(cacheKey)

    if (cached.hit) {
      res.setHeader('X-Cache', 'HIT')
      return res.status(200).json(cached.data)
    }

    const tasks = await Task.find().sort({ createdAt: -1 })
    setCache(cacheKey, tasks, 60)

    res.setHeader('X-Cache', 'MISS')
    res.status(200).json(tasks)
  } catch (err) {
    next(err)
  }
})

app.get('/tasks/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Task ID format' })
    }

    const cacheKey = `task_${req.params.id}`
    const cached = getCache(cacheKey)

    if (cached.hit) {
      res.setHeader('X-Cache', 'HIT')
      return res.status(200).json(cached.data)
    }

    const task = await Task.findById(req.params.id)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    setCache(cacheKey, task, 60)
    res.setHeader('X-Cache', 'MISS')
    res.status(200).json(task)
  } catch (err) {
    next(err)
  }
})

app.post('/tasks', async (req, res, next) => {
  try {
    const { title, description, priority } = req.body
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const newTask = await Task.create({
      title: title.trim(),
      description: description || '',
      priority: priority || 'medium',
      completed: false
    })

    delCache('all_tasks')

    res.status(201).json(newTask)
  } catch (err) {
    next(err)
  }
})

app.put('/tasks/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Task ID' })
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' })
    }

    delCache('all_tasks')
    delCache(`task_${req.params.id}`)

    res.status(200).json(updatedTask)
  } catch (err) {
    next(err)
  }
})

app.delete('/tasks/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Task ID' })
    }

    const deleted = await Task.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' })
    }

    delCache('all_tasks')
    delCache(`task_${req.params.id}`)

    res.status(200).json({ message: 'Task deleted successfully', task: deleted })
  } catch (err) {
    next(err)
  }
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message || 'Server error' })
})

app.listen(PORT, () => {
  console.log(`Server with caching running on port ${PORT}`)
})
