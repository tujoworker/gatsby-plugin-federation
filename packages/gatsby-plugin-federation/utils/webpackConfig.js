const fs = require('fs-extra')
const path = require('path')

exports.mutateWebpackConfig = function mutateWebpackConfig({ config }, cfg) {
  const { stage, federationConfig, ssr } = cfg

  // DEV: Removes all junks and leave only one package
  // config.optimization.splitChunks = false

  // DEV: Do not create source maps
  // config.devtool = false

  // DEV: Do not minify the bundles
  // config.optimization.minimize = false

  if (stage === 'build-javascript' || stage === 'develop') {
    /**
     * In order to let MF know the correct URL.
     * Same location as the remoteEntry.js
     * When we use 'auto', MF will include the file during runtime on the remote.
     * But Gatsby embeds the CSS already. So we remote it.
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

  if (stage === 'build-html' || stage === 'develop-html') {
    if (ssr) {
      // Remove parts we do not need
      config.target = false
    }
  }

  ;[config] = handleEntryPoints({ config }, cfg)
  ;[config] = handleExternalizeReact({ config }, cfg)
  ;[config] = disableRemotesWithAlias({ config }, cfg)

  return [config]
}

function handleEntryPoints({ config }, cfg) {
  const { store } = cfg

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

  return [config]
}

function disableRemotesWithAlias({ config }, cfg) {
  const { federationConfig } = cfg

  /**
   * Ensure we alias the imports during SSR, when ssr=false in config
   */
  if (federationConfig?.remotes) {
    Object.keys(federationConfig.remotes).forEach((remote) => {
      config.resolve.alias[remote] = false
    })
  }

  return [config]
}

function handleExternalizeReact({ config }, cfg) {
  const { stage } = cfg

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

  return [config]
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
