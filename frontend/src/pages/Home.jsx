import { useEffect, useMemo, useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import api from '../api/client'
import { normalizeAnime } from '../utils/anime'
import Navbar from '../components/Navbar'
import HeroCarousel from '../components/HeroCarousel'
import AnimeGrid from '../components/AnimeGrid'
import AnimeModal from '../components/AnimeModal'
import TrailerModal from '../components/TrailerModal'
import SearchOverlay from '../components/SearchOverlay'
import ChatBot from '../components/ChatBot'
import LoginModal from '../components/LoginModal'
import SignupModal from '../components/SignupModal'
import AdminPanel from '../components/AdminPanel'
import BrowseModal from '../components/BrowseModal'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const YEAR_FILTERS = [
  { key: 'all', label: 'All' },
  { key: '2020-2025', label: '2020–2025' },
  { key: '2015-2019', label: '2015–2019' },
  { key: '2010-2014', label: '2010–2014' },
  { key: '2000-2009', label: '2000–2009' },
]

const emptySaved = () => ({ watchlist: new Set(), favorites: new Set() })

export default function Home() {
  const { user, ready } = useAuth()
  const [rawList, setRawList] = useState([])
  const [savedSets, setSavedSets] = useState(emptySaved)
  const [yearKey, setYearKey] = useState('all')
  const [activeNav, setActiveNav] = useState('')
  const [loading, setLoading] = useState(true)

  const [searchOpen, setSearchOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [browse, setBrowse] = useState(null)
  const [detail, setDetail] = useState(null)
  const [trailer, setTrailer] = useState(null)

  const loadAnime = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/anime')
      setRawList(data.map(normalizeAnime))
    } catch {
      toast.error('Cannot load anime — is the API running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnime()
  }, [loadAnime])

  const refreshSavedSets = useCallback(async () => {
    if (!user) {
      setSavedSets(emptySaved())
      return
    }
    try {
      const [wl, fav] = await Promise.all([
        api.get('/api/user/watchlist'),
        api.get('/api/user/favorites'),
      ])
      setSavedSets({
        watchlist: new Set(wl.data.map((a) => a.id)),
        favorites: new Set(fav.data.map((a) => a.id)),
      })
    } catch {
      /* keep previous */
    }
  }, [user])

  useEffect(() => {
    refreshSavedSets()
  }, [refreshSavedSets])

  const animeList = useMemo(() => {
    let list = rawList
    if (yearKey !== 'all' && yearKey.includes('-')) {
      const [a, b] = yearKey.split('-').map(Number)
      list = list.filter((x) => x.year >= a && x.year <= b)
    }
    return list
  }, [rawList, yearKey])

  const openBrowse = (title, list) => {
    setBrowse({ title, list })
    setActiveNav(
      title === 'New anime' ? 'new'
        : title === 'Popular' ? 'popular'
          : title === 'Simulcast' ? 'simulcast'
            : '',
    )
  }

  const newList = useMemo(() => rawList.filter((a) => a.year >= 2020).sort((a, b) => b.year - a.year), [rawList])
  const popularList = useMemo(() => [...rawList].sort((a, b) => b.rating - a.rating), [rawList])
  const simulcastList = useMemo(() => rawList.filter((a) => a.year >= 2023).sort((a, b) => b.year - a.year), [rawList])

  const randomPick = () => {
    if (!rawList.length) return
    const a = rawList[Math.floor(Math.random() * rawList.length)]
    setDetail(a)
  }

  const openBrowseAZ = () => {
    openBrowse('Browse all (A–Z)', [...rawList].sort((a, b) => a.title.localeCompare(b.title)))
  }

  const openReleaseCalendar = () => {
    openBrowse('Release calendar', [...rawList].sort((a, b) => b.year - a.year || a.title.localeCompare(b.title)))
  }

  const openGenreBrowse = (genre) => {
    const list = rawList.filter(
      (a) => Array.isArray(a.genre) && a.genre.some((g) => g.toLowerCase() === genre.toLowerCase()),
    )
    if (!list.length) {
      toast.error(`No titles tagged “${genre}” yet`)
      return
    }
    openBrowse(genre, list)
  }

  const openWatchlist = async () => {
    if (!user) {
      toast.error('Login to view watchlist')
      setLoginOpen(true)
      return
    }
    try {
      const { data } = await api.get('/api/user/watchlist')
      openBrowse('My watchlist', data.map(normalizeAnime))
    } catch {
      toast.error('Failed to load watchlist')
    }
  }

  const openFavorites = async () => {
    if (!user) {
      toast.error('Login first')
      setLoginOpen(true)
      return
    }
    try {
      const { data } = await api.get('/api/user/favorites')
      openBrowse('Favorites', data.map(normalizeAnime))
    } catch {
      toast.error('Failed to load favorites')
    }
  }

  const openRecent = async () => {
    if (!user) {
      toast.error('Login first')
      setLoginOpen(true)
      return
    }
    try {
      const { data } = await api.get('/api/user/recently-viewed')
      openBrowse('Recently viewed', data.map(normalizeAnime))
    } catch {
      toast.error('Failed to load history')
    }
  }

  const heroToggleWatchlist = async (id) => {
    if (!user) {
      setLoginOpen(true)
      return
    }
    const inWl = savedSets.watchlist.has(id)
    try {
      if (inWl) {
        await api.delete(`/api/user/watchlist/${id}`)
        toast.success('Removed from watchlist')
      } else {
        await api.post(`/api/user/watchlist/${id}`)
        toast.success('Saved to watchlist')
      }
      await refreshSavedSets()
    } catch {
      toast.error('Could not update watchlist')
    }
  }

  const removeFromSavedBrowse = async (anime, mode) => {
    try {
      if (mode === 'watchlist') await api.delete(`/api/user/watchlist/${anime.id}`)
      else await api.delete(`/api/user/favorites/${anime.id}`)
      toast.success(mode === 'watchlist' ? 'Unsaved from watchlist' : 'Removed from favorites')
      await refreshSavedSets()
      setBrowse((b) => (b ? { ...b, list: b.list.filter((x) => x.id !== anime.id) } : null))
    } catch {
      toast.error('Could not update')
    }
  }

  if (!ready) {
    return <div className="page-loading"><div className="skeleton-hero" /></div>
  }

  return (
    <div className="app-shell">
      <Navbar
        activeNav={activeNav}
        onSearch={() => setSearchOpen(true)}
        onWatchlist={openWatchlist}
        onFavorites={openFavorites}
        onRecent={openRecent}
        onRandom={randomPick}
        onLogin={() => setLoginOpen(true)}
        onSignup={() => setSignupOpen(true)}
        onAdmin={() => setAdminOpen(true)}
        onNew={() => openBrowse('New anime', newList)}
        onPopular={() => openBrowse('Popular', popularList)}
        onSimulcast={() => openBrowse('Simulcast', simulcastList)}
        onBrowseAllAZ={openBrowseAZ}
        onReleaseCalendar={openReleaseCalendar}
        onGenreSelect={openGenreBrowse}
      />

      <HeroCarousel
        animeList={rawList}
        user={user}
        heroInWatchlist={anime => (anime ? savedSets.watchlist.has(anime.id) : false)}
        onOpenDetail={setDetail}
        onPlayTrailer={setTrailer}
        onToggleWatchlist={heroToggleWatchlist}
      />

      <main className="main-area">
        <section className="section-block">
          <div className="section-head">
            <h2>Trending anime</h2>
            <div className="filter-tabs">
              {YEAR_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`filter-tab ${yearKey === f.key ? 'active' : ''}`}
                  onClick={() => setYearKey(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {loading ? <div className="grid-skeleton" /> : <AnimeGrid list={animeList} onSelect={setDetail} onTrailer={setTrailer} />}
        </section>

        <section className="cat-cta">
          <img src="/image.png" alt="" className="cat-img" />
          <div>
            <h3>Still deciding?</h3>
            <p>Browse the full catalog or ask the AI mood bot.</p>
            <button type="button" className="btn-glow primary" onClick={() => openBrowse('All titles A–Z', [...rawList].sort((a, b) => a.title.localeCompare(b.title)))}>
              View all
            </button>
          </div>
        </section>
      </main>

      <Footer />

      <ChatBot onOpenAnime={setDetail} />

      <AnimatePresence>
        {searchOpen && (
          <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} animeList={rawList} onSelectAnime={setDetail} onTrailer={setTrailer} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detail && (
          <AnimeModal
            anime={detail}
            onClose={() => setDetail(null)}
            onPlayTrailer={(a) => setTrailer(a)}
            inWatchlist={!!user && savedSets.watchlist.has(detail.id)}
            inFavorites={!!user && savedSets.favorites.has(detail.id)}
            onSavedChange={refreshSavedSets}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {trailer && <TrailerModal anime={trailer} onClose={() => setTrailer(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {browse && (
          <BrowseModal
            title={browse.title}
            list={browse.list}
            savedListMode={browse.title === 'My watchlist' ? 'watchlist' : browse.title === 'Favorites' ? 'favorites' : null}
            onRemoveSaved={(a, mode) => removeFromSavedBrowse(a, mode)}
            onClose={() => setBrowse(null)}
            onSelect={(a) => { setDetail(a); setBrowse(null) }}
            onTrailer={setTrailer}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loginOpen && <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSwitchSignup={() => { setLoginOpen(false); setSignupOpen(true) }} />}
        {signupOpen && <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} onSwitchLogin={() => { setSignupOpen(false); setLoginOpen(true) }} />}
        {adminOpen && user?.isAdmin && (
          <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} onAnimeChanged={loadAnime} />
        )}
      </AnimatePresence>
    </div>
  )
}
