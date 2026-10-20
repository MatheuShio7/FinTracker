import { useEffect, useState } from 'react'

/**
 * Retorna true enquanto a media query informada estiver ativa.
 * Ex.: useMediaQuery('(max-width: 768px)')
 */
export function useMediaQuery(query) {
  const getMatches = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false

  const [matches, setMatches] = useState(getMatches)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQueryList = window.matchMedia(query)
    const handleChange = (event) => setMatches(event.matches)

    setMatches(mediaQueryList.matches)
    mediaQueryList.addEventListener('change', handleChange)
    return () => mediaQueryList.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

/**
 * Acompanha a largura (em px) do elemento referenciado.
 * Útil para componentes cujo layout depende do espaço disponível
 * (por exemplo, dentro de um modal) e não da largura da janela.
 *
 * `enabled` deve ser true somente quando o elemento estiver montado
 * (o efeito é reexecutado quando ele muda).
 */
export function useElementWidth(ref, enabled = true) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!enabled || !element) return undefined

    setWidth(element.clientWidth)

    if (typeof ResizeObserver === 'undefined') {
      const handleResize = () => setWidth(element.clientWidth)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setWidth(Math.round(entry.contentRect.width))
      }
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, enabled])

  return width
}
