import React from 'react'

export type ClientOnly<T> = {
  module: () => Promise<{ default: React.ComponentType }>
  fallback: React.ReactNode
  props: T | Record<string, unknown>
}

export function ClientOnly<T>({ fallback, module, props }: ClientOnly<T>) {
  if (typeof document === 'undefined') {
    return <>{fallback}</>
  }

  const LazyComponent = React.useCallback(React.lazy(module), [module])

  return (
    <React.Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </React.Suspense>
  )
}
