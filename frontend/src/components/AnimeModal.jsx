import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import AnimeAnilistExtras from './AnimeAnilistExtras'

function titleCaseAnilist(s) {
  if (!s) return ''
  return s
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function AnimeModal({
  anime,
  onClose,
  onPlayTrailer,
  inWatchlist = false,
  inFavorites = false,
  onSavedChange,
}) {
  const { user } = useAuth()
  const [extras, setExtras] = useState(null)
  const [extrasLoading, setExtrasLoading] = useState(false)
  const [extrasErr, setExtrasErr] = useState(null)

  useEffect(() => {
    if (!anime?.id) return undefined
    let cancelled = false
    setExtras(null)
    setExtrasErr(null)
    setExtrasLoading(true)
    const load = () =>
      api.get(`/api/anime/extras/${anime.id}`).then(({ data }) => {
        if (!cancelled) {
          setExtras(data)
          setExtrasErr(null)
        }
      })

    load()
      .catch((err) => {
        if (cancelled) return
        const status = err.response?.status
        const isNetwork = !err.response
        if (isNetwork) {
          return load().catch(() => {
            if (!cancelled) {
              setExtrasErr(
                'Could not reach the API. Start the backend and use the same host for the app (localhost vs 127.0.0.1).',
              )
            }
          })
        }
        if (!cancelled) {
          setExtrasErr(
            status === 404
              ? 'Extras endpoint missing — pull latest backend and restart the server.'
              : 'Could not load AniList extras. Check the backend console and network tab.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setExtrasLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [anime?.id])

  if (!anime) return null

  const title = anime.title.replace(/<br\s*\/?>/gi, ' ')

  const toggleWl = async () => {
    if (!user) return toast.error('Login first')
    try {
      if (inWatchlist) {
        await api.delete(`/api/user/watchlist/${anime.id}`)
        toast.success('Removed from watchlist')
      } else {
        await api.post(`/api/user/watchlist/${anime.id}`)
        toast.success('Saved to watchlist')
      }
      onSavedChange?.()
    } catch {
      toast.error('Could not update watchlist')
    }
  }

  const toggleFav = async () => {
    if (!user) return toast.error('Login first')
    try {
      if (inFavorites) {
        await api.delete(`/api/user/favorites/${anime.id}`)
        toast.success('Removed from favorites')
      } else {
        await api.post(`/api/user/favorites/${anime.id}`)
        toast.success('Added to favorites')
      }
      onSavedChange?.()
    } catch {
      toast.error('Could not update favorites')
    }
  }

  const markRecent = async () => {
    if (!user) return
    try {
      await api.post(`/api/user/recently-viewed/${anime.id}`)
    } catch { /* ignore */ }
  }

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal-panel anime-detail-modal" initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-x" onClick={onClose} aria-label="Close">
          <i className="fas fa-times" />
        </button>
        {anime.banner && (
          <div className="anime-modal-banner">
            <img src={anime.banner} alt="" />
          </div>
        )}
        <div className="anime-details-layout" onPointerEnter={markRecent}>
          <div className="anime-details-poster">
            <img src={anime.poster} alt="" />
          </div>
          <div className="anime-details-body">
            <h2>{title}</h2>
            <div className="anime-details-meta">
              <span>{anime.rating}/10</span>
              <span>{anime.year}</span>
              <span>{anime.duration}</span>
              <span>{anime.language}</span>
              {anime.meanScore != null && <span>AniList {anime.meanScore}/100</span>}
              {anime.anilistFormat && <span>{titleCaseAnilist(anime.anilistFormat)}</span>}
              {anime.anilistStatus && <span>{titleCaseAnilist(anime.anilistStatus)}</span>}
              {anime.episodes != null && anime.episodes > 0 && <span>{anime.episodes} eps</span>}
            </div>
            {anime.anilistTags?.length > 0 && (
              <div className="anilist-tags-row" aria-label="AniList tags">
                {anime.anilistTags.map((tag) => (
                  <span key={tag} className="anilist-tag-pill">{tag}</span>
                ))}
              </div>
            )}
            <p className="desc">{anime.description}</p>
            {anime.anilistId && (
              <p className="anilist-attrib">
                <a href={`https://anilist.co/anime/${anime.anilistId}/`} target="_blank" rel="noreferrer">Open on AniList</a>
              </p>
            )}
            <div className="detail-block">
              <h4>Cast</h4>
              <p>{anime.cast?.join(', ')}</p>
            </div>
            <div className="detail-block">
              <h4>Creator / Director</h4>
              <p>{anime.creator} — {anime.director}</p>
            </div>
            <div className="detail-block">
              <h4>Studio</h4>
              <p>{anime.studio}</p>
            </div>
            <div className="detail-actions">
              <button type="button" className="btn-glow primary" onClick={() => onPlayTrailer(anime)}>
                <i className="fas fa-play" /> Watch trailer
              </button>
              <button type="button" className={`btn-glow ghost ${inWatchlist ? 'is-saved' : ''}`} onClick={toggleWl}>
                <i className={inWatchlist ? 'fas fa-bookmark' : 'far fa-bookmark'} aria-hidden /> {inWatchlist ? 'Unsave' : 'Save'}
              </button>
              <button type="button" className={`btn-glow ghost ${inFavorites ? 'is-saved' : ''}`} onClick={toggleFav}>
                <i className={inFavorites ? 'fas fa-heart' : 'far fa-heart'} aria-hidden /> {inFavorites ? 'Unfavorite' : 'Favorite'}
              </button>
              {anime.crunchyrollUrl && (
                <a href={anime.crunchyrollUrl} target="_blank" rel="noreferrer" className="btn-glow outline">Crunchyroll</a>
              )}
            </div>
            {anime.trailer?.includes('imdb.com') && (
              <p className="hint">Trailer opens on IMDb from the Watch trailer button.</p>
            )}
          </div>
        </div>
        <AnimeAnilistExtras data={extras} loading={extrasLoading} error={extrasErr} />
      </motion.div>
    </motion.div>
  )
}
