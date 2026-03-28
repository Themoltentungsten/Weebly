import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'
import { normalizeAnime } from '../utils/anime'
import toast from 'react-hot-toast'

export default function ChatBot({ onOpenAnime }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([{ role: 'bot', text: 'Tell me your mood — I will suggest anime from our catalog.' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [cards, setCards] = useState([])
  const recogRef = useRef(null)
  const [listening, setListening] = useState(false)

  const send = async (text) => {
    const t = text.trim()
    if (!t || loading) return
    setMsgs((m) => [...m, { role: 'user', text: t }])
    setInput('')
    setLoading(true)
    setCards([])
    try {
      const { data } = await api.post('/api/ai/chat', { message: t }, { timeout: 120000 })
      const list = (data.anime || []).map(normalizeAnime)
      setMsgs((m) => [...m, { role: 'bot', text: data.message || 'Here are some picks:' }])
      setCards(list)
    } catch (e) {
      const d = e.response?.data
      if (e.response?.status === 503 && d?.message) {
        toast.error(d.error || 'Database offline')
        setMsgs((m) => [...m, { role: 'bot', text: d.message }])
      } else {
        toast.error(d?.error || 'Cannot reach the API')
        setMsgs((m) => [
          ...m,
          {
            role: 'bot',
            text:
              e.response?.data?.details ||
              'Start the site from the project folder (start-site.cmd or npm run start). Use http://localhost:5173.',
          },
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  const voice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      toast.error('Use Chrome or Edge for voice input.')
      return
    }
    if (listening) {
      recogRef.current?.stop()
      setListening(false)
      return
    }
    const r = new SR()
    r.lang = 'en-US'
    r.onresult = (ev) => send(ev.results[0][0].transcript)
    r.onerror = () => setListening(false)
    r.onend = () => setListening(false)
    recogRef.current = r
    setListening(true)
    r.start()
  }

  return (
    <>
      <button type="button" className="chat-fab" onClick={() => setOpen(!open)} aria-label="AI chat">
        <i className="fas fa-robot" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="chat-panel" initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}>
            <div className="chat-head">
              <span>Mood matcher</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close"><i className="fas fa-times" /></button>
            </div>
            <div className="chat-msgs">
              {msgs.map((m, i) => (
                <div key={String(i)} className={`chat-bubble ${m.role}`}>{m.text}</div>
              ))}
              {loading && <div className="chat-bubble bot">Thinking…</div>}
            </div>
            {cards.length > 0 && (
              <div className="chat-cards">
                {cards.map((a) => (
                  <button key={a.id} type="button" className="chat-card" onClick={() => onOpenAnime(a)}>
                    <img src={a.poster} alt="" />
                    <span className="chat-card-title">{a.title.replace(/<br\s*\/?>/gi, ' ')}</span>
                    <span className="chat-card-rating">{a.rating}/10</span>
                  </button>
                ))}
              </div>
            )}
            <div className="chat-input-row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. Something dark and psychological tonight"
                onKeyDown={(e) => e.key === 'Enter' && send(input)}
              />
              <button type="button" className={listening ? 'active' : ''} onClick={voice} title="Voice"><i className="fas fa-microphone" /></button>
              <button type="button" className="primary" onClick={() => send(input)}><i className="fas fa-paper-plane" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
