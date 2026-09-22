require('dotenv').config()
const express = require('express')
const ytSearch = require('yt-search')
const crypto = require('crypto')
const mongoose = require('mongoose')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { put } = require('@vercel/blob')
const app = express()
app.use(express.json())
const uploadDir = path.join(__dirname, 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })
// Multer exposes multipart filenames as Latin-1 strings. Browsers encode them as
// UTF-8, so convert the underlying bytes before using a filename as visible text.
const decodeUploadFilename = filename => {
  try {
    const decoded = Buffer.from(filename, 'latin1').toString('utf8')
    return decoded.includes('\uFFFD') ? filename : decoded
  } catch {
    return filename
  }
}
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 }, fileFilter: (req, file, done) => done(null, /^audio\/(mpeg|wav|ogg|mp4)$/.test(file.mimetype)) })
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, done) => done(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)) })
const storeUpload = async (file, folder) => {
  const filename = `${folder}/${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, file.buffer, { access: 'public', contentType: file.mimetype, addRandomSuffix: false })
    return blob.url
  }
  const localFilename = path.basename(filename)
  await fs.promises.writeFile(path.join(uploadDir, localFilename), file.buffer)
  return `/uploads/${localFilename}`
}
app.use('/uploads', express.static(uploadDir))

const tracks = [
  { id: 1, title: 'Midnight Echoes', artist: 'LUNA', album: 'Afterglow', duration: '3:42', color: '#e78c5a', art: 'echoes' },
  { id: 2, title: 'Golden Hour', artist: 'Mira Sol', album: 'Daydreams', duration: '3:18', color: '#f4b85a', art: 'golden' },
  { id: 3, title: 'Neon Hearts', artist: 'Fever Ray', album: 'Electric Love', duration: '4:06', color: '#916fc9', art: 'neon' },
  { id: 4, title: 'Blue Skies', artist: 'The Coastline', album: 'Tidal', duration: '3:55', color: '#4d9fcb', art: 'blue' },
  { id: 5, title: 'Slow Motion', artist: 'Sora', album: 'Gravity', duration: '2:58', color: '#e36b85', art: 'slow' },
  { id: 6, title: 'Velvet Room', artist: 'Noah K.', album: 'Night Drive', duration: '3:31', color: '#55719b', art: 'velvet' }
]

const User = mongoose.model('User', new mongoose.Schema({ name: { type: String, required: true, trim: true }, email: { type: String, required: true, trim: true, lowercase: true, unique: true }, password: { type: String, required: true } }, { timestamps: true }))
User.schema.add({ avatarUrl: { type: String, default: '' } })
const Session = mongoose.model('Session', new mongoose.Schema({ token: { type: String, required: true, unique: true }, userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } }, { timestamps: true }))
const PasswordReset = mongoose.model('PasswordReset', new mongoose.Schema({ email: { type: String, required: true, lowercase: true, index: true }, code: { type: String, required: true }, expiresAt: { type: Date, required: true, expires: 0 } }))
const albumSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, videoId: { type: String, required: true }, title: { type: String, required: true }, artist: { type: String, default: 'YouTube' }, duration: { type: String, default: '' }, thumbnail: { type: String, default: '' }, audioUrl: { type: String, default: '' } }, { timestamps: true })
albumSchema.index({ userId: 1, videoId: 1 }, { unique: true })
const AlbumItem = mongoose.model('AlbumItem', albumSchema)
const hashPassword = password => crypto.scryptSync(password, 'sonora-demo-salt', 64).toString('hex')
const publicUser = user => ({ id: user._id.toString(), name: user.name, email: user.email, avatarUrl: user.avatarUrl || '' })
const newSession = async userId => { const token = crypto.randomUUID(); await Session.create({ token, userId }); return token }
const requireUser = async (req, res, next) => { try { const token = req.headers.authorization?.replace(/^Bearer\s+/i, ''), session = token && await Session.findOne({ token }); if (!session) return res.status(401).json({ error: 'Please log in to manage your album.' }); req.userId = session.userId; next() } catch (error) { next(error) } }

app.get('/api/tracks', (req, res) => res.json(tracks))
app.get('/api/favorites', (req, res) => res.json([1, 3]))
app.post('/api/favorites/:id', (req, res) => res.json({ favorites: [1, 3] }))
app.post('/api/auth/register', async (req, res, next) => { try { const { name, email, password } = req.body || {}; if (!name?.trim() || !email?.includes('@') || !password || password.length < 6) return res.status(400).json({ error: 'Enter a name, valid email, and password with at least 6 characters.' }); const user = await User.create({ name, email, password: hashPassword(password) }), token = await newSession(user._id); res.status(201).json({ user: publicUser(user), token }) } catch (error) { if (error?.code === 11000) return res.status(409).json({ error: 'This email is already registered.' }); next(error) } })
app.post('/api/auth/login', async (req, res, next) => { try { const { email, password } = req.body || {}, user = await User.findOne({ email: String(email || '').trim().toLowerCase() }); if (!user || !password || !crypto.timingSafeEqual(Buffer.from(user.password, 'hex'), Buffer.from(hashPassword(password), 'hex'))) return res.status(401).json({ error: 'Incorrect email or password.' }); res.json({ user: publicUser(user), token: await newSession(user._id) }) } catch (error) { next(error) } })
app.patch('/api/auth/profile', requireUser, async (req, res, next) => { try { const name = String(req.body?.name || '').trim(), email = String(req.body?.email || '').trim().toLowerCase(); if (!name || !email.includes('@')) return res.status(400).json({ error: 'Enter a display name and valid email.' }); const user = await User.findById(req.userId); if (!user) return res.status(404).json({ error: 'Account not found.' }); user.name = name; user.email = email; await user.save(); res.json({ user: publicUser(user) }) } catch (error) { if (error?.code === 11000) return res.status(409).json({ error: 'This email is already registered.' }); next(error) } })
app.post('/api/auth/profile/avatar', requireUser, imageUpload.single('avatar'), async (req, res, next) => { try { if (!req.file) return res.status(400).json({ error: 'Choose a JPG, PNG, or WebP image (maximum 5 MB).' }); const user = await User.findById(req.userId); if (!user) return res.status(404).json({ error: 'Account not found.' }); user.avatarUrl = await storeUpload(req.file, 'avatars'); await user.save(); res.json({ user: publicUser(user) }) } catch (error) { next(error) } })
app.post('/api/auth/forgot-password', async (req, res, next) => { try { const email = String(req.body?.email || '').trim().toLowerCase(), user = await User.findOne({ email }); if (!user) return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้ที่ลงทะเบียนด้วยอีเมลนี้' }); const code = String(crypto.randomInt(100000, 1000000)); await PasswordReset.deleteMany({ email }); await PasswordReset.create({ email, code, expiresAt: new Date(Date.now() + 15 * 60 * 1000) }); res.json({ message: 'Reset code created.', demoCode: code }) } catch (error) { next(error) } })
app.post('/api/auth/reset-password', async (req, res, next) => { try { const email = String(req.body?.email || '').trim().toLowerCase(), code = String(req.body?.code || ''), password = String(req.body?.password || ''); if (password.length < 6) return res.status(400).json({ error: 'Password must have at least 6 characters.' }); const reset = await PasswordReset.findOne({ email, code }), user = await User.findOne({ email }); if (!reset || !user) return res.status(400).json({ error: 'The reset code is invalid or has expired.' }); user.password = hashPassword(password); await user.save(); await PasswordReset.deleteMany({ email }); await Session.deleteMany({ userId: user._id }); res.json({ message: 'Password changed. Please log in.' }) } catch (error) { next(error) } })
app.get('/api/album', requireUser, async (req, res, next) => { try { const items = await AlbumItem.find({ userId: req.userId }).sort({ createdAt: -1 }).lean(); res.json(items.map(item => ({ id: item.videoId, title: decodeUploadFilename(item.title), artist: item.artist, duration: item.duration, thumbnail: item.thumbnail, audioUrl: item.audioUrl }))) } catch (error) { next(error) } })
app.post('/api/album', requireUser, async (req, res, next) => { try { const { id, title, artist, duration, thumbnail } = req.body || {}; if (!id || !title) return res.status(400).json({ error: 'Song information is incomplete.' }); const item = await AlbumItem.create({ userId: req.userId, videoId: String(id), title: String(title), artist: String(artist || 'YouTube'), duration: String(duration || ''), thumbnail: String(thumbnail || '') }); res.status(201).json({ id: item.videoId, title: item.title, artist: item.artist, duration: item.duration, thumbnail: item.thumbnail }) } catch (error) { if (error?.code === 11000) return res.status(409).json({ error: 'This song is already in your album.' }); next(error) } })
app.post('/api/album/upload', requireUser, upload.single('audio'), async (req, res, next) => { try { if (!req.file) return res.status(400).json({ error: 'Choose an MP3, WAV, OGG, or M4A audio file (maximum 25 MB).' }); const originalName = decodeUploadFilename(req.file.originalname); const title = String(req.body.title || path.parse(originalName).name).trim(); const artist = String(req.body.artist || 'My music').trim(); const audioUrl = await storeUpload(req.file, 'audio'); const item = await AlbumItem.create({ userId: req.userId, videoId: `upload-${crypto.randomUUID()}`, title, artist, audioUrl }); res.status(201).json({ id: item.videoId, title: item.title, artist: item.artist, duration: '', thumbnail: '', audioUrl: item.audioUrl }) } catch (error) { next(error) } })
app.delete('/api/album/:id', requireUser, async (req, res, next) => { try { await AlbumItem.deleteOne({ userId: req.userId, videoId: req.params.id }); res.status(204).end() } catch (error) { next(error) } })
app.post('/api/album/youtube-link', requireUser, async (req, res, next) => { try { const url = String(req.body?.url || '').trim(), match = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/); if (!match) return res.status(400).json({ error: 'Please enter a valid YouTube link.' }); const video = await ytSearch({ videoId: match[1] }); if (!video?.title) return res.status(404).json({ error: 'Video not found.' }); const item = await AlbumItem.create({ userId: req.userId, videoId: match[1], title: video.title, artist: video.author?.name || 'YouTube', duration: video.timestamp || '', thumbnail: video.thumbnail || '' }); res.status(201).json({ id: item.videoId, title: item.title, artist: item.artist, duration: item.duration, thumbnail: item.thumbnail }) } catch (error) { if (error?.code === 11000) return res.status(409).json({ error: 'This song is already in your album.' }); next(error) } })
app.get('/api/youtube/search', async (req, res) => { const query = String(req.query.q || '').trim(); if (!query) return res.json([]); try { const result = await ytSearch(query); res.json(result.videos.slice(0, 8).map(video => ({ id: video.videoId, title: video.title, artist: video.author?.name || 'YouTube', duration: video.timestamp || '', thumbnail: video.thumbnail, url: video.url }))) } catch { res.status(502).json({ error: 'Unable to search YouTube right now.' }) } })
app.use((error, req, res, next) => { console.error(error); res.status(500).json({ error: 'Something went wrong. Please try again.' }) })

const port = Number(process.env.PORT) || 3001, mongoUri = process.env.MONGODB_URI
let mongoConnection
const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) return
  if (!mongoUri) throw new Error('MONGODB_URI is required. Add it to your environment before starting the server.')
  mongoConnection ||= mongoose.connect(mongoUri)
  await mongoConnection
}

if (require.main === module) {
  connectDatabase().then(() => app.listen(port, () => console.log(`Sonora API listening on http://localhost:${port}`))).catch(error => { console.error('MongoDB connection failed:', error.message); process.exit(1) })
}

module.exports = { app, connectDatabase }
