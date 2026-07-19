import { useEffect, useMemo, useState } from 'react'
import { FiEdit3, FiFileText, FiPlus, FiSearch, FiX } from 'react-icons/fi'
import './App.css'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import Auth from '../components/Auth'
import { api } from './api'

const emptyNote = { title: '', desc: '' }

function App() {
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [notes, setNotes] = useState([])
  const [currentNote, setCurrentNote] = useState(emptyNote)
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const restoreSession = async () => {
      if (!localStorage.getItem('noted-token')) return setCheckingSession(false)
      try {
        const result = await api.currentUser()
        setUser(result.user)
      } catch {
        localStorage.removeItem('noted-token')
      } finally { setCheckingSession(false) }
    }
    restoreSession()
  }, [])

  useEffect(() => {
    if (!user) return
    api.getNotes().then((result) => setNotes(result.notes)).catch(() => setNotes([]))
  }, [user])

  const handleAuthenticated = ({ user: account, token }) => {
    localStorage.setItem('noted-token', token)
    setUser(account)
  }

  const handleSignOut = async () => {
    try { await api.signOut() } catch { /* The local session is cleared either way. */ }
    localStorage.removeItem('noted-token')
    setUser(null)
    setCurrentNote(emptyNote)
    setEditingId(null)
    setQuery('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const title = currentNote.title.trim()
    const desc = currentNote.desc.trim()

    if (!title || !desc) return

    if (editingId) {
      const result = await api.updateNote(editingId, { title, desc })
      setNotes(notes.map((note) => note.id === editingId ? result.note : note))
    } else {
      const result = await api.createNote({ title, desc })
      setNotes([result.note, ...notes])
    }

    setCurrentNote(emptyNote)
    setEditingId(null)
  }

  const deleteNote = async (id) => {
    await api.deleteNote(id)
    setNotes(notes.filter((note) => note.id !== id))
    if (editingId === id) cancelEdit()
  }

  const editNote = (note) => {
    setCurrentNote({ title: note.title, desc: note.desc })
    setEditingId(note.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setCurrentNote(emptyNote)
    setEditingId(null)
  }

  const filteredNotes = useMemo(() => {
    const searchTerm = query.toLowerCase().trim()
    if (!searchTerm) return notes
    return notes.filter(({ title, desc }) =>
      `${title} ${desc}`.toLowerCase().includes(searchTerm))
  }, [notes, query])

  if (checkingSession) return <div className="session-loading">Loading your workspace...</div>
  if (!user) return <Auth onAuthenticated={handleAuthenticated} />

  return (
    <div className="app-shell">
      <Navbar noteCount={notes.length} user={user} onSignOut={handleSignOut} />

      <main className="workspace">
        <section className="composer" aria-labelledby="composer-title">
          <div className="section-heading">
            <div className="heading-icon"><FiEdit3 /></div>
            <div>
              <p className="eyebrow">Workspace</p>
              <h1 id="composer-title">{editingId ? 'Edit note' : 'Capture a thought'}</h1>
              <p>Keep the useful details close and easy to find.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="title">Title</label>
              <input
                value={currentNote.title}
                onChange={(event) => setCurrentNote({ ...currentNote, title: event.target.value })}
                type="text"
                name="title"
                id="title"
                placeholder="What is this about?"
                maxLength={80}
                required
              />
              <span className="character-count">{currentNote.title.length}/80</span>
            </div>

            <div className="field-group">
              <label htmlFor="desc">Note</label>
              <textarea
                name="desc"
                id="desc"
                onChange={(event) => setCurrentNote({ ...currentNote, desc: event.target.value })}
                value={currentNote.desc}
                placeholder="Write down the details..."
                maxLength={600}
                required
              />
              <span className="character-count">{currentNote.desc.length}/600</span>
            </div>

            <div className="form-actions">
              <button className="primary-button" type="submit">
                {editingId ? <FiEdit3 /> : <FiPlus />}
                {editingId ? 'Save changes' : 'Add note'}
              </button>
              {editingId && (
                <button className="secondary-button" type="button" onClick={cancelEdit}>
                  <FiX /> Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="notes-panel" aria-labelledby="notes-title">
          <div className="notes-toolbar">
            <div>
              <p className="eyebrow">Collection</p>
              <h2 id="notes-title">Your notes</h2>
            </div>
            <label className="search-box">
              <FiSearch aria-hidden="true" />
              <span className="sr-only">Search notes</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notes"
              />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><FiX /></button>}
            </label>
          </div>

          {filteredNotes.length > 0 ? (
            <div className="notes-grid">
              {filteredNotes.map((note) => (
                <Card key={note.id} note={note} deleteNote={deleteNote} editNote={editNote} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><FiFileText /></div>
              <h3>{query ? 'No matching notes' : 'Your ideas start here'}</h3>
              <p>{query ? 'Try another word or clear your search.' : 'Add your first note using the form.'}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
