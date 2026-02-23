export interface SSHConnectionConfig {
  host: string
  port: number
  username: string
  authType: 'password' | 'privateKey'
  password?: string
  privateKeyPath?: string
  passphrase?: string
}

export interface SSHExecResult {
  stdout: string
  stderr: string
  code: number
}

export interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number
  modifiedAt: string
  children?: FileEntry[]
}
