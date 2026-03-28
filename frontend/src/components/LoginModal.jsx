import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginModal({ open, onClose, onSwitchSignup }) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    try {
      await login(username, password)
      onClose()
      setUsername('')
      setPassword('')
    } catch {
      toast.error('Invalid credentials')
    }
  }

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal-panel auth-panel" initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-x" onClick={onClose}><i className="fas fa-times" /></button>
        <h2>Login</h2>
        <form onSubmit={submit}>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required autoComplete="username" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required autoComplete="current-password" />
          <button type="submit" className="btn-glow primary full">Login</button>
        </form>
        <p className="auth-switch">
          No account?{' '}
          <button type="button" className="link-btn" onClick={onSwitchSignup}>Sign up</button>
        </p>
      </motion.div>
    </motion.div>
  )
}
