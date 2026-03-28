import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import AnimeCard from './AnimeCard'

export default function SearchOverlay({ open, onClose, animeList, onSelectAnime, onTrailer }) {
  const [q, setQ] = useState('')
  const [listening, setListening] = useState(false)
  const inputRef = useRef(null)
  const recogRef = useRef(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const results = q.trim().length < 2
    ? []
    : animeList.filter((a) => {
        const s = q.toLowerCase()
        return (
          a.title.toLowerCase().includes(s) ||
          a.description?.toLowerCase().includes(s) ||
          a.genre?.some((g) => g.toLowerCase().includes(s)) ||
          a.cast?.some((c) => c.toLowerCase().includes(s)) ||
          a.creator?.toLowerCase().includes(s)
        )
      }).slice(0, 12)

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('Voice search needs Chrome or Edge (Web Speech API).')
      return
    }
    if (listening) {
      recogRef.current?.stop()
      setListening(false)
      return
    }
    const r = new SR()
    r.lang = 'en-US'
    r.interimResults = false
    r.onresult = (ev) => {
      const text = ev.results[0][0].transcript
      setQ(text)
      setListening(false)
    }
    r.onerror = () => setListening(false)
    r.onend = () => setListening(false)
    recogRef.current = r
    setListening(true)
    r.start()
  }

  if (!open) return null

  return (
    <motion.div className="search-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="search-inner">
        <button type="button" className="search-close" onClick={onClose} aria-label="Close search"><i className="fas fa-times" /></button>
        <h1 className="search-title">Find your anime</h1>
        <div className="search-bar-row">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, genre, mood, cast…"
            className="search-input"
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
          />
          <button type="button" className={`mic-btn ${listening ? 'active' : ''}`} onClick={startVoice} title="Voice search">
            <i className="fas fa-microphone" />
          </button>
        </div>
        <div className="search-results-grid">
          {results.length === 0 && q.length >= 2 && <p className="no-res">No matches.</p>}
          {results.map((a, i) => (
            <AnimeCard key={a.id} anime={a} index={i} onSelect={(x) => { onSelectAnime(x); onClose() }} onTrailer={onTrailer} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
