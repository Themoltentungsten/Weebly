export function normalizeAnime(row) {
  if (!row) return null
  return {
    ...row,
    cast: row.cast_members || [],
    crunchyrollUrl: row.crunchyroll_url || '',
    carouselPoster: row.carousel_poster || '',
    banner: row.banner || '',
    anilistId: row.anilist_id ?? null,
    anilistStatus: row.anilist_status || '',
    anilistFormat: row.anilist_format || '',
    meanScore: row.mean_score ?? null,
    anilistTags: Array.isArray(row.anilist_tags) ? row.anilist_tags : [],
  }
}

export function isYouTubeOrEmbed(trailer) {
  if (!trailer) return false
  return trailer.includes('youtube.com/embed') || trailer.includes('youtu.be') || trailer.includes('youtube.com/watch')
}

export function toEmbedUrl(trailer) {
  if (!trailer) return ''
  if (trailer.includes('youtube.com/embed')) return trailer
  const m = trailer.match(/(?:v=|youtu\.be\/)([\w-]+)/)
  if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`
  return trailer
}
