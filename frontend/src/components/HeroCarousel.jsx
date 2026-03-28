import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const CAROUSEL_INTERVAL_MS = 80_000
const VIDEO_START_SEC = 10
/** Show static carousel poster first, then fade in the trailer video */
const POSTER_HOLD_MS = 3000

/** @typedef {{ videoFile: string | string[], matchTitle: string, startSec?: number }} HeroSlide */

/** @type {HeroSlide[]} */
const SLIDES = [
  { videoFile: 'demon-slayer.mp4', matchTitle: 'Infinity Castle', startSec: 11 },
  { videoFile: 'dandadan.mp4', matchTitle: 'Dandadan' },
  { videoFile: 'jjk-culling.mp4', matchTitle: 'Culling Game', startSec: 17 },
  { videoFile: 'chainsaw-reze.mp4', matchTitle: 'Reze Arc', startSec: 6 },
]

function listVideoFiles(slide) {
  return Array.isArray(slide.videoFile) ? slide.videoFile : [slide.videoFile]
}

function videoSrc(name) {
  const seg = name.split('/').map((p) => encodeURIComponent(p)).join('/')
  return `/carousel/${seg}`
}

function displayTitle(t) {
  if (!t) return ''
  return t.replace(/<br\s*\/?>/gi, ' ')
}

