import React from 'react'
import g1 from 'gmf1/gmfData'
import g2 from 'gmf2/gmfData'
import g3 from 'gmf3/gmfData'
import g4 from 'gmf4/gmfData'
import g5 from 'gmf5/gmfData'
import g6 from 'gmf6/gmfData'
import g7 from 'gmf7/gmfData'
import g8 from 'gmf8/gmfData'
import g9 from 'gmf9/gmfData'
import g10 from 'gmf10/gmfData'

let links = null
const listOfData = [].concat(g1, g2, g3, g4, g5, g6, g7, g8, g9, g10)

export const onRenderBody = (
  { setHeadComponents },
  { ssr = true, federationConfig }
) => {
  if (ssr && federationConfig?.remotes) {
    if (!links) {
      links = []
      for (const remote in federationConfig.remotes) {
        const found = listOfData.find(({ name }) => {
          return name === remote
        })
        if (found) {
          found?.styles.forEach((style) => {
            const href = federationConfig.remotes[remote].match(/.*@(.*)/)[1]
            links.push(href + style)
          })
        }
      }
    }

    setHeadComponents(
      links.map((style, i) => {
        return <link key={i} rel="stylesheet" type="text/css" href={style} />
      })
    )
  }
}
