import { motion } from 'framer-motion'
import { isYouTubeOrEmbed, toEmbedUrl } from '../utils/anime'

export default function TrailerModal({ anime, onClose }) {
  if (!anime) return null
  const title = anime.title.replace(/<br\s*\/?>/gi, ' ')
  const t = anime.trailer

  let body
  if (t?.includes('imdb.com')) {
    body = (
      <div className="trailer-imdb">
        <img src={anime.poster} alt="" className="trailer-poster-preview" />
        <p>Open the official trailer on IMDb.</p>
        <a href={t} target="_blank" rel="noreferrer" className="btn-glow primary">Open IMDb trailer</a>
      </div>
    )
  } else if (isYouTubeOrEmbed(t)) {
    body = (
      <div className="trailer-frame">
        <iframe title="Trailer" src={toEmbedUrl(t)} allowFullScreen />
      </div>
    )
  } else if (t) {
    body = (
      <div className="trailer-imdb">
        <a href={t} target="_blank" rel="noreferrer" className="btn-glow primary">Open trailer</a>
      </div>
    )
  } else {
    body = <p>No trailer linked.</p>
  }

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal-panel trailer-panel" initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-x" onClick={onClose}><i className="fas fa-times" /></button>
        <h2>{title}</h2>
        {body}
      </motion.div>
    </motion.div>
  )
}
