import React from 'react'

export const wrapRootElement = ({ element }) => {
  return (
    <>
      <Mounted />
      {element}
    </>
  )
}

const Mounted = () => {
  React.useEffect(() => {
    document.documentElement.setAttribute('data-is-mounted', '1')
  })
  return null
}
