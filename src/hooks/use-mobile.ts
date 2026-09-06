import * as React from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// useSyncExternalStore en vez de useState + useEffect: la versión anterior
// hacía setState sincrónico dentro del effect (un render en cascada en cada
// montaje) y arrancaba en `undefined`. Acá el server y el render de hidratación
// comparten getServerSnapshot() y el valor real entra sin render de más.
function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

const getSnapshot = () => window.matchMedia(QUERY).matches
const getServerSnapshot = () => false

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
