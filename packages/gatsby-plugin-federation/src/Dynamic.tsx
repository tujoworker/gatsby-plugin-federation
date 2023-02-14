import React from 'react'

export type Dynamic<T> = {
  module: () => Promise<{ default: React.ComponentType }>
  fallback: React.ReactNode
  props: T | Record<string, unknown>
}

export function Dynamic<T>({ fallback, module, props }: Dynamic<T>) {
  if (!globalThis.MF_SSR && typeof document === 'undefined') {
    return <>{fallback}</>
  }

  const LazyComponent = React.useCallback(React.lazy(module), [module])

  return (
    <React.Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </React.Suspense>
  )
}
