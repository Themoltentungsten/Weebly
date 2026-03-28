import { motion } from 'framer-motion'
import AnimeGrid from './AnimeGrid'

export default function BrowseModal({ title, list, onClose, onSelect, onTrailer, savedListMode, onRemoveSaved }) {
  if (!title) return null
  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal-panel browse-panel" initial={{ scale: 0.96 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-x" onClick={onClose}><i className="fas fa-times" /></button>
        <h2>{title}</h2>
        <p className="browse-count">{list.length} titles</p>
        <div className="browse-scroll">
          <AnimeGrid
            list={list}
            onSelect={onSelect}
            onTrailer={onTrailer}
            savedListMode={savedListMode}
            onRemoveSaved={onRemoveSaved}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
