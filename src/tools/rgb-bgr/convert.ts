export type ColorChannels = {
  r: number
  g: number
  b: number
}

export type ParseColorResult =
  | { ok: true; color: ColorChannels }
  | { ok: false; error: string }

function clampByte(value: number) {
  if (!Number.isFinite(value)) return null
  if (value < 0 || value > 255) return null
  return Math.round(value)
}

function channelsFromTriplet(
  a: number,
  green: number,
  blue: number,
): ColorChannels | null {
  const r = clampByte(a)
  const g = clampByte(green)
  const b = clampByte(blue)
  if (r === null || g === null || b === null) return null
  return { r, g, b }
}

function parseHex(raw: string): ColorChannels | null {
  const hex = raw.replace(/^#/, '').replace(/^0x/i, '')
  if (!/^[0-9a-fA-F]+$/.test(hex)) return null

  let full = hex
  if (hex.length === 3 || hex.length === 4) {
    full = hex
      .slice(0, 3)
      .split('')
      .map((ch) => ch + ch)
      .join('')
  } else if (hex.length === 6 || hex.length === 8) {
    full = hex.slice(0, 6)
  } else {
    return null
  }

  return channelsFromTriplet(
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  )
}

function parseTriplet(raw: string): ColorChannels | null {
  const parts = raw
    .replace(/^[Rr][Gg][Bb][Aa]?\(/, '')
    .replace(/\)$/, '')
    .split(/[\s,;/|]+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length < 3) return null

  const values = parts.slice(0, 3).map((part) => {
    if (part.endsWith('%')) {
      const percent = Number.parseFloat(part.slice(0, -1))
      if (!Number.isFinite(percent)) return Number.NaN
      return (percent / 100) * 255
    }
    return Number.parseFloat(part)
  })

  return channelsFromTriplet(values[0], values[1], values[2])
}

/** 解析 #hex / 0xRRGGBB / rgb() / R,G,B 等写法。 */
export function parseColor(input: string): ParseColorResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { ok: false, error: '请输入颜色值' }
  }

  const hexCandidate = trimmed.match(/^(?:#|0x)?[0-9a-fA-F]{3,8}$/i)
  if (hexCandidate) {
    const color = parseHex(trimmed)
    if (!color) {
      return { ok: false, error: '无法解析十六进制颜色' }
    }
    return { ok: true, color }
  }

  const color = parseTriplet(trimmed)
  if (!color) {
    return {
      ok: false,
      error: '无法解析，请使用 #RRGGBB、rgb(r,g,b) 或 R,G,B',
    }
  }
  return { ok: true, color }
}

/** RGB ↔ BGR：交换 R 与 B。 */
export function swapRgbBgr(color: ColorChannels): ColorChannels {
  return { r: color.b, g: color.g, b: color.r }
}

export function toHex(color: ColorChannels, withHash = true): string {
  const hex = [color.r, color.g, color.b]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
  return withHash ? `#${hex}` : hex
}

export function toCssRgb(color: ColorChannels): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`
}

export function toCsv(color: ColorChannels): string {
  return `${color.r}, ${color.g}, ${color.b}`
}
