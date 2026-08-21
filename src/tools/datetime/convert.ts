export type InputKind = 'auto' | 'unix-s' | 'unix-ms' | 'iso'

export interface DateTimeFormats {
  unixSeconds: string
  unixMillis: string
  isoUtc: string
  isoLocal: string
  localString: string
  utcString: string
  localYmdHms: string
  relative: string
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatLocalYmdHms(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatIsoLocal(date: Date) {
  const offsetMin = -date.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const oh = pad(Math.floor(abs / 60))
  const om = pad(abs % 60)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3, '0')}${sign}${oh}:${om}`
}

export function formatRelative(date: Date, now = Date.now()) {
  const diffMs = date.getTime() - now
  const abs = Math.abs(diffMs)
  const past = diffMs < 0
  const suffix = past ? '前' : '后'

  if (abs < 1000) return '刚刚'

  const sec = Math.round(abs / 1000)
  if (sec < 60) return `${sec} 秒${suffix}`

  const min = Math.round(sec / 60)
  if (min < 60) return `${min} 分钟${suffix}`

  const hour = Math.round(min / 60)
  if (hour < 48) return `${hour} 小时${suffix}`

  const day = Math.round(hour / 24)
  if (day < 60) return `${day} 天${suffix}`

  const month = Math.round(day / 30)
  if (month < 24) return `${month} 个月${suffix}`

  const year = Math.round(day / 365)
  return `${year} 年${suffix}`
}

function parseUnixNumber(raw: string, kind: 'unix-s' | 'unix-ms' | 'auto') {
  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    throw new Error('不是有效数字时间戳')
  }
  const value = Number(raw)
  if (!Number.isFinite(value)) {
    throw new Error('时间戳超出可解析范围')
  }

  let ms: number
  if (kind === 'unix-s') {
    ms = value * 1000
  } else if (kind === 'unix-ms') {
    ms = value
  } else {
    // 当前时代：秒约 1e9，毫秒约 1e12
    ms = Math.abs(value) >= 1e11 ? value : value * 1000
  }

  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) {
    throw new Error('时间戳无效')
  }
  return date
}

export function parseDateTimeInput(input: string, kind: InputKind): Date {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('请输入时间')
  }

  if (kind === 'unix-s' || kind === 'unix-ms') {
    return parseUnixNumber(trimmed, kind)
  }

  if (kind === 'iso') {
    const date = new Date(trimmed)
    if (Number.isNaN(date.getTime())) {
      throw new Error('无法解析为日期时间')
    }
    return date
  }

  // auto
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseUnixNumber(trimmed, 'auto')
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    throw new Error('无法解析；可试 Unix 时间戳或 ISO 8601')
  }
  return date
}

export function formatDateTime(date: Date, now = Date.now()): DateTimeFormats {
  return {
    unixSeconds: String(Math.floor(date.getTime() / 1000)),
    unixMillis: String(date.getTime()),
    isoUtc: date.toISOString(),
    isoLocal: formatIsoLocal(date),
    localString: date.toLocaleString(undefined, { hour12: false }),
    utcString: date.toLocaleString(undefined, {
      hour12: false,
      timeZone: 'UTC',
      timeZoneName: 'short',
    }),
    localYmdHms: formatLocalYmdHms(date),
    relative: formatRelative(date, now),
  }
}
