import { FiFeather, FiLogOut } from 'react-icons/fi'

const Navbar = ({ noteCount, user, onSignOut }) => (
  <header className="topbar">
    <a className="brand" href="#top" aria-label="Noted home">
      <span className="brand-mark"><FiFeather /></span>
      <span>Noted</span>
    </a>
    <div className="nav-account">
      <div className="note-count">
        <span>{noteCount}</span> {noteCount === 1 ? 'note' : 'notes'}
      </div>
      <div className="user-chip" title={user.email}>
        <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
        <span className="user-name">{user.name.split(' ')[0]}</span>
      </div>
      <button className="signout-button" type="button" onClick={onSignOut} aria-label="Sign out" title="Sign out">
        <FiLogOut />
      </button>
    </div>
  </header>
)

export default Navbar
