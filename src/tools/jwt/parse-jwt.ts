export type JwtPart = Record<string, unknown>

export interface ParsedJwt {
  header: JwtPart
  payload: JwtPart
  signature: string
  headerRaw: string
  payloadRaw: string
}

function base64UrlToBase64(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = normalized.length % 4
  return pad ? normalized + '='.repeat(4 - pad) : normalized
}

function decodeBase64UrlJson(part: string): JwtPart {
  const json = new TextDecoder().decode(
    Uint8Array.from(atob(base64UrlToBase64(part)), (c) => c.charCodeAt(0)),
  )
  const parsed: unknown = JSON.parse(json)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JWT 段不是 JSON 对象')
  }
  return parsed as JwtPart
}

export function parseJwt(token: string): ParsedJwt {
  const trimmed = token.trim().replace(/^Bearer\s+/i, '')
  if (!trimmed) {
    throw new Error('请输入 JWT')
  }

  const parts = trimmed.split('.')
  if (parts.length !== 3 || !parts[0] || !parts[1]) {
    throw new Error('JWT 应为 header.payload.signature 三段')
  }

  return {
    header: decodeBase64UrlJson(parts[0]),
    payload: decodeBase64UrlJson(parts[1]),
    signature: parts[2] ?? '',
    headerRaw: parts[0],
    payloadRaw: parts[1],
  }
}

export function formatJwtClaimTime(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const date = new Date(value * 1000)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString()
}

export function getJwtExpiryState(payload: JwtPart) {
  const exp = payload.exp
  if (typeof exp !== 'number') {
    return { label: '无 exp', tone: 'muted' as const }
  }
  const expired = Date.now() >= exp * 1000
  return expired
    ? { label: '已过期', tone: 'danger' as const }
    : { label: '未过期', tone: 'ok' as const }
}
