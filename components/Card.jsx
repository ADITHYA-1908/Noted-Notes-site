import { FiEdit2, FiTrash2 } from 'react-icons/fi'

const formatDate = (date) => new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: new Date(date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
}).format(new Date(date))

const Card = ({ note, deleteNote, editNote }) => (
  <article className="note-card">
    <div className="note-card-header">
      <span className="note-date">{formatDate(note.updatedAt)}</span>
      <div className="card-actions">
        <button type="button" onClick={() => editNote(note)} aria-label={`Edit ${note.title}`} title="Edit note">
          <FiEdit2 />
        </button>
        <button className="delete-button" type="button" onClick={() => deleteNote(note.id)} aria-label={`Delete ${note.title}`} title="Delete note">
          <FiTrash2 />
        </button>
      </div>
    </div>
    <h3>{note.title}</h3>
    <p>{note.desc}</p>
  </article>
)

export default Card
