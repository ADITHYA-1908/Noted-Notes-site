const request = async (path, options = {}) => {
  const token = localStorage.getItem('noted-token')
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = response.status === 204 ? null : await response.json()
  if (!response.ok) {
    const error = new Error(data?.message || 'Something went wrong.')
    error.status = response.status
    throw error
  }
  return data
}

export const api = {
  signUp: (details) => request('/auth/signup', { method: 'POST', body: JSON.stringify(details) }),
  signIn: (details) => request('/auth/signin', { method: 'POST', body: JSON.stringify(details) }),
  currentUser: () => request('/auth/me'),
  signOut: () => request('/auth/signout', { method: 'POST' }),
  getNotes: () => request('/notes'),
  createNote: (note) => request('/notes', { method: 'POST', body: JSON.stringify(note) }),
  updateNote: (id, note) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(note) }),
  deleteNote: (id) => request(`/notes/${id}`, { method: 'DELETE' }),
}
