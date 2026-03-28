import AnimeCard from './AnimeCard'

export default function AnimeGrid({ list, onSelect, onTrailer, savedListMode, onRemoveSaved }) {
  return (
    <div className="anime-grid">
      {list.map((a, i) => (
        <AnimeCard
          key={a.id}
          anime={a}
          index={i}
          onSelect={onSelect}
          onTrailer={onTrailer}
          savedListMode={savedListMode}
          onRemoveSaved={onRemoveSaved}
        />
      ))}
    </div>
  )
}
