import crypto from 'node:crypto'
import { AUTH_CONFIG } from './config-shared'

// In-memory captcha store (expires automatically)
const captchaStore = new Map<string, CaptchaEntry>()

interface CaptchaEntry {
  code: string
  expiresAt: number
}

// Cleanup expired captchas every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of captchaStore.entries()) {
    if (entry.expiresAt < now) {
      captchaStore.delete(key)
    }
  }
}, 60 * 1000)

/**
 * Generate a random captcha code
 */
function generateCaptchaCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < AUTH_CONFIG.CAPTCHA_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Create a new captcha
 */
export function createCaptcha(): { id: string; code: string; svg: string } {
  const id = crypto.randomUUID()
  const code = generateCaptchaCode()

  // Store with expiration
  captchaStore.set(id, {
    code: code.toLowerCase(),
    expiresAt: Date.now() + AUTH_CONFIG.CAPTCHA_EXPIRES_IN * 1000,
  })

  // Generate SVG
  const svg = generateCaptchaSvg(code)

  return { id, code, svg }
}

/**
 * Verify a captcha
 */
export function verifyCaptcha(id: string, input: string): boolean {
  const entry = captchaStore.get(id)

  if (!entry) {
    return false
  }

  // Always delete after verification (single use)
  captchaStore.delete(id)

  // Check expiration
  if (entry.expiresAt < Date.now()) {
    return false
  }

  // Case-insensitive comparison
  return entry.code === input.toLowerCase()
}

/**
 * Generate SVG captcha image
 */
function generateCaptchaSvg(text: string): string {
  const width = AUTH_CONFIG.CAPTCHA_WIDTH
  const height = AUTH_CONFIG.CAPTCHA_HEIGHT

  // Random colors
  const bgColors = ['#f0f0f0', '#e8f4f8', '#f8f0e8', '#f0e8f8']
  const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)]

  // Generate noise lines
  const lines: string[] = []
  for (let i = 0; i < 5; i++) {
    const x1 = Math.random() * width
    const y1 = Math.random() * height
    const x2 = Math.random() * width
    const y2 = Math.random() * height
    const color = `hsl(${Math.random() * 360}, 50%, 50%)`
    lines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1"/>`)
  }

  // Generate noise circles
  const circles: string[] = []
  for (let i = 0; i < 20; i++) {
    const cx = Math.random() * width
    const cy = Math.random() * height
    const r = Math.random() * 2 + 1
    const color = `hsl(${Math.random() * 360}, 30%, 60%)`
    circles.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`)
  }

  // Generate text with distortion
  const chars: string[] = []
  const charWidth = width / text.length

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const x = i * charWidth + charWidth / 2
    const y = height / 2 + 5
    const rotation = (Math.random() - 0.5) * 30 // -15 to 15 degrees
    const fontSize = 24 + Math.random() * 8 // 24-32px
    const color = `hsl(${200 + Math.random() * 60}, 70%, 40%)` // Blue-ish colors

    chars.push(`<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${color}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotation}, ${x}, ${y})">${char}</text>`)
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  ${circles.join('')}
  ${lines.join('')}
  ${chars.join('')}
</svg>`
}

/**
 * Get captcha store size (for debugging)
 */
export function getCaptchaStoreSize(): number {
  return captchaStore.size
}
