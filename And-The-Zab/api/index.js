const { app, connectDatabase } = require('../server')

module.exports = async (req, res) => {
  try {
    await connectDatabase()
    return app(req, res)
  } catch (error) {
    console.error('API initialization failed:', error)
    return res.status(500).json({ error: 'Database connection failed.' })
  }
}
