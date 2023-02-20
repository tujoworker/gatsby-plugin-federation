const fs = require('fs-extra')
const path = require('path')

exports.copyExposesToPublic = function copyExposesToPublic(
  { store },
  { ssr, ssrDir, federationConfig }
) {
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
