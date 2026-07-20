import { useState } from 'react'
import { FiFeather, FiLogOut, FiMail, FiUser } from 'react-icons/fi'

const Navbar = ({ noteCount, user, onSignOut }) => {
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Noted home">
        <span className="brand-mark"><FiFeather /></span>
        <span>Noted</span>
      </a>
      <div className="nav-account">
        <div className="note-count">
          <span>{noteCount}</span> {noteCount === 1 ? 'note' : 'notes'}
        </div>
        <div className="profile-menu">
          <button
            className="profile-trigger"
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-label="Show user profile"
            aria-expanded={profileOpen}
            aria-controls="user-profile-card"
          >
            <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
          </button>
          {profileOpen && (
            <div id="user-profile-card" className="profile-card" role="status" aria-label="User profile">
              <p className="profile-label">Account details</p>
              <div className="profile-detail">
                <FiUser aria-hidden="true" />
                <div><span>Username</span><strong>{user.name}</strong></div>
              </div>
              <div className="profile-detail">
                <FiMail aria-hidden="true" />
                <div><span>Email address</span><strong>{user.email}</strong></div>
              </div>
            </div>
          )}
        </div>
        <button className="signout-button" type="button" onClick={onSignOut} aria-label="Sign out" title="Sign out">
          <FiLogOut />
        </button>
      </div>
    </header>
  )
}

export default Navbar
