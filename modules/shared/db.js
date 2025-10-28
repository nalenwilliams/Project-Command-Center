import 'dotenv/config'
import pkg from 'pg'
const { Pool } = pkg

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err)
})

export default pool

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ PostgreSQL connection error:', err.message)
  } else {
    console.log('✅ PostgreSQL connected successfully at', res.rows[0].now)
  }
})
