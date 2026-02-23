# OpenClaw Cockpit

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/lynnlni/openclaw-cockpit/releases)
[![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)

OpenClaw Cockpit 是 [OpenClaw](https://github.com/lynnlni/openclaw) AI Agent 的 Web 运维控制台，让你无需 SSH 和手工改配置，通过一个界面即可在多台远程服务器上部署、配置和监控 Agent。你可以用它做这些事：

- **多机运维面板** — 统一查看每台机器是否在线、OpenClaw 是否安装、服务状态和版本。
- **一键部署/升级** — 通过部署向导在远程服务器安装或升级 OpenClaw，减少手动操作。
- **集中配置管理** — 管理 Providers（模型和 Key）、Channels、MCP Servers、Skills 等核心配置。
- **工作区编辑** — 在线改 `AGENTS.md`、`SOUL.md`、`MEMORY.md` 等文件，快速调整 Agent 行为。
- **备份与恢复** — 做快照、导入导出配置，适合迁移机器和回滚故障。
- **团队/多环境管理** — 适合同时管本地机、家用服务器、云主机（开发/测试/生产）这类场景。

**一句话：** 它是 OpenClaw 的运维控制台，适合想把 AI Agent 部署和管理流程标准化的人。

[English](README.md) | 中文

---

## 功能特性

### 机器管理

通过 SSH 注册和管理远程服务器。支持密码和密钥两种认证方式，凭据使用 AES-256-GCM 加密存储在本地。

### 部署

引导式部署向导，覆盖完整生命周期：

- 环境检测（操作系统、架构、Node.js、包管理器）
- 自动安装 Node.js + OpenClaw
- 工作空间初始化
- 服务启动 / 停止 / 重启 / 升级
- 实时部署日志

### 技能

发现、安装和管理 AI 技能：

- 浏览已安装技能，支持启用/禁用
- 从可配置的 GitHub 仓库发现新技能
- 一键从远程仓库安装
- 本地创建和编辑自定义技能
- 管理技能源仓库

### MCP 服务器

配置 [Model Context Protocol](https://modelcontextprotocol.io) 服务器：

- 支持 stdio、HTTP、SSE 三种传输方式
- 环境变量和参数配置
- 按服务器独立启用/禁用

### 模型供应商

管理 LLM 供应商和 API 密钥：

- 多供应商支持（OpenAI、Anthropic、本地模型、自定义端点）
- 默认模型和回退链配置
- API 密钥安全存储

### 通道

为 AI Agent 配置通信通道。支持添加、编辑、启用/禁用，每个通道可独立设置。

### 备份与恢复

- 创建和恢复完整快照
- 导出 / 导入配置存档
- 跨机器克隆配置
- 恢复前自动创建安全快照

### 工作空间编辑器

通过浏览器内的 CodeMirror 编辑器编辑所有工作空间配置文件：

| 文件 | 用途 |
|------|------|
| `openclaw.json` | 核心配置（JSON 编辑器） |
| `IDENTITY.md` | AI 身份与特征 |
| `AGENTS.md` | Agent 行为规则 |
| `TOOLS.md` | 工具使用指南 |
| `SOUL.md` | 性格与沟通风格 |
| `MEMORY.md` | 记忆结构文档 |
| `USER.md` | 用户档案与偏好 |
| `BOOTSTRAP.md` | 启动流程 |
| `HEARTBEAT.md` | 定时任务与间隔 |

### 记忆

可调整大小的双面板布局，浏览和编辑工作空间 Markdown 文件。包含按日期组织的每日记忆视图。

### 仪表盘

实时总览所有已注册机器的连接状态、安装状态、服务运行状态和版本信息。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router)、React 19、TypeScript |
| UI | shadcn/ui、Radix UI、Tailwind CSS 4 |
| 编辑器 | CodeMirror (JSON + Markdown) |
| 数据请求 | SWR |
| 校验 | Zod |
| SSH | node-ssh |

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/lynnlni/openclaw-cockpit.git
cd openclaw-cockpit

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，添加你的第一台机器。

### 生产环境

```bash
npm run build
npm start
```

## 配置

### 环境变量

| 变量 | 用途 | 默认值 |
|------|------|--------|
| `ENCRYPTION_KEY` | 加密存储凭据的主密钥 | 内置默认密钥 |

### 本地数据

机器配置存储在 `~/.openclaw-cockpit/machines.json`。密码在本地加密存储，不会发送到浏览器端。

## 使用指南

1. 启动 Cockpit，进入 **机器管理** — 添加远程服务器
2. 进入 **部署** — 在服务器上安装 OpenClaw
3. 配置 **模型供应商** — 添加 LLM API 密钥
4. 设置 **通道** — 配置 Agent 的通信方式
5. 管理 **技能** — 从 GitHub 仓库安装能力
6. 编辑 **工作空间** 文件 — 自定义 Agent 行为

## 项目结构

```
src/
├── app/                    # Next.js 页面和 API 路由
│   ├── api/                # 服务端 API 接口
│   ├── dashboard/          # 总览页
│   ├── machines/           # 机器管理
│   ├── deploy/             # 部署向导
│   ├── skills/             # 技能管理
│   ├── mcp/                # MCP 服务器配置
│   ├── providers/          # LLM 供应商配置
│   ├── channels/           # 通道配置
│   ├── backups/            # 备份与恢复
│   ├── memory/             # 记忆文件编辑器
│   └── workspace/          # 工作空间配置页
├── components/             # 按功能组织的 React 组件
├── hooks/                  # 自定义 React Hooks（基于 SWR）
├── lib/                    # 业务逻辑和工具函数
│   ├── backup/             # 快照操作
│   ├── config/             # 配置解析与序列化
│   ├── deploy/             # 部署脚本和安装器
│   ├── machines/           # 机器 CRUD 和加密
│   ├── mcp/                # MCP 服务器管理
│   ├── skills/             # 技能发现与管理
│   ├── ssh/                # SSH 连接池和文件操作
│   ├── validation/         # Zod 校验 Schema
│   └── workspace/          # 工作空间文件工具
└── store/                  # React Context 状态管理
```

## 贡献

欢迎贡献代码！请随时提交 Pull Request。

## 许可证

[GPL-3.0](LICENSE)
