export default function Footer() {
  return (
    <footer className="footer-weebly">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">
            <img src="/weebly.png" alt="" />
            <span>Weebly</span>
          </div>
          <p className="copy">
            © 2026 Weebly. Supplemental metadata, tags, and artwork from{' '}
            <a href="https://anilist.co" target="_blank" rel="noreferrer">AniList</a> (GraphQL API, academic use). Trailers may open on IMDb or embed.
          </p>
        </div>
        <div>
          <h4>Stack</h4>
          <p>React · Vite · Express · PostgreSQL</p>
        </div>
      </div>
    </footer>
  )
}
