require('dotenv').config()
const mongoose = require('mongoose')
const Task = require('./models/Task')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskmanager'

const sampleTasks = [
  { title: 'Setup Node environment', description: 'Install Node.js v18+ and configure npm', priority: 'high', completed: true },
  { title: 'Connect to MongoDB', description: 'Establish Mongoose connection with retry logic', priority: 'high', completed: true },
  { title: 'Implement CRUD operations', description: 'Build REST endpoints for tasks', priority: 'medium', completed: true },
  { title: 'Install node-cache', description: 'Add node-cache dependency to package.json', priority: 'high', completed: true },
  { title: 'Cache GET /tasks', description: 'Store task list in node-cache with 60s TTL', priority: 'high', completed: true },
  { title: 'Invalidate cache on write', description: 'Clear cache on POST, PUT, DELETE', priority: 'high', completed: true },
  { title: 'Single task caching', description: 'Cache GET /tasks/:id individually', priority: 'medium', completed: true },
  { title: 'Debug stats endpoint', description: 'Expose hit and miss metrics at /cache/stats', priority: 'medium', completed: true },
  { title: 'Benchmark response times', description: 'Measure response latency with and without cache', priority: 'low', completed: false },
  { title: 'Prepare lab documentation', description: 'Record Postman screenshots and analysis questions', priority: 'medium', completed: false }
]

async function seed() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')
    await Task.deleteMany({})
    const inserted = await Task.insertMany(sampleTasks)
    console.log(`Successfully seeded ${inserted.length} sample tasks!`)
    process.exit(0)
  } catch (err) {
    console.error('Seeding error:', err.message)
    process.exit(1)
  }
}

seed()
