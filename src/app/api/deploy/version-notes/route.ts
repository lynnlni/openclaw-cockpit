import { NextRequest } from 'next/server'
import { jsonSuccess, jsonError } from '../../_helpers'

const GITHUB_REPO = 'openclaw/openclaw'
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases`

interface GitHubRelease {
  tag_name: string
  name: string
  body: string
  published_at: string
  html_url: string
}

export async function GET(request: NextRequest): Promise<Response> {
  const version = request.nextUrl.searchParams.get('version')
  if (!version) return jsonError('version is required', 400)

  try {
    const res = await fetch(GITHUB_API, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'openclaw-dashboard',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      return jsonError(`GitHub API error: ${res.status}`, 502)
    }

    const releases: GitHubRelease[] = await res.json()

    const release =
      releases.find((r) => r.tag_name === version || r.tag_name === `v${version}`) ??
      releases[0]

    if (!release) {
      return jsonError('No releases found', 404)
    }

    return jsonSuccess({
      version: release.tag_name,
      name: release.name || release.tag_name,
      notes: release.body?.trim() ?? '',
      publishedAt: release.published_at,
      url: release.html_url,
      matched: release.tag_name === version || release.tag_name === `v${version}`,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to fetch release notes',
      500
    )
  }
}
