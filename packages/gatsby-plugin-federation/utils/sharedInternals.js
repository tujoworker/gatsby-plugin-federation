const fs = require('fs-extra')
const path = require('path')

exports.handleSharedInternals = function handleSharedInternals(
  { shared },
  { store }
) {
  const { dependencies } = getPackageJson({ store })

  shared.react = {
    singleton: true,
    requiredVersion: dependencies['react'],
  }
  shared['react-dom'] = {
    singleton: true,
    requiredVersion: dependencies['react-dom'],
  }

  // Share internals
  shared['@gatsbyjs/reach-router'] = {
    singleton: true,
    requiredVersion: false,
  }
  shared['@reach/router'] = {
    singleton: true,
    requiredVersion: false,
  }
  shared['@pmmmwh/react-refresh-webpack-plugin'] = {
    singleton: true,
    requiredVersion: false,
  }
  shared['@gatsbyjs/react-refresh-webpack-plugin'] = {
    singleton: true,
    requiredVersion: false,
  }

  // shared['@babel/runtime'] = {
  //   singleton: true,
  //   requiredVersion: false,
  // }
  // shared['react-server-dom-webpack'] = {
  //   singleton: true,
  //   requiredVersion: false,
  // }
  // shared['webpack-hot-middleware'] = {
  //   singleton: true,
  //   requiredVersion: false,
  // }

  return [shared]
}

let packageJsonCache = null
function getPackageJson({ store }) {
  if (packageJsonCache) {
    return packageJsonCache
  }

  const state = store.getState()
  const packageJsonFile = path.join(state.program.directory, 'package.json')

  if (fs.existsSync(packageJsonFile)) {
    /**
     * Create a dummy file,
     * because we did delete "styles" from the cacheGroup, we get a random
     */
    return (packageJsonCache = JSON.parse(
      fs.readFileSync(packageJsonFile, 'utf8')
    ))
  }

  return {}
}
