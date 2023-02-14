import React from 'react'
import { Link } from 'gatsby'
import HostButton from '../components/HostButton'

type LazyComponentType = React.LazyExoticComponent<React.ComponentType<any>>

const RemoteComponent: LazyComponentType = React.lazy(
  () => import('remote/Button')
)

function Dynamic(props) {
  const loading = <p role="status">Loading...</p>

  if (!globalThis.MF_SSR && typeof document === 'undefined') {
    return loading
  }

  return (
    <React.Suspense fallback={loading}>
      <RemoteComponent {...props} />
    </React.Suspense>
  )
}

const App = () => {
  const [count, setCount] = React.useState(1)

  return (
    <>
      <h1>Host App</h1>
      <HostButton onClick={handleClick} />{' '}
      <Dynamic text={`Remote Button ${count} 🙌`} onClick={handleClick} /> Check
      out the <Link to="/">Dynamic</Link> solution.
    </>
  )

  function handleClick(e) {
    console.log('onClick', e)
    setCount((s) => s + 1)
  }
}

export default App
