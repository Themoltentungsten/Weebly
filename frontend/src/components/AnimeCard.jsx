import { motion } from 'framer-motion'

export default function AnimeCard({ anime, onSelect, onTrailer, index = 0, savedListMode, onRemoveSaved }) {
  const removeLabel = savedListMode === 'watchlist' ? 'Unsave' : 'Unfavorite'
  return (
    <motion.article
      className="anime-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      onClick={() => onSelect(anime)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(anime)}
    >
      <div className="anime-card-poster-wrap">
        {savedListMode && onRemoveSaved && (
          <button
            type="button"
            className="card-remove-saved"
            title={removeLabel}
            aria-label={removeLabel}
            onClick={(e) => {
              e.stopPropagation()
              onRemoveSaved(anime, savedListMode)
            }}
          >
            <i className="fas fa-times" aria-hidden />
          </button>
        )}
        <img src={anime.poster} alt="" className="anime-poster" loading="lazy" />
        <div className="anime-card-shine" />
        <div className="anime-card-actions-row" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="icon-round" title="Trailer" onClick={() => onTrailer(anime)}>
            <i className="fas fa-play" />
          </button>
        </div>
      </div>
      <div className="anime-info">
        <h3 className="anime-title">{anime.title.replace(/<br\s*\/?>/gi, ' ')}</h3>
        <div className="anime-meta">
          <span className="anime-rating">{anime.rating}/10</span>
          <span className="anime-year">{anime.year}</span>
        </div>
        <p className="anime-genres">{anime.genre?.join(', ')}</p>
      </div>
    </motion.article>
  )
}
