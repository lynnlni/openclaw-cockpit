export interface SkillGeneratorOptions {
  machineId: string
  machineName: string
  dashboardUrl: string
  openclawPath: string
  cronSchedule: string
}

export function generateSkillMarkdown(opts: SkillGeneratorOptions): string {
  const { machineId, machineName, dashboardUrl, openclawPath, cronSchedule } = opts

  const script = generateBackupPushScript({ machineId, dashboardUrl, openclawPath })

  return `---
name: backup-push
description: 自动备份工作区并推送到 Dashboard，同时检查并执行待恢复指令
version: 1.0.0
---

# Backup Push Skill for ${machineName}

此 Skill 用于将 OpenClaw 工作区备份推送到 Dashboard，并轮询待恢复指令。

## 安装前配置

打开 \`backup-push.sh\`，修改顶部的配置区：

\`\`\`bash
# ====== 需要配置的变量 ======
DASHBOARD_URL="${dashboardUrl}"   # Dashboard 地址（已预填，可修改）
TOKEN="__PUSH_TOKEN__"            # API Key（已预填，请勿泄露）
MACHINE_ID="${machineId}"         # 设备 ID（已预填，请勿修改）
OPENCLAW_PATH_HINT="${openclawPath}"   # 路径提示（脚本运行时会自动扫描确认）
\`\`\`

> **注意**：OPENCLAW_PATH_HINT 仅作为扫描起点，脚本会自动检测实际安装路径，无需精确填写。

## 安装步骤

**1. 复制 Skill 文件到 OpenClaw 服务器**

\`\`\`bash
mkdir -p ${openclawPath}/workspace/skills/backup-push
# 将本文件复制到该目录，命名为 skill.md
\`\`\`

**2. 提取并配置脚本**

\`\`\`bash
# 从本文件提取脚本（或直接复制下方"脚本源码"内容）
cat > ${openclawPath}/workspace/skills/backup-push/backup-push.sh << 'SCRIPT'
# ... 粘贴下方脚本内容 ...
SCRIPT
chmod +x ${openclawPath}/workspace/skills/backup-push/backup-push.sh
\`\`\`

**3. 手动测试一次**

\`\`\`bash
bash ${openclawPath}/workspace/skills/backup-push/backup-push.sh
\`\`\`

**4. 安装定时任务（${cronSchedule}）**

\`\`\`bash
(crontab -l 2>/dev/null; echo "${cronSchedule} bash ${openclawPath}/workspace/skills/backup-push/backup-push.sh >> ${openclawPath}/workspace/skills/backup-push/backup-push.log 2>&1") | crontab -
\`\`\`

查看执行日志：

\`\`\`bash
tail -f ${openclawPath}/workspace/skills/backup-push/backup-push.log
\`\`\`

## 脚本源码

\`\`\`bash
${script}
\`\`\`

## 配置说明

| 变量 | 说明 | 当前值 |
|------|------|--------|
| \`DASHBOARD_URL\` | Dashboard 可达地址 | \`${dashboardUrl}\` |
| \`MACHINE_ID\` | 设备 ID（请勿修改） | \`${machineId}\` |
| \`TOKEN\` | API Key（请勿泄露） | 已嵌入 |
| \`OPENCLAW_PATH_HINT\` | 路径提示（自动扫描确认） | \`${openclawPath}\` |

## 安全提示

- Token（API Key）具备完整的备份推送和恢复权限，请勿共享或提交到代码仓库
- 如 Token 泄露，请在 Dashboard 的机器管理页面轮换令牌
- 轮换后需重新下载 Skill 文件并替换服务器上的旧脚本
`
}

interface ScriptOptions {
  machineId: string
  dashboardUrl: string
  openclawPath: string
}

