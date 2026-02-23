export function detectEnvironmentScript(): string {
  return [
    'echo "OS=$(uname -s)"',
    'echo "ARCH=$(uname -m)"',
    'echo "NODE_VERSION=$(node --version 2>/dev/null || echo none)"',
    'echo "NPM_VERSION=$(npm --version 2>/dev/null || echo none)"',
    'echo "OPENCLAW_VERSION=$(openclaw --version 2>/dev/null || echo none)"',
    'echo "OPENCLAW_PATH=$(which openclaw 2>/dev/null || echo none)"',
    'if command -v systemctl >/dev/null 2>&1; then echo "DAEMON=systemd";',
    'elif command -v pm2 >/dev/null 2>&1; then echo "DAEMON=pm2";',
    'else echo "DAEMON=none"; fi',
    'if command -v apt-get >/dev/null 2>&1; then echo "PKG=apt";',
    'elif command -v dnf >/dev/null 2>&1; then echo "PKG=dnf";',
    'elif command -v yum >/dev/null 2>&1; then echo "PKG=yum";',
    'elif command -v brew >/dev/null 2>&1; then echo "PKG=brew";',
    'else echo "PKG=unknown"; fi',
  ].join('\n')
}

export function installNodeScript(version: string): string {
  const majorVersion = parseInt(version, 10)
  if (isNaN(majorVersion) || majorVersion < 22) {
    throw new Error('Node.js version must be 22 or higher')
  }

  return [
    'export NVM_DIR="$HOME/.nvm"',
    'if [ ! -d "$NVM_DIR" ]; then',
    '  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash',
    'fi',
    '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"',
    `nvm install ${version}`,
    `nvm use ${version}`,
    `nvm alias default ${version}`,
  ].join('\n')
}

export function installOpenclawScript(): string {
  return 'npm install -g openclaw@latest'
}

export function initWorkspaceScript(openclawPath: string): string {
  if (!openclawPath || openclawPath.trim().length === 0) {
    throw new Error('openclawPath must be a non-empty string')
  }

  return [
    `mkdir -p "${openclawPath}/workspace/skills"`,
    `mkdir -p "${openclawPath}/workspace/memory"`,
    `mkdir -p "${openclawPath}/workspace/knowledge"`,
  ].join('\n')
}

export function upgradeOpenclawScript(): string {
  return 'npm update -g openclaw'
}

export function uninstallOpenclawScript(): string {
  return [
    'npm uninstall -g openclaw',
    'echo "OpenClaw has been uninstalled"',
  ].join('\n')
}
