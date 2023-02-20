exports.addEntryPointToRemotes = function addEntryPointToRemotes(
  { remotes },
  { stage, ssrDir, federationConfig: { filename } }
) {
  /**
   * Add remoteEntry.js to each remote, if not given
   */
  for (const remote in remotes) {
    if (!/\.js$/.test(remotes[remote])) {
      remotes[remote] = joinUrl(
        remotes[remote],
        stage === 'build-html' || stage === 'develop-html' ? ssrDir : null,
        filename
      )
    }
  }

  return [remotes]
}

function joinUrl(...urls) {
  return urls
    .filter(Boolean)
    .join('/')
    .replace(/(?<!:)\/{1,}/g, '/') // ensure only one slash, but not after :
}
