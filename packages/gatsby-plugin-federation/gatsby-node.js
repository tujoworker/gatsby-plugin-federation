const fs = require('fs-extra')
const path = require('path')
const { UniversalFederationPlugin } = require('@module-federation/node')
const { container } = require('webpack')
const { ModuleFederationPlugin } = container

const filename = 'remoteEntry.js'
const ssrDir = 'mf-ssr'

exports.pluginOptionsSchema = ({ Joi }) => {
  const federationConfig = Joi.object({
    name: Joi.string().required(),
    shared: Joi.object().optional(),
    remotes: Joi.object().optional(),
    exposes: Joi.object().optional(),
  }).required()

  return Joi.object({
    ssr: Joi.boolean().optional(),
    federationConfig,
  })
}

const collectedStyles = {}

exports.onCreateWebpackConfig = (
  { store, stage, getConfig, plugins, actions },
  { ssr = true, federationConfig }
) => {
  const config = getConfig()

  if (stage === 'build-javascript' || stage === 'develop') {
    /**
     * In order to let MF know the correct URL.
     * Same location as the remoteEntry.js
     */
    config.output.publicPath = 'auto'
  }

  if (stage === 'build-javascript' || stage === 'develop') {
    if (config.optimization.splitChunks.chunks === 'all') {
      /**
       * Make it possible for the host to load shared chunks from remoteEntry.js
       *
       * When NOT in eager mode, then we need only this to be async,
       * given that the "app.js" and "production-app.js" is imported in a async boundary.
       */
      config.optimization.splitChunks.chunks = 'async'
    }
  }

  /**
   * Rename the app entry to use our own async boundary loader.
   * Here is a list of all of Gatsby entry points.
   */
  const entryPoints = ['polyfill', 'app', 'commons', 'render-page']
  for (const name in config.entry) {
    if (entryPoints.includes(name)) {
      config.entry[name] = createAsyncBoundaryEntry({
        entry: config.entry[name],
        store,
        exportBoundary: name === 'render-page',
      })
    }
  }

  /**
   * Shared deps
   */
  const { shared: sharedFromOptions, ...restConfig } = federationConfig
  const { shared } = sharedInternals({ store, sharedFromOptions })

  const commonSettings = {
    filename,
    shared,

    /**
     * It should ensure the remote entry is a full copy of the webpack runtime,
     * not just 2 functinos and needs another file for the base webpack runtime.
     */
    runtime: false,
  }

  if (stage === 'build-html' || stage === 'develop-html') {
    if (restConfig.remotes) {
      if (ssr && stage === 'build-html') {
        /**
         * Add remoteEntry.js to each remote
         */
        for (const remote in restConfig.remotes) {
          restConfig.remotes[remote] = joinUrl(
            restConfig.remotes[remote].replace(filename, ''),
            ssrDir,
            filename
          )
        }
      } else {
        /**
         * Ensure we alias the imports during SSR, when ssr=false in config
         */
        Object.keys(restConfig.remotes).forEach((remote) => {
          config.resolve.alias[remote] = false
        })
      }
    }

    for (let i = 1; i <= 10; i++) {
      config.resolve.alias[`gmf${i}`] = false
    }

    if (ssr && stage === 'build-html') {
      if (federationConfig?.exposes) {
        const state = store.getState()
        const destDir = path.join(state.program.directory, 'public', ssrDir)
        const dataFile = path.join(destDir, 'gmfData.js')

        const data = JSON.stringify({
          name: restConfig.name,
          styles: Object.values(collectedStyles),
        })
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir)
        }
        fs.writeFileSync(dataFile, `export default ${data}`, 'utf8')

        restConfig.exposes[`./gmfData`] = `./public/${ssrDir}/gmfData.js`
      }

      if (federationConfig?.remotes) {
        let count = 1
        for (const remote in federationConfig.remotes) {
          federationConfig.remotes[`gmf${count}`] =
            federationConfig.remotes[remote]
          count++
        }
      }

      // Remove parts we do not need
      config.target = false

      config.plugins.push(
        new UniversalFederationPlugin({
          ...restConfig,
          ...commonSettings,

          isServer: true,
          library: { type: 'commonjs-module' },
        })
      )
    }
  } else if (stage === 'build-javascript' || stage === 'develop') {
    if (restConfig.remotes) {
      /**
       * Add remoteEntry.js to each remote
       */
      for (const remote in restConfig.remotes) {
        restConfig.remotes[remote] = joinUrl(
          restConfig.remotes[remote].replace(filename, ''),
          filename
        )
      }
    }

    config.plugins.push(
      new ModuleFederationPlugin({
        ...restConfig,
        ...commonSettings,
      })
    )
  }

  config.plugins.push(
    plugins.define({
      'globalThis.MF_SSR': ssr,
    })
  )

  if (stage === 'build-javascript' && federationConfig?.exposes) {
    config.plugins.push(new GetChunksPlugin())
  }

  if (stage === 'develop' && federationConfig?.exposes) {
    /**
     * During the develop stage, the junk name "commons" in "styles" colides,
     * with the one from JS:
     * > Cache group "styles" conflicts with existing chunk.
     * > Both have the same name "commons" and existing chunk is not a parent
     * > of the selected modules.
     * When we remove the name, it creates its own.
     */
    if (config.optimization.splitChunks.cacheGroups.styles?.name) {
      delete config.optimization.splitChunks.cacheGroups.styles.name
    }
  }

  /**
   * This part extracts React + ReactDOM to its own junk, with a version nunmber instead of a random hash.
   * For the user, it means, this file will be cached locally, even if a prod build gets a new hash.
   */
  if (stage === 'build-javascript') {
    const origFilename =
      config.optimization.splitChunks.cacheGroups.framework?.filename
    config.optimization.splitChunks.cacheGroups.framework.filename = (
      module,
      chunks
    ) => {
      if (module.chunk.name?.includes('react')) {
        return `[name].js`
      }

      return typeof origFilename === 'function'
        ? origFilename(module, chunks)
        : '[name]-[contenthash].js'
    }

    const origName = config.optimization.splitChunks.cacheGroups.framework?.name
    config.optimization.splitChunks.cacheGroups.framework.name = (
      module,
      chunks
    ) => {
      const data = module?.resourceResolveData?.descriptionFileData

      if (data?.name === 'react' || data?.name === 'react-dom') {
        return 'react-' + data.version
      }

      return typeof origName === 'function'
        ? origName(module, chunks)
        : 'framework'
    }
  }

  // DEV: Removes all junks and leave only one package
  // config.optimization.splitChunks = false

  // DEV: Do not create source maps
  // config.devtool = false

  // DEV: Do not minify the bundles
  // config.optimization.minimize = false

  actions.replaceWebpackConfig(config)
}

