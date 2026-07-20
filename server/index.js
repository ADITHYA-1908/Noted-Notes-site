import express from 'express'
import { Buffer } from 'node:buffer'
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { database, databaseType } from './database.js'
import { sendWelcomeEmail } from './email.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const scrypt = promisify(scryptCallback)
const sessionLifetime = 30 * 24 * 60 * 60 * 1000

app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))

const hashPassword = async (password, salt = randomBytes(16).toString('hex')) => ({ salt, hash: (await scrypt(password, salt, 64)).toString('hex') })
const passwordMatches = async (password, user) => timingSafeEqual(await scrypt(password, user.passwordSalt, 64), Buffer.from(user.passwordHash, 'hex'))
const hashToken = (token) => createHash('sha256').update(token).digest('hex')
const publicUser = ({ id, name, email }) => ({ id, name, email })

const createSession = async (user) => {
  const token = randomBytes(32).toString('hex')
  await database.createSession(hashToken(token), user.id, new Date(Date.now() + sessionLifetime))
  return token
}

const authenticate = async (request, response, next) => {
  try {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
    const session = token && await database.findSession(hashToken(token))
    if (!session) return response.status(401).json({ message: 'Please sign in again.' })
    const user = await database.findUserById(session.userId)
    if (!user) return response.status(401).json({ message: 'Account not found.' })
    request.auth = { tokenHash: hashToken(token), user }
    next()
  } catch (error) { next(error) }
}

app.post('/api/auth/signup', async (request, response, next) => {
  try {
    const name = String(request.body.name || '').trim()
    const email = String(request.body.email || '').trim().toLowerCase()
    const password = String(request.body.password || '')
    if (name.length < 2) return response.status(400).json({ message: 'Please enter your full name.' })
    if (!/^\S+@\S+\.\S+$/.test(email)) return response.status(400).json({ message: 'Enter a valid email address.' })
    if (password.length < 6) return response.status(400).json({ message: 'Use at least 6 characters for your password.' })
    if (await database.findUserByEmail(email)) return response.status(409).json({ message: 'An account with this email already exists.' })
    const passwordData = await hashPassword(password)
    const user = await database.createUser({ id: randomUUID(), name, email, passwordSalt: passwordData.salt, passwordHash: passwordData.hash, createdAt: new Date().toISOString() })
    try {
      await sendWelcomeEmail(user)
    } catch (emailError) {
      console.error(`Account created, but welcome email failed for ${user.email}:`, emailError.message)
    }
    response.status(201).json({ user: publicUser(user), token: await createSession(user) })
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ message: 'An account with this email already exists.' })
    next(error)
  }
})

app.post('/api/auth/signin', async (request, response, next) => {
  try {
    const user = await database.findUserByEmail(String(request.body.email || '').trim().toLowerCase())
    if (!user || !(await passwordMatches(String(request.body.password || ''), user))) return response.status(401).json({ message: 'That email and password combination was not found.' })
    response.json({ user: publicUser(user), token: await createSession(user) })
  } catch (error) { next(error) }
})

app.get('/api/auth/me', authenticate, (request, response) => response.json({ user: publicUser(request.auth.user) }))
app.post('/api/auth/signout', authenticate, async (request, response, next) => { try { await database.deleteSession(request.auth.tokenHash); response.status(204).end() } catch (error) { next(error) } })
app.get('/api/notes', authenticate, async (request, response, next) => { try { response.json({ notes: await database.listNotes(request.auth.user.id) }) } catch (error) { next(error) } })

app.post('/api/notes', authenticate, async (request, response, next) => {
  try {
    const title = String(request.body.title || '').trim()
    const desc = String(request.body.desc || '').trim()
    if (!title || !desc) return response.status(400).json({ message: 'A title and note are required.' })
    const note = await database.createNote({ id: randomUUID(), userId: request.auth.user.id, title: title.slice(0, 80), desc: desc.slice(0, 600), updatedAt: new Date().toISOString() })
    response.status(201).json({ note })
  } catch (error) { next(error) }
})

app.put('/api/notes/:id', authenticate, async (request, response, next) => {
  try {
    const title = String(request.body.title || '').trim()
    const desc = String(request.body.desc || '').trim()
    if (!title || !desc) return response.status(400).json({ message: 'A title and note are required.' })
    const note = await database.updateNote(request.params.id, request.auth.user.id, { title: title.slice(0, 80), desc: desc.slice(0, 600), updatedAt: new Date().toISOString() })
    if (!note) return response.status(404).json({ message: 'Note not found.' })
    response.json({ note })
  } catch (error) { next(error) }
})

app.delete('/api/notes/:id', authenticate, async (request, response, next) => {
  try { if (!(await database.deleteNote(request.params.id, request.auth.user.id))) return response.status(404).json({ message: 'Note not found.' }); response.status(204).end() }
  catch (error) { next(error) }
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(root, 'dist')))
  app.get(/^(?!\/api).*/, (request, response) => response.sendFile(join(root, 'dist', 'index.html')))
}

app.use((error, request, response, next) => { console.error(error); if (response.headersSent) return next(error); response.status(500).json({ message: 'The server could not complete that request.' }) })

await database.initialize()
app.listen(port, () => console.log(`Noted running on port ${port} with ${databaseType}`))
