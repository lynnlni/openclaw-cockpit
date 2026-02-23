/**
 * Escape a string for safe use in a shell command.
 * Wraps in single quotes and escapes embedded single quotes.
 */
export function shellEscape(s: string): string {
  return "'" + s.replace(/'/g, "'\\''") + "'"
}

/**
 * Escape a remote file path for safe shell use, with ~ expansion.
 * If the path starts with ~/, expands it to "$HOME"/rest-of-path
 * so the shell resolves $HOME while keeping the rest safely quoted.
 */
export function shellEscapePath(remotePath: string): string {
  if (remotePath.startsWith('~/')) {
    const rest = remotePath.slice(2)
    return `"$HOME"/${shellEscape(rest)}`
  }
  if (remotePath === '~') {
    return '"$HOME"'
  }
  return shellEscape(remotePath)
}
