import { useRef, useState, useEffect, useCallback } from 'react'

export default function ScrollRow({ children, className = '' }) {
  const ref = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const check = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 2)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    check()
    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', check)
      ro.disconnect()
    }
  }, [check, children])

  const scroll = (dir) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: 'smooth' })
  }

  return (
    <div className="scroll-row-wrap">
      {canLeft && (
        <button
          type="button"
          className="scroll-arrow left"
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
        >
          <i className="fas fa-chevron-left" />
        </button>
      )}
      <div ref={ref} className={`scroll-row-inner ${className}`}>
        {children}
      </div>
      {canRight && (
        <button
          type="button"
          className="scroll-arrow right"
          onClick={() => scroll(1)}
          aria-label="Scroll right"
        >
          <i className="fas fa-chevron-right" />
        </button>
      )}
    </div>
  )
}
