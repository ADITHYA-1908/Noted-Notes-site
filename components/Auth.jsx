import { useState } from 'react'
import { FiArrowRight, FiEye, FiEyeOff, FiFeather, FiLock, FiMail, FiUser } from 'react-icons/fi'
import { api } from '../src/api'

const Auth = ({ onAuthenticated }) => {
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const details = { name: form.name.trim(), email: form.email.trim(), password: form.password }
      const result = mode === 'signup' ? await api.signUp(details) : await api.signIn(details)
      onAuthenticated(result)
    } catch (requestError) {
      setError(requestError.message)
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <a className="brand auth-brand" href="#top">
          <span className="brand-mark"><FiFeather /></span>
          <span>Noted</span>
        </a>
        <div className="auth-message">
          <p className="eyebrow">A calmer place to think</p>
          <h1>Ideas deserve a place you can return to.</h1>
          <p>Capture the details, organize your thinking, and keep every note close at hand.</p>
        </div>
        <p className="auth-footnote">Simple. Securely stored. Always ready.</p>
      </section>

      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-form-wrap">
          <div className="auth-heading">
            <p className="eyebrow">{mode === 'signin' ? 'Welcome back' : 'Create an account'}</p>
            <h2 id="auth-title">{mode === 'signin' ? 'Sign in to your notes' : 'Start your collection'}</h2>
            <p>{mode === 'signin' ? 'Your workspace is waiting for you.' : 'A few details and you are ready to write.'}</p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button className={mode === 'signin' ? 'active' : ''} type="button" onClick={() => switchMode('signin')}>Sign in</button>
            <button className={mode === 'signup' ? 'active' : ''} type="button" onClick={() => switchMode('signup')}>Create account</button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="field-group auth-field">
                <label htmlFor="name">Full name</label>
                <FiUser aria-hidden="true" />
                <input id="name" type="text" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" required />
              </div>
            )}
            <div className="field-group auth-field">
              <label htmlFor="email">Email address</label>
              <FiMail aria-hidden="true" />
              <input id="email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" required />
            </div>
            <div className="field-group auth-field">
              <label htmlFor="password">Password</label>
              <FiLock aria-hidden="true" />
              <input id="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 6 characters" required />
              <button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
              {!loading && <FiArrowRight />}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'signin' ? 'New to Noted?' : 'Already have an account?'}{' '}
            <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}

export default Auth
