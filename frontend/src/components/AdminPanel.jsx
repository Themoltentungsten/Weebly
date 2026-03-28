import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import api from '../api/client'
import toast from 'react-hot-toast'
import { normalizeAnime } from '../utils/anime'

const emptyForm = () => ({
  title: '',
  year: new Date().getFullYear(),
  genre: '',
  rating: 8,
  poster: '',
  carousel_poster: '',
  trailer: '',
  description: '',
  cast: '',
  creator: '',
  director: '',
  studio: '',
  crunchyroll_url: '',
  duration: '24 min',
  language: 'Sub | Dub',
  anilist_id: '',
})

export default function AdminPanel({ open, onClose, onAnimeChanged }) {
  const [tab, setTab] = useState('anime')
  const [animeRows, setAnimeRows] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('')

  const load = async () => {
    try {
      const { data } = await api.get('/api/anime')
      setAnimeRows(data.map(normalizeAnime))
      const u = await api.get('/api/user/all')
      setUsers(u.data)
    } catch {
      toast.error('Admin load failed')
    }
  }

  useEffect(() => {
    if (open) load()
  }, [open])

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return animeRows
    return animeRows.filter((a) => a.title.toLowerCase().includes(q) || String(a.year).includes(q))
  }, [animeRows, filter])

  if (!open) return null

  const payloadFromForm = () => {
    const genre = form.genre.split(',').map((g) => g.trim()).filter(Boolean)
    const cast_members = form.cast.split(',').map((c) => c.trim()).filter(Boolean)
    const anilist_id =
      form.anilist_id === '' || form.anilist_id == null
        ? null
        : Math.max(0, parseInt(String(form.anilist_id), 10) || 0) || null
    return {
      title: form.title,
      year: Number(form.year),
      genre,
      rating: Number(form.rating),
      poster: form.poster,
      carousel_poster: form.carousel_poster.trim() || null,
      trailer: form.trailer,
      description: form.description,
      cast_members,
      creator: form.creator,
      director: form.director,
      studio: form.studio,
      crunchyroll_url: form.crunchyroll_url || null,
      duration: form.duration,
      language: form.language,
      anilist_id: anilist_id && Number.isFinite(anilist_id) ? anilist_id : null,
    }
  }

  const addAnime = async (e) => {
    e.preventDefault()
    if (editingId) return
    try {
      await api.post('/api/anime', payloadFromForm())
      toast.success('Anime added')
      setForm(emptyForm())
      load()
      onAnimeChanged?.()
    } catch {
      toast.error('Add failed (admin only)')
    }
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editingId) return
    try {
      await api.put(`/api/anime/${editingId}`, payloadFromForm())
      toast.success('Anime updated')
      setEditingId(null)
      setForm(emptyForm())
      load()
      onAnimeChanged?.()
    } catch {
      toast.error('Update failed')
    }
  }

  const startEdit = (a) => {
    setEditingId(a.id)
    setForm({
      title: a.title,
      year: a.year,
      genre: Array.isArray(a.genre) ? a.genre.join(', ') : '',
      rating: a.rating,
      poster: a.poster || '',
      carousel_poster: a.carousel_poster || a.carouselPoster || '',
      trailer: a.trailer || '',
      description: a.description || '',
      cast: Array.isArray(a.cast_members) ? a.cast_members.join(', ') : (a.cast || []).join(', '),
      creator: a.creator || '',
      director: a.director || '',
      studio: a.studio || '',
      crunchyroll_url: a.crunchyroll_url || a.crunchyrollUrl || '',
      duration: a.duration || '24 min',
      language: a.language || 'Sub | Dub',
      anilist_id: a.anilist_id != null ? String(a.anilist_id) : '',
    })
    setTab('anime')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm())
  }

  const delAnime = async (id) => {
    if (!confirm('Delete this anime?')) return
    try {
      await api.delete(`/api/anime/${id}`)
      toast.success('Deleted')
      if (editingId === id) cancelEdit()
      load()
      onAnimeChanged?.()
    } catch {
      toast.error('Delete failed')
    }
  }

  const delUser = async (id) => {
    if (!confirm('Delete user?')) return
    try {
      await api.delete(`/api/user/${id}`)
      toast.success('User removed')
      load()
    } catch {
      toast.error('Cannot delete')
    }
  }

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal-panel admin-panel" initial={{ scale: 0.96 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-x" onClick={onClose}><i className="fas fa-times" /></button>
        <h2>Admin</h2>
        <div className="admin-tabs">
          <button type="button" className={tab === 'anime' ? 'active' : ''} onClick={() => setTab('anime')}>Anime</button>
          <button type="button" className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Users</button>
        </div>
        {tab === 'anime' && (
          <>
            <p className="admin-hint">
              {editingId ? `Editing #${editingId}` : 'Add a new title or edit an existing row. Set AniList ID (e.g. 127230) so the detail modal loads characters & stats.'}
            </p>
            <form className="admin-form-compact" onSubmit={editingId ? saveEdit : addAnime}>
              <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <input placeholder="Year" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              <input placeholder="Genres (comma)" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} required />
              <input placeholder="Rating" type="number" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
              <input placeholder="AniList media ID (optional — for relations / cast / stats)" value={form.anilist_id} onChange={(e) => setForm({ ...form, anilist_id: e.target.value })} />
              <input placeholder="Poster URL (grid / portrait)" value={form.poster} onChange={(e) => setForm({ ...form, poster: e.target.value })} required />
              <input placeholder="Hero carousel URL (wide — optional)" value={form.carousel_poster} onChange={(e) => setForm({ ...form, carousel_poster: e.target.value })} />
              <input placeholder="Trailer URL" value={form.trailer} onChange={(e) => setForm({ ...form, trailer: e.target.value })} required />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={2} />
              <input placeholder="Cast (comma)" value={form.cast} onChange={(e) => setForm({ ...form, cast: e.target.value })} />
              <input placeholder="Creator" value={form.creator} onChange={(e) => setForm({ ...form, creator: e.target.value })} />
              <input placeholder="Director" value={form.director} onChange={(e) => setForm({ ...form, director: e.target.value })} />
              <input placeholder="Studio" value={form.studio} onChange={(e) => setForm({ ...form, studio: e.target.value })} />
              <input placeholder="Crunchyroll URL" value={form.crunchyroll_url} onChange={(e) => setForm({ ...form, crunchyroll_url: e.target.value })} />
              <input placeholder="Duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              <input placeholder="Language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
              <div className="admin-form-actions">
                {editingId ? (
                  <>
                    <button type="submit" className="btn-glow primary">Save changes</button>
                    <button type="button" className="btn-glow ghost" onClick={cancelEdit}>Cancel edit</button>
                  </>
                ) : (
                  <button type="submit" className="btn-glow primary">Add anime</button>
                )}
              </div>
            </form>
            <input
              className="admin-filter"
              placeholder="Filter catalog…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div className="admin-table-wrap admin-table-tall">
              <table className="admin-table">
                <thead>
                  <tr><th>Title</th><th>Year</th><th>AniList</th><th>Rating</th><th /></tr>
                </thead>
                <tbody>
                  {filteredRows.map((a) => (
                    <tr key={a.id}>
                      <td>{a.title.replace(/<br\s*\/?>/gi, ' ')}</td>
                      <td>{a.year}</td>
                      <td>{a.anilist_id ?? '—'}</td>
                      <td>{a.rating}</td>
                      <td className="admin-row-actions">
                        <button type="button" className="btn-small" onClick={() => startEdit(a)}>Edit</button>
                        <button type="button" className="btn-small danger" onClick={() => delAnime(a.id)}>Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {tab === 'users' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>User</th><th>Email</th><th>Admin</th><th /></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.is_admin ? 'yes' : ''}</td>
                    <td>
                      {!u.is_admin ? (
                        <button type="button" className="btn-small danger" onClick={() => delUser(u.id)}>Del</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
