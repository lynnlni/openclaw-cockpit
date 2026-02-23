import { NextResponse } from 'next/server'

import { getDefaultRepos } from '@/lib/skills/repo-manager'

export async function GET(): Promise<Response> {
  try {
    const repos = getDefaultRepos()
    return NextResponse.json({ success: true, data: repos })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list repos',
      },
      { status: 500 }
    )
  }
}