exports.onCreateDevServer = ({ store }, { federationConfig }) => {
  if (federationConfig?.exposes) {
    const state = store.getState()
    const publicDir = path.join(state.program.directory, 'public')
    const commonsFile = path.join(publicDir, 'commons.css')

    if (!fs.existsSync(commonsFile)) {
      /**
       * Create a dummy file,
       * because we did delete "styles" from the cacheGroup, we get a random
       */
      fs.writeFileSync(commonsFile, '', 'utf8')
    }
  }
}

exports.onPostBuild = ({ store }, { ssr, federationConfig }) => {
  if (ssr && federationConfig?.exposes) {
    const state = store.getState()
    const srcDir = path.join(state.program.directory, '.cache/page-ssr/routes')
    const publicDir = path.join(state.program.directory, 'public')
    const destDir = path.join(publicDir, ssrDir)

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir)
    }

    fs.copySync(srcDir, destDir, { overwrite: true })
  }
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

function createAsyncBoundaryEntry({ entry, store, exportBoundary = false }) {
  const state = store.getState()
  const cacheDir = path.join(state.program.directory, '.cache')
  const isArray = Array.isArray(entry)
  const entries = isArray ? entry : [entry]
  const nameRegExp = '[\\/\\\\]([^/]*)$'

  const createFile = (file) => {
    const name = file.match(new RegExp('.*' + nameRegExp))[1]
    const destAppFile = path.join(cacheDir, `${name}-loader.js`)
    fs.writeFileSync(
      destAppFile,
      exportBoundary
        ? `export default async (...args) => ((await import('./${name}')).default(...args))`
        : `import('./${name}')`,
      'utf8'
    )
  }

  const renameEntry = (file) => {
    return file.replace(new RegExp(nameRegExp), '/$1-loader')
  }

  const asyncEntries = entries.map((file) => {
    createFile(file)
    return renameEntry(file)
  })

  return isArray ? asyncEntries : asyncEntries[0]
}

function sharedInternals({ store, sharedFromOptions }) {
  const { dependencies } = getPackageJson({ store })

  const shared = { ...sharedFromOptions }

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

  return { shared }
}

function joinUrl(...urls) {
  return urls
    .join('/')
    .replace(/\/{1,}/g, '/')
    .replace(/:\//g, '://')
}

class GetChunksPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('GetFilesPlugin', (stats) => {
      const statsData = stats.compilation.getStats().toJson({
        all: false,
        assets: true,
        cachedAssets: true,
        ids: true,
        publicPath: true,
      })

      statsData.assets
        .filter(({ name }) => {
          return name.endsWith('.css')
        })
        .forEach(({ name }) => {
          collectedStyles[name] = name
        })
    })
  }
}
