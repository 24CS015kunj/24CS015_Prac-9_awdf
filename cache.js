const NodeCache = require('node-cache')

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 })

let hits = 0
let misses = 0

const getCache = (key) => {
  const value = cache.get(key)
  if (value !== undefined) {
    hits++
    return { data: value, hit: true }
  }
  misses++
  return { data: null, hit: false }
}

const setCache = (key, value, ttl = 60) => {
  return cache.set(key, value, ttl)
}

const delCache = (key) => {
  return cache.del(key)
}

const getStats = () => {
  return {
    hits,
    misses,
    keys: cache.keys(),
    stats: cache.getStats()
  }
}

module.exports = {
  cache,
  getCache,
  setCache,
  delCache,
  getStats
}
