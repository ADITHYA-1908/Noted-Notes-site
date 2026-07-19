import pg from 'pg'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const dataFile = join(dirname(fileURLToPath(import.meta.url)), 'data', 'store.json')

class JsonDatabase {
  constructor() { this.sessions = new Map() }

  async read() {
    try { return JSON.parse(await readFile(dataFile, 'utf8')) }
    catch (error) {
      if (error.code !== 'ENOENT') throw error
      return { users: [], notes: [] }
    }
  }

  async write(data) {
    await mkdir(dirname(dataFile), { recursive: true })
    await writeFile(`${dataFile}.tmp`, JSON.stringify(data, null, 2))
    await rename(`${dataFile}.tmp`, dataFile)
  }

  async initialize() {}
  async findUserByEmail(email) { return (await this.read()).users.find((user) => user.email === email) }
  async findUserById(id) { return (await this.read()).users.find((user) => user.id === id) }
  async createUser(user) { const data = await this.read(); data.users.push(user); await this.write(data); return user }
  async createSession(tokenHash, userId, expiresAt) { this.sessions.set(tokenHash, { userId, expiresAt }) }
  async findSession(tokenHash) { const session = this.sessions.get(tokenHash); return session && session.expiresAt > new Date() ? session : null }
  async deleteSession(tokenHash) { this.sessions.delete(tokenHash) }
  async listNotes(userId) { return (await this.read()).notes.filter((note) => note.userId === userId).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)) }
  async createNote(note) { const data = await this.read(); data.notes.push(note); await this.write(data); return note }
  async updateNote(id, userId, changes) { const data = await this.read(); const note = data.notes.find((item) => item.id === id && item.userId === userId); if (!note) return null; Object.assign(note, changes); await this.write(data); return note }
  async deleteNote(id, userId) { const data = await this.read(); const index = data.notes.findIndex((item) => item.id === id && item.userId === userId); if (index < 0) return false; data.notes.splice(index, 1); await this.write(data); return true }
}

class PostgresDatabase {
  constructor(connectionString) {
    this.pool = new pg.Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  }

  async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(320) UNIQUE NOT NULL,
        password_salt VARCHAR(64) NOT NULL,
        password_hash VARCHAR(256) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash VARCHAR(128) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL
      );
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(80) NOT NULL,
        description VARCHAR(600) NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS notes_user_updated_idx ON notes(user_id, updated_at DESC);
      DELETE FROM sessions WHERE expires_at <= NOW();
    `)
  }

  mapUser(row) { return row && { id: row.id, name: row.name, email: row.email, passwordSalt: row.password_salt, passwordHash: row.password_hash, createdAt: row.created_at } }
  mapNote(row) { return row && { id: row.id, userId: row.user_id, title: row.title, desc: row.description, updatedAt: row.updated_at } }
  async findUserByEmail(email) { return this.mapUser((await this.pool.query('SELECT * FROM users WHERE email = $1', [email])).rows[0]) }
  async findUserById(id) { return this.mapUser((await this.pool.query('SELECT * FROM users WHERE id = $1', [id])).rows[0]) }
  async createUser(user) { await this.pool.query('INSERT INTO users (id, name, email, password_salt, password_hash, created_at) VALUES ($1,$2,$3,$4,$5,$6)', [user.id, user.name, user.email, user.passwordSalt, user.passwordHash, user.createdAt]); return user }
  async createSession(tokenHash, userId, expiresAt) { await this.pool.query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1,$2,$3)', [tokenHash, userId, expiresAt]) }
  async findSession(tokenHash) { const row = (await this.pool.query('SELECT user_id, expires_at FROM sessions WHERE token_hash = $1 AND expires_at > NOW()', [tokenHash])).rows[0]; return row && { userId: row.user_id, expiresAt: row.expires_at } }
  async deleteSession(tokenHash) { await this.pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]) }
  async listNotes(userId) { return (await this.pool.query('SELECT * FROM notes WHERE user_id = $1 ORDER BY updated_at DESC', [userId])).rows.map((row) => this.mapNote(row)) }
  async createNote(note) { await this.pool.query('INSERT INTO notes (id, user_id, title, description, updated_at) VALUES ($1,$2,$3,$4,$5)', [note.id, note.userId, note.title, note.desc, note.updatedAt]); return note }
  async updateNote(id, userId, changes) { return this.mapNote((await this.pool.query('UPDATE notes SET title=$1, description=$2, updated_at=$3 WHERE id=$4 AND user_id=$5 RETURNING *', [changes.title, changes.desc, changes.updatedAt, id, userId])).rows[0]) }
  async deleteNote(id, userId) { return (await this.pool.query('DELETE FROM notes WHERE id=$1 AND user_id=$2', [id, userId])).rowCount > 0 }
}

export const database = process.env.DATABASE_URL
  ? new PostgresDatabase(process.env.DATABASE_URL)
  : new JsonDatabase()

export const databaseType = process.env.DATABASE_URL ? 'PostgreSQL' : 'local JSON fallback'
