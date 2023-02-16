import React from 'react'

type Module = () => Promise<{ default: React.ComponentType<any> }>

export function Dynamic(module: Module) {
  return ({ fallback, ...props }) => {
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
}
