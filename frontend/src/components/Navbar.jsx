import { motion } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const NAV_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Music',
  'Romance',
  'Sci-Fi',
  'Seinen',
  'Shojo',
  'Shonen',
]

export default function Navbar({
  onSearch,
  onWatchlist,
  onFavorites,
  onRecent,
  onRandom,
  onLogin,
  onSignup,
  onAdmin,
  onNew,
  onPopular,
  onSimulcast,
  onBrowseAllAZ,
  onReleaseCalendar,
  onGenreSelect,
  activeNav,
}) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const catRef = useRef(null)

  useEffect(() => {
    if (!categoriesOpen) return
    const onDoc = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCategoriesOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [categoriesOpen])

  const closeCategories = () => setCategoriesOpen(false)

  const pickGenre = (g) => {
    onGenreSelect?.(g)
    closeCategories()
    setMenuOpen(false)
  }

  const pickBrowse = (fn) => {
    fn?.()
    closeCategories()
    setMenuOpen(false)
  }

  return (
    <motion.nav className="navbar" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="nav-container">
        <div className="nav-logo">
          <img src="/weebly.png" alt="" className="logo-image" />
          <span>Weebly</span>
        </div>

        <button type="button" className="nav-burger" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
          <i className="fas fa-bars" />
        </button>

        <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <div className="nav-categories-wrap" ref={catRef}>
            <button
              type="button"
              className={`nav-cat-trigger ${categoriesOpen ? 'open' : ''}`}
              aria-expanded={categoriesOpen}
              aria-haspopup="true"
              onClick={() => setCategoriesOpen((o) => !o)}
            >
              Categories
              <i className="fas fa-chevron-down nav-cat-chevron" aria-hidden />
            </button>
            {categoriesOpen && (
              <div className="nav-cat-panel" role="menu">
                <div className="nav-cat-col nav-cat-links">
                  <button type="button" className="nav-cat-link" role="menuitem" onClick={() => pickBrowse(onBrowseAllAZ)}>
                    Browse All (A-Z)
                  </button>
                  <button type="button" className="nav-cat-link" role="menuitem" onClick={() => pickBrowse(onReleaseCalendar)}>
                    Release Calendar
                  </button>
                </div>
                <div className="nav-cat-col nav-cat-genres-wrap">
                  <div className="nav-cat-genres-title">Genres</div>
                  <ul className="nav-cat-genres">
                    {NAV_GENRES.map((g) => (
                      <li key={g}>
                        <button type="button" className="nav-cat-link nav-cat-genre" role="menuitem" onClick={() => pickGenre(g)}>
                          {g}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          <button type="button" className={`nav-link ${activeNav === 'new' ? 'active' : ''}`} onClick={() => { onNew(); setMenuOpen(false) }}>New</button>
          <button type="button" className={`nav-link ${activeNav === 'popular' ? 'active' : ''}`} onClick={() => { onPopular(); setMenuOpen(false) }}>Popular</button>
          <button type="button" className={`nav-link ${activeNav === 'simulcast' ? 'active' : ''}`} onClick={() => { onSimulcast(); setMenuOpen(false) }}>Simulcast</button>
        </div>

        <div className="nav-actions">
          <button type="button" className="nav-icon" onClick={onSearch} title="Search"><i className="fas fa-search" /></button>
          <button type="button" className="nav-icon" onClick={onWatchlist} title="Watchlist"><i className="fas fa-bookmark" /></button>
          <button type="button" className="nav-icon" onClick={onFavorites} title="Favorites"><i className="fas fa-heart" /></button>
          <button type="button" className="nav-icon" onClick={onRecent} title="Recently viewed"><i className="fas fa-history" /></button>
          <button type="button" className="nav-icon" onClick={onRandom} title="Random"><i className="fas fa-random" /></button>

          <div className="user-menu-wrap">
            <button type="button" className="nav-icon user-avatar" onClick={() => setUserOpen(!userOpen)}>
              <i className="fas fa-user" /> {user ? <span className="user-name-mini">{user.username}</span> : null}
            </button>
            {userOpen && (
              <div className="user-dropdown">
                {!user && (
                  <>
                    <button type="button" onClick={() => { onLogin(); setUserOpen(false) }}>Login</button>
                    <button type="button" onClick={() => { onSignup(); setUserOpen(false) }}>Sign Up</button>
                  </>
                )}
                {user && (
                  <>
                    {user.isAdmin && <button type="button" onClick={() => { onAdmin(); setUserOpen(false) }}>Admin Panel</button>}
                    <button type="button" onClick={() => { logout(); setUserOpen(false) }}>Logout</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
