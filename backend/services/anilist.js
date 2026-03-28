/**
 * AniList GraphQL API (public, no key required) — for academic / college use.
 * @see https://anilist.gitbook.io/anilist-apiv2-docs/
 */

const ANILIST_URL = 'https://graphql.anilist.co';

const BY_ID_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji english }
    coverImage { extraLarge large }
  }
}
`;

const SEARCH_QUERY = `
query ($search: String) {
  Media(search: $search, type: ANIME) {
    id
    format
    status
    episodes
    seasonYear
    meanScore
    genres
    bannerImage
    coverImage { extraLarge large }
    description(asHtml: false)
    tags {
      name
    }
  }
}
`;

function stripHtml(s) {
  if (!s) return '';
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function mapMedia(m) {
  if (!m) return null;
  const genres = Array.isArray(m.genres) ? m.genres : [];
  const tagList = Array.isArray(m.tags) ? m.tags : [];
  const tagNames = tagList.map((t) => t?.name).filter(Boolean);
  const extraTags = tagNames.filter((t) => !genres.includes(t));
  const anilistTags = [...new Set([...genres, ...extraTags])].slice(0, 14);

  const cover = m.coverImage?.extraLarge || m.coverImage?.large || null;

  return {
    anilistId: m.id,
    banner: m.bannerImage || null,
    anilistStatus: m.status || null,
    episodes: m.episodes != null ? m.episodes : null,
    anilistFormat: m.format || null,
    meanScore: m.meanScore != null ? m.meanScore : null,
    anilistTags,
    poster: cover,
    description: stripHtml(m.description || ''),
    seasonYear: m.seasonYear,
  };
}

async function fetchMediaById(anilistId) {
  const id = parseInt(anilistId, 10);
  if (!Number.isFinite(id) || id <= 0) return null;

  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: BY_ID_QUERY, variables: { id } }),
  });

  if (!res.ok) return null;
  const json = await res.json();
  if (json.errors) {
    console.warn('AniList GraphQL:', JSON.stringify(json.errors));
    return null;
  }
  const m = json.data?.Media;
  if (!m) return null;
  const cover = m.coverImage?.extraLarge || m.coverImage?.large || null;
  return {
    anilistId: m.id,
    poster: cover,
    titleRomaji: m.title?.romaji || m.title?.english || '',
  };
}

async function searchAnime(title) {
  const search = title.replace(/<br\s*\/?>/gi, ' ').trim();
  if (!search) return null;

  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: SEARCH_QUERY, variables: { search } }),
  });

  if (!res.ok) return null;
  const json = await res.json();
  if (json.errors) {
    console.warn('AniList GraphQL:', JSON.stringify(json.errors));
    return null;
  }
  const m = json.data?.Media;
  if (!m) return null;
  return mapMedia(m);
}

const EXTRAS_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    relations {
      edges {
        relationType(version: 2)
        node {
          id
          type
          title { userPreferred romaji }
          coverImage { large }
        }
      }
    }
    characters(perPage: 14, sort: [ROLE, FAVOURITES_DESC]) {
      edges {
        role
        node {
          name { full }
          image { large }
        }
        voiceActors(language: JAPANESE) {
          name { full }
          language
          image { large }
        }
      }
    }
    recommendations(perPage: 12, sort: RATING_DESC) {
      edges {
        node {
          mediaRecommendation {
            id
            title { userPreferred romaji }
            coverImage { large }
          }
        }
      }
    }
    stats {
      statusDistribution { status amount }
      scoreDistribution { score amount }
    }
  }
}
`;

function anilistIdFromPosterUrl(url) {
  if (typeof url !== 'string' || !url.includes('anilistcdn')) return null;
  const file = url.split('?')[0].split('/').pop() || '';
  let m = file.match(/^bx(\d+)-/i);
  if (m) return parseInt(m[1], 10);
  m = file.match(/^b(\d+)-/i);
  if (m) return parseInt(m[1], 10);
  m = file.match(/^nx(\d+)-/i);
  if (m) return parseInt(m[1], 10);
  m = file.match(/^(\d+)\.(jpe?g|png|webp)$/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

function mapExtras(data) {
  const m = data?.Media;
  if (!m) return null;

  const relations = (m.relations?.edges || [])
    .slice(0, 12)
    .map((e) => ({
      relationType: e.relationType || '',
      id: e.node?.id,
      type: e.node?.type || '',
      title: e.node?.title?.userPreferred || e.node?.title?.romaji || '',
      cover: e.node?.coverImage?.large || null,
    }))
    .filter((r) => r.title);

  const characters = (m.characters?.edges || []).map((e) => ({
    role: e.role || '',
    name: e.node?.name?.full || '',
    image: e.node?.image?.large || null,
    voiceActors: (e.voiceActors || []).map((v) => ({
      name: v.name?.full || '',
      language: v.language || '',
      image: v.image?.large || null,
    })),
  }));

  const recommendations = (m.recommendations?.edges || [])
    .map((e) => {
      const rec = e.node?.mediaRecommendation;
      if (!rec?.id) return null;
      return {
        anilistId: rec.id,
        title: rec.title?.userPreferred || rec.title?.romaji || '',
        cover: rec.coverImage?.large || null,
      };
    })
    .filter(Boolean);

  const statusDistribution = (m.stats?.statusDistribution || []).map((s) => ({
    status: s.status,
    amount: s.amount,
  }));

  const scoreDistribution = (m.stats?.scoreDistribution || []).map((s) => ({
    score: s.score,
    amount: s.amount,
  }));

  return { relations, characters, recommendations, statusDistribution, scoreDistribution };
}

async function fetchMediaExtras(anilistId) {
  const id = parseInt(anilistId, 10);
  if (!Number.isFinite(id) || id <= 0) return null;

  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: EXTRAS_QUERY, variables: { id } }),
  });

  if (!res.ok) return null;
  const json = await res.json();
  if (json.errors) {
    console.warn('AniList extras:', JSON.stringify(json.errors));
    return null;
  }
  return mapExtras(json.data);
}

module.exports = {
  searchAnime,
  fetchMediaById,
  fetchMediaExtras,
  mapMedia,
  anilistIdFromPosterUrl,
  ANILIST_URL,
};
