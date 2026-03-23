const path = require('node:path')

function resolveFileRoutePath(workspacePath, pathSegments) {
  if (pathSegments[0] === '__abs__') {
    return path.posix.join('/', ...pathSegments.slice(1))
  }

  return path.posix.join(workspacePath, ...pathSegments)
}

module.exports = { resolveFileRoutePath }
