const test = require('node:test')
const assert = require('node:assert/strict')

const { resolveFileRoutePath } = require('./file-route-path.js')

test('resolves relative file paths under the workspace', () => {
  assert.equal(
    resolveFileRoutePath('/root/.openclaw/workspace-tech', ['workspace', 'AGENTS.md']),
    '/root/.openclaw/workspace-tech/workspace/AGENTS.md',
  )
})

test('resolves absolute file paths from __abs__ segments', () => {
  assert.equal(
    resolveFileRoutePath('/root/.openclaw/workspace-tech', ['__abs__', 'root', '.openclaw', 'workspace-tech', 'AGENTS.md']),
    '/root/.openclaw/workspace-tech/AGENTS.md',
  )
})
