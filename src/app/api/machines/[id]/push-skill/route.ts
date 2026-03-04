import { NextRequest } from 'next/server'
import { z } from 'zod'

import { getMachine, validatePushToken } from '@/lib/machines/config'
import { generateSkillMarkdown } from '@/lib/backup/skill-generator'
import { machineIdSchema } from '@/lib/validation/schemas'
import { jsonError } from '../../../_helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

const bodySchema = z.object({
  token: z.string().min(1),
  dashboardUrl: z.string().url().optional(),
})

// POST — download the skill markdown file with embedded token and machine details
// Token is sent in the request body (not query string) to avoid logging/history exposure
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params

    const idResult = machineIdSchema.safeParse(id)
    if (!idResult.success) {
      return jsonError('Invalid machine ID', 400)
    }

    const machine = getMachine(idResult.data)
    if (!machine) {
      return jsonError('Machine not found', 404)
    }

    if (machine.connectionType !== 'push') {
      return jsonError('Skill files are only available for push-type machines', 400)
    }

    let body: unknown = {}
    try {
      body = await request.json()
    } catch {
      return jsonError('Request body is required', 400)
    }

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return jsonError('Token is required in request body', 400)
    }

    const tokenParam = parsed.data.token

    // Verify the provided token matches the stored one
    if (!validatePushToken(idResult.data, tokenParam)) {
      return jsonError('Invalid token', 401)
    }

    // Resolve the dashboard URL: body > stored value > request host header
    const dashboardUrl = parsed.data.dashboardUrl ?? machine.dashboardUrl ?? (() => {
      const host = request.headers.get('host') ?? 'localhost:3000'
      const protocol = request.headers.get('x-forwarded-proto') ?? 'http'
      return `${protocol}://${host}`
    })()

    const markdown = generateSkillMarkdown({
      machineId: idResult.data,
      machineName: machine.name,
      dashboardUrl,
      openclawPath: machine.openclawPath,
      cronSchedule: machine.pushCronSchedule ?? '0 2 * * *',
    })

    // Replace all occurrences of the placeholder with the actual token
    const finalMarkdown = markdown.replaceAll('__PUSH_TOKEN__', tokenParam)

    const filename = `backup-push-${machine.name.replace(/[^a-zA-Z0-9_-]/g, '-')}.md`

    return new Response(finalMarkdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to generate skill file',
      500
    )
  }
}
