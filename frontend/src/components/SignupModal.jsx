import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function SignupModal({ open, onClose, onSwitchLogin }) {
  const { signup } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    try {
      await signup(username, email, password)
      onClose()
      setUsername('')
      setEmail('')
      setPassword('')
      setConfirm('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed')
    }
  }

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal-panel auth-panel" initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-x" onClick={onClose}><i className="fas fa-times" /></button>
        <h2>Sign up</h2>
        <form onSubmit={submit}>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required autoComplete="username" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required autoComplete="email" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required autoComplete="new-password" />
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" placeholder="Confirm password" required autoComplete="new-password" />
          <button type="submit" className="btn-glow primary full">Create account</button>
        </form>
        <p className="auth-switch">
          Have an account?{' '}
          <button type="button" className="link-btn" onClick={onSwitchLogin}>Login</button>
        </p>
      </motion.div>
    </motion.div>
  )
}
