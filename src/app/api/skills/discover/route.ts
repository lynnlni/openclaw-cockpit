import { NextResponse } from 'next/server'

import { getDefaultRepos } from '@/lib/skills/repo-manager'
import { discoverAllSkills } from '@/lib/skills/discovery'

export async function GET(): Promise<Response> {
  try {
    const repos = getDefaultRepos()
    const skills = await discoverAllSkills(repos)

    return NextResponse.json({ success: true, data: skills })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to discover skills',
      },
      { status: 500 }
    )
  }
}
