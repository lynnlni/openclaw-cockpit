export function getCloneExportCommand(openclawPath: string): string {
  return `tar -czf - -C "${openclawPath}" .`
}

export function getCloneImportCommand(openclawPath: string): string {
  return `mkdir -p "${openclawPath}" && tar -xzf - -C "${openclawPath}"`
}