function generateBackupPushScript(opts: ScriptOptions): string {
  const { machineId, dashboardUrl, openclawPath } = opts

  return `#!/usr/bin/env bash
set -euo pipefail

# ================================================================
# OpenClaw Backup Push Script
#
# 配置说明：
#   DASHBOARD_URL       — Dashboard 的可达地址（需要从 OpenClaw 服务器能访问）
#   TOKEN               — API Key，在 Dashboard 机器管理页面生成
#   MACHINE_ID          — 设备 ID，请勿修改
#   OPENCLAW_PATH_HINT  — OpenClaw 配置目录提示（脚本会自动检测，仅作参考）
# ================================================================

# ====== 需要配置的变量 ======
DASHBOARD_URL="${dashboardUrl}"
TOKEN="__PUSH_TOKEN__"
MACHINE_ID="${machineId}"
OPENCLAW_PATH_HINT="${openclawPath}"   # 仅作检测起点，脚本会自动扫描确认
# ===========================

API_BASE="\${DASHBOARD_URL}/api/backups/\${MACHINE_ID}"
HEADERS=(-H "Authorization: Bearer \${TOKEN}")
TMP_FILE=""

# ---- Utility -----------------------------------------------
log() { echo "[\$(date '+%Y-%m-%d %H:%M:%S')] \$*"; }
cleanup() { [ -n "\${TMP_FILE}" ] && rm -f "\${TMP_FILE}" 2>/dev/null || true; }
trap cleanup EXIT

# ---- 0. Basic sanity checks --------------------------------
if [ "\${TOKEN}" = "__PUSH_TOKEN__" ]; then
  log "ERROR: TOKEN is not configured. Edit this script and set TOKEN."
  exit 1
fi

if [ -z "\${DASHBOARD_URL}" ]; then
  log "ERROR: DASHBOARD_URL is not configured."
  exit 1
fi

# ---- 1. Auto-detect OPENCLAW_PATH --------------------------
detect_openclaw_path() {
  # Candidate locations to scan (in priority order)
  local candidates=()

  # 1. Expand and check the configured hint first
  local hint
  hint="\$(eval echo "\${OPENCLAW_PATH_HINT}" 2>/dev/null || echo "\${OPENCLAW_PATH_HINT}")"
  [ -n "\${hint}" ] && candidates+=("\${hint}")

  # 2. Common per-user locations
  candidates+=(
    "\${HOME}/.openclaw"
    "/root/.openclaw"
    "/opt/openclaw"
    "/usr/local/openclaw"
  )

  # 3. Scan all home directories for .openclaw
  if [ -d /home ]; then
    while IFS= read -r dir; do
      candidates+=("\${dir}/.openclaw")
    done < <(find /home -maxdepth 1 -mindepth 1 -type d 2>/dev/null)
  fi

  # 4. Ask the openclaw binary for its config path (if available)
  if command -v openclaw >/dev/null 2>&1; then
    local bin_path
    bin_path="\$(openclaw config --show-path 2>/dev/null | tr -d '[:space:]' || true)"
    [ -n "\${bin_path}" ] && candidates+=("\${bin_path}")
  fi

  # Return the first candidate that has a workspace/ subdirectory
  for path in "\${candidates[@]}"; do
    if [ -d "\${path}/workspace" ]; then
      echo "\${path}"
      return 0
    fi
  done

  return 1
}

log "Detecting OpenClaw path..."
OPENCLAW_PATH="\$(detect_openclaw_path || true)"

if [ -z "\${OPENCLAW_PATH}" ]; then
  log "ERROR: Could not find OpenClaw installation."
  log "  Searched hint: \${OPENCLAW_PATH_HINT}"
  log "  Common locations: ~/.openclaw, /root/.openclaw, /opt/openclaw, /home/*/.openclaw"
  log "  Make sure OpenClaw is installed and the workspace directory exists."
  exit 1
fi

log "Using OpenClaw path: \${OPENCLAW_PATH}"

# ---- 2. Verify workspace exists ----------------------------
WORKSPACE_DIR="\${OPENCLAW_PATH}/workspace"
if [ ! -d "\${WORKSPACE_DIR}" ]; then
  log "ERROR: workspace directory not found: \${WORKSPACE_DIR}"
  exit 1
fi

# ---- 3. Check pending restore ------------------------------
log "Checking for pending restore..."
PENDING_JSON=\$(curl -sf "\${HEADERS[@]}" "\${API_BASE}/restore-pending" || echo '{"data":null}')
PENDING_SNAPSHOT=\$(echo "\${PENDING_JSON}" | grep -o '"snapshotName":"[^"]*"' | head -1 | cut -d'"' -f4 || true)

if [ -n "\${PENDING_SNAPSHOT}" ]; then
  log "Pending restore found: \${PENDING_SNAPSHOT}"

  # 2a. Push a safety snapshot before restoring
  SAFETY_TS=\$(date '+%Y%m%d-%H%M%S')
  SAFETY_NAME="snapshot-ws-pre-restore-\${SAFETY_TS}"
  TMP_FILE="/tmp/\${SAFETY_NAME}.tar.gz"
  log "Creating safety snapshot: \${SAFETY_NAME}"
  tar -czf "\${TMP_FILE}" -C "\${WORKSPACE_DIR}" .
  OPENCLAW_VERSION=\$(openclaw --version 2>/dev/null | head -1 || echo "unknown")
  curl -sf -X POST "\${HEADERS[@]}" \\
    -H "X-Backup-Name: \${SAFETY_NAME}" \\
    -H "X-Backup-Type: workspace" \\
    -H "X-OpenClaw-Version: \${OPENCLAW_VERSION}" \\
    --data-binary @"\${TMP_FILE}" \\
    "\${API_BASE}/push" > /dev/null
  rm -f "\${TMP_FILE}"; TMP_FILE=""
  log "Safety snapshot pushed."

  # 2b. Download the restore package
  RESTORE_TMP="/tmp/restore-\${PENDING_SNAPSHOT}.tar.gz"
  log "Downloading restore package: \${PENDING_SNAPSHOT}"
  curl -sf "\${HEADERS[@]}" "\${API_BASE}/snapshots/\${PENDING_SNAPSHOT}/pull" -o "\${RESTORE_TMP}"

  # 2c. Apply restore
  log "Applying restore to \${WORKSPACE_DIR}..."
  tar -xzf "\${RESTORE_TMP}" -C "\${WORKSPACE_DIR}"
  rm -f "\${RESTORE_TMP}"
  log "Restore applied."

  # 2d. Clear the pending flag
  curl -sf -X DELETE "\${HEADERS[@]}" "\${API_BASE}/restore-pending" > /dev/null
  log "Pending restore cleared."
fi

# ---- 4. Create and push current backup ---------------------
TS=\$(date '+%Y%m%d-%H%M%S')
SNAPSHOT_NAME="snapshot-ws-push-\${TS}"
TMP_FILE="/tmp/\${SNAPSHOT_NAME}.tar.gz"

log "Creating workspace snapshot: \${SNAPSHOT_NAME}"
tar -czf "\${TMP_FILE}" -C "\${WORKSPACE_DIR}" .

OPENCLAW_VERSION=\$(openclaw --version 2>/dev/null | head -1 || echo "unknown")

log "Pushing snapshot to Dashboard..."
curl -sf -X POST "\${HEADERS[@]}" \\
  -H "X-Backup-Name: \${SNAPSHOT_NAME}" \\
  -H "X-Backup-Type: workspace" \\
  -H "X-OpenClaw-Version: \${OPENCLAW_VERSION}" \\
  --data-binary @"\${TMP_FILE}" \\
  "\${API_BASE}/push" > /dev/null

log "Snapshot pushed successfully: \${SNAPSHOT_NAME}"
`
}