export default function HeroCarousel({ animeList, onOpenDetail, onPlayTrailer, onToggleWatchlist, heroInWatchlist, user }) {
  const [index, setIndex] = useState(0)
  const indexRef = useRef(index)
  const videoRefs = useRef([])
  const [showVideo, setShowVideo] = useState(false)
  /** Fallback filename index per slide when <video> errors (e.g. missing file) */
  const [filePick, setFilePick] = useState(() => SLIDES.map(() => 0))
  /**
   * Browsers block unmuted autoplay; we start muted so video always starts, then user can unmute.
   */
  const [heroMuted, setHeroMuted] = useState(true)

  indexRef.current = index

  const resolveAnime = useCallback(
    (matchTitle) => animeList.find((a) => a.title.includes(matchTitle)) || null,
    [animeList]
  )

  const current = SLIDES[index]
  const anime = resolveAnime(current.matchTitle)

  useEffect(() => {
    setShowVideo(false)
    const t = setTimeout(() => setShowVideo(true), POSTER_HOLD_MS)
    return () => clearTimeout(t)
  }, [index])

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length)
    }, CAROUSEL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    videoRefs.current.forEach((el) => {
      if (el) el.muted = heroMuted
    })
  }, [heroMuted])

  useEffect(() => {
    videoRefs.current.forEach((el, i) => {
      if (!el) return
      if (i !== index) {
        el.pause()
        return
      }
      if (!showVideo) return
      el.muted = heroMuted
      el.volume = 1
      const startSec = SLIDES[i].startSec ?? VIDEO_START_SEC
      const applySeekAndPlay = () => {
        if (indexRef.current !== i) return
        const dur = el.duration
        let t = startSec
        if (Number.isFinite(dur) && dur > 0) t = Math.min(startSec, Math.max(0, dur - 0.25))
        try {
          el.currentTime = t
        } catch {
          /* ignore */
        }
        el.play().catch(() => {
          if (!heroMuted) {
            el.muted = true
            setHeroMuted(true)
            el.play().catch(() => {})
          }
        })
      }
      if (el.readyState >= HTMLMediaElement.HAVE_METADATA) applySeekAndPlay()
      else el.addEventListener('loadedmetadata', applySeekAndPlay, { once: true })
    })
    // Do not depend on heroMuted — toggling mute must only change audio, not re-seek
  }, [index, showVideo])

  const onVideoError = (slideIdx) => {
    setFilePick((prev) => {
      const files = listVideoFiles(SLIDES[slideIdx])
      const cur = prev[slideIdx] ?? 0
      if (cur + 1 >= files.length) return prev
      const next = [...prev]
      next[slideIdx] = cur + 1
      return next
    })
  }

  const go = (dir) => {
    setIndex((i) => {
      const n = i + dir
      if (n < 0) return SLIDES.length - 1
      if (n >= SLIDES.length) return 0
      return n
    })
  }

  const wlSaved = anime && typeof heroInWatchlist === 'function' ? heroInWatchlist(anime) : false

  const pushWatchlist = () => {
    if (!user) {
      toast.error('Login to use watchlist')
      return
    }
    if (anime) onToggleWatchlist(anime.id)
  }

  const toggleHeroMute = () => {
    setHeroMuted((m) => !m)
  }

  /** Wide art: custom carousel still → AniList banner → portrait poster */
  const heroStillSrc =
    anime?.carousel_poster ||
    anime?.carouselPoster ||
    anime?.banner ||
    anime?.poster ||
    '/weebly.png'
  const title = displayTitle(anime?.title) || current.matchTitle
  const rating = anime?.rating ?? '—'
  const genres = anime?.genre?.join(', ') || ''
  const desc = anime?.description || ''

  return (
    <section className="hero-netflix">
      <AnimatePresence mode="wait">
        <motion.div key={index} className="hero-slide-inner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
          <div className="hero-media">
            <img src={heroStillSrc} alt="" className={`hero-poster-bg ${showVideo ? 'dim' : ''}`} />
            {SLIDES.map((s, i) => {
              const files = listVideoFiles(s)
              const pick = Math.min(filePick[i] ?? 0, files.length - 1)
              const fileName = files[pick]
              return (
                <video
                  key={`hero-vid-${i}-${pick}`}
                  ref={(el) => { videoRefs.current[i] = el }}
                  className={`hero-video-bg ${i === index && showVideo ? 'visible' : ''}`}
                  src={videoSrc(fileName)}
                  playsInline
                  muted={heroMuted}
                  loop
                  preload={i === index ? 'auto' : 'metadata'}
                  onError={() => onVideoError(i)}
                />
              )
            })}
            <div className="hero-vignette" />
            <button
              type="button"
              className="hero-audio-toggle"
              onClick={toggleHeroMute}
              aria-pressed={!heroMuted}
              aria-label={heroMuted ? 'Unmute hero video' : 'Mute hero video'}
              title={heroMuted ? 'Unmute sound' : 'Mute sound'}
            >
              <i className={`fas ${heroMuted ? 'fa-volume-mute' : 'fa-volume-up'}`} aria-hidden />
            </button>
          </div>
          <div className="hero-content-netflix">
            <motion.h1 className="hero-title-netflix" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
              {title}
            </motion.h1>
            <div className="hero-meta-netflix">
              <span className="pill-rating">{rating}/10</span>
              {genres && <span className="pill-genres">{genres}</span>}
            </div>
            <p className="hero-desc-netflix">{desc.slice(0, 220)}{desc.length > 220 ? '…' : ''}</p>
            <div className="hero-actions-netflix">
              <button type="button" className="btn-glow primary" onClick={() => anime && onPlayTrailer(anime)}>
                <i className="fas fa-play" /> Watch trailer
              </button>
              <button
                type="button"
                className={`btn-glow ghost hero-wl-btn ${wlSaved ? 'is-saved' : ''}`}
                onClick={pushWatchlist}
                title={wlSaved ? 'Unsave from watchlist' : 'Save to watchlist'}
                aria-label={wlSaved ? 'Unsave from watchlist' : 'Save to watchlist'}
              >
                <i className={wlSaved ? 'fas fa-bookmark' : 'far fa-bookmark'} aria-hidden />
              </button>
              {anime && (
                <button type="button" className="btn-glow outline" onClick={() => onOpenDetail(anime)}>
                  Details
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <button type="button" className="hero-arrow prev" aria-label="Previous" onClick={() => go(-1)}>
        <i className="fas fa-chevron-left" />
      </button>
      <button type="button" className="hero-arrow next" aria-label="Next" onClick={() => go(1)}>
        <i className="fas fa-chevron-right" />
      </button>
      <div className="hero-dots">
        {SLIDES.map((_, i) => (
          <button key={String(i)} type="button" className={i === index ? 'active' : ''} aria-label={`Slide ${i + 1}`} onClick={() => setIndex(i)} />
        ))}
      </div>
    </section>
  )
}
