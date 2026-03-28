function formatRelationType(s) {
  if (!s) return ''
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function statusColor(status) {
  const u = (status || '').toUpperCase()
  if (u === 'COMPLETED') return '#22c55e'
  if (u === 'PLANNING') return '#3b82f6'
  if (u === 'CURRENT') return '#a855f7'
  if (u === 'PAUSED') return '#ec4899'
  if (u === 'DROPPED') return '#71717a'
  return '#64748b'
}

function scoreHue(score) {
  const s = Math.min(100, Math.max(10, score))
  return 0 + ((s - 10) / 90) * 125
}

export default function AnimeAnilistExtras({ data, loading, error }) {
  if (loading) {
    return <div className="anilist-extras anilist-extras-loading">Loading AniList relations, cast & stats…</div>
  }
  if (error) {
    return <div className="anilist-extras anilist-extras-err">{error}</div>
  }
  if (!data || !data.anilistId) {
    return (
      <div className="anilist-extras anilist-extras-muted">
        Link this title to AniList (set AniList ID in admin or use an AniList poster URL) for characters, stats, and recommendations.
      </div>
    )
  }

  const { relations = [], characters = [], recommendations = [], statusDistribution = [], scoreDistribution = [] } = data

  const statusTotal = statusDistribution.reduce((a, x) => a + (x.amount || 0), 0) || 1
  const scoreMax = Math.max(...scoreDistribution.map((x) => x.amount || 0), 1)

  return (
    <div className="anilist-extras">
      <p className="anilist-extras-source">
        Characters, stats & recommendations from{' '}
        <a href={`https://anilist.co/anime/${data.anilistId}/`} target="_blank" rel="noreferrer">AniList</a>
      </p>

      {relations.length > 0 && (
        <section className="anix-section">
          <h3 className="anix-heading">Relations</h3>
          <div className="anix-scroll anix-relations">
            {relations.map((r) => (
              <a
                key={`${r.relationType}-${r.id}-${r.title}`}
                className="anix-rel-card"
                href={r.type === 'MANGA' ? `https://anilist.co/manga/${r.id}/` : `https://anilist.co/anime/${r.id}/`}
                target="_blank"
                rel="noreferrer"
              >
                <div className="anix-rel-img-wrap">
                  {r.cover ? <img src={r.cover} alt="" /> : <div className="anix-ph" />}
                  <span className="anix-rel-badge">{formatRelationType(r.relationType)}</span>
                </div>
                <span className="anix-rel-title">{r.title}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {characters.length > 0 && (
        <section className="anix-section">
          <h3 className="anix-heading">Characters</h3>
          <div className="anix-char-grid">
            {characters.map((c) => (
              <div key={`${c.name}-${c.role}`} className="anix-char-row">
                <div className="anix-char-side">
                  {c.image ? <img src={c.image} alt="" className="anix-face" /> : <div className="anix-face anix-ph" />}
                  <div>
                    <div className="anix-char-name">{c.name}</div>
                    <div className="anix-char-role">{formatRelationType(c.role)}</div>
                  </div>
                </div>
                <div className="anix-va-side">
                  {(c.voiceActors && c.voiceActors.length > 0) ? (
                    c.voiceActors.slice(0, 2).map((v) => (
                      <div key={v.name} className="anix-va-block">
                        <div className="anix-va-text">
                          <span className="anix-va-name">{v.name}</span>
                          <span className="anix-va-lang">{v.language}</span>
                        </div>
                        {v.image ? <img src={v.image} alt="" className="anix-face sm" /> : null}
                      </div>
                    ))
                  ) : (
                    <span className="anix-muted">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {statusDistribution.length > 0 && (
        <section className="anix-section">
          <h3 className="anix-heading">List status</h3>
          <div className="anix-status-legend">
            {statusDistribution.map((s) => (
              <span key={s.status} className="anix-status-pill" style={{ borderColor: statusColor(s.status) }}>
                <i style={{ background: statusColor(s.status) }} />
                {formatRelationType(s.status)} · {(s.amount || 0).toLocaleString()}
              </span>
            ))}
          </div>
          <div className="anix-status-bar">
            {statusDistribution.map((s) => (
              <div
                key={s.status}
                className="anix-status-seg"
                style={{
                  width: `${((s.amount || 0) / statusTotal) * 100}%`,
                  background: statusColor(s.status),
                }}
                title={`${s.status}: ${s.amount}`}
              />
            ))}
          </div>
        </section>
      )}

      {scoreDistribution.length > 0 && (
        <section className="anix-section">
          <h3 className="anix-heading">Score distribution</h3>
          <div className="anix-score-chart">
            {scoreDistribution.map((b) => (
              <div key={b.score} className="anix-score-col">
                <div
                  className="anix-score-bar"
                  style={{
                    height: `${Math.max(4, ((b.amount || 0) / scoreMax) * 100)}%`,
                    background: `hsl(${scoreHue(b.score)}, 72%, 48%)`,
                  }}
                  title={`${b.score}: ${b.amount}`}
                />
                <span className="anix-score-label">{b.score}</span>
                <span className="anix-score-amt">{(b.amount || 0) > 999 ? `${Math.round((b.amount || 0) / 1000)}k` : b.amount}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="anix-section">
          <h3 className="anix-heading">Recommendations</h3>
          <div className="anix-scroll anix-recs">
            {recommendations.map((rec) => (
              <a
                key={rec.anilistId}
                className="anix-rec-card"
                href={`https://anilist.co/anime/${rec.anilistId}/`}
                target="_blank"
                rel="noreferrer"
              >
                {rec.cover ? <img src={rec.cover} alt="" /> : <div className="anix-ph wide" />}
                <span className="anix-rec-title">{rec.title}</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
